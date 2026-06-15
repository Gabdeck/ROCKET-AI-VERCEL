// Supabase Edge Function: mercadopago-webhook
// Recebe notificações do Mercado Pago para assinaturas (preapproval) e pagamentos
// (incluindo Pix), e atualiza public.subscriptions + public.profiles.plan.
//
// Segurança:
// - Sempre responde 200 rápido (MP exige) para evitar reenvios em loop.
// - Usa MERCADOPAGO_ACCESS_TOKEN dos Supabase Secrets (nunca logado).
// - Confia somente no recurso buscado direto na API do Mercado Pago,
//   nunca no payload do webhook.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-signature, x-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const IS_PROD =
  (Deno.env.get("DENO_ENV") ?? Deno.env.get("ENVIRONMENT") ?? "production") === "production";

function ok(body: unknown = { received: true }, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type MPEvent = {
  type?: string;
  action?: string;
  data?: { id?: string };
};

type MPPreapproval = {
  id?: string;
  status?: string;
  external_reference?: string;
  payer_email?: string;
  reason?: string;
};

type MPPayment = {
  id?: number | string;
  status?: string;
  external_reference?: string;
  preapproval_id?: string;
  payment_method_id?: string;
  payment_type_id?: string;
  payer?: { email?: string };
  metadata?: Record<string, unknown>;
  transaction_amount?: number;
};

function mapPreapprovalStatus(
  mp: string | undefined,
): "active" | "pending" | "cancelled" | "expired" | "paused" {
  switch ((mp ?? "").toLowerCase()) {
    case "authorized":
    case "approved":
    case "active":
      return "active";
    case "paused":
      return "paused";
    case "cancelled":
    case "canceled":
      return "cancelled";
    case "finished":
    case "expired":
      return "expired";
    case "pending":
    default:
      return "pending";
  }
}

function parseExternalRef(
  raw: string | undefined,
): { user_id?: string; plan?: "basic" | "premium"; type?: string } {
  if (!raw) return {};
  try {
    const j = JSON.parse(raw) as { user_id?: string; plan?: string; type?: string };
    return {
      user_id: typeof j.user_id === "string" ? j.user_id : undefined,
      plan: j.plan === "basic" || j.plan === "premium" ? j.plan : undefined,
      type: typeof j.type === "string" ? j.type : undefined,
    };
  } catch {
    return {};
  }
}

async function verifyMpSignature(
  req: Request,
  secret: string,
  dataId: string | undefined,
): Promise<boolean> {
  const xSig = req.headers.get("x-signature");
  const xReqId = req.headers.get("x-request-id");
  if (!xSig || !xReqId || !dataId) return false;

  let ts = "";
  let v1 = "";
  for (const part of xSig.split(",")) {
    const [k, v] = part.split("=").map((s) => s?.trim());
    if (k === "ts") ts = v ?? "";
    else if (k === "v1") v1 = v ?? "";
  }
  if (!ts || !v1) return false;

  const template = `id:${dataId};request-id:${xReqId};ts:${ts};`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(template));
  const expected = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (expected.length !== v1.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return ok({ error: "method_not_allowed" }, 405);

  try {
    const rawBody = await req.text();
    let event: MPEvent = {};
    try {
      event = JSON.parse(rawBody) as MPEvent;
    } catch {
      /* MP às vezes envia apenas query string */
    }

    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    const mpWebhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!mpAccessToken || !supabaseUrl || !serviceKey) {
      if (!IS_PROD) console.error("[mp-webhook] missing env");
      return ok({ received: true });
    }

    const url0 = new URL(req.url);
    const dataIdForSig =
      event.data?.id ?? url0.searchParams.get("data.id") ?? url0.searchParams.get("id") ?? undefined;

    if (!mpWebhookSecret) {
      if (!IS_PROD) console.error("[mp-webhook] missing webhook secret");
      return new Response(JSON.stringify({ error: "unconfigured" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const valid = await verifyMpSignature(req, mpWebhookSecret, dataIdForSig ? String(dataIdForSig) : undefined);
    if (!valid) {
      return new Response(JSON.stringify({ error: "invalid_signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const url = url0;
    const topic = (event.type ?? url.searchParams.get("type") ?? "").toLowerCase();
    const qId = url.searchParams.get("id") ?? url.searchParams.get("data.id");
    const id = event.data?.id ?? qId ?? undefined;
    if (!id) return ok({ received: true });

    // ---------- PREAPPROVAL (assinatura recorrente por cartão) ----------
    if (topic.includes("preapproval") || topic === "subscription_preapproval") {
      const r = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
        headers: { Authorization: `Bearer ${mpAccessToken}` },
      });
      if (!r.ok) return ok({ received: true });
      const preapproval = (await r.json()) as MPPreapproval;

      const { user_id, plan } = parseExternalRef(preapproval.external_reference);
      if (!user_id || !plan) return ok({ received: true });

      const status = mapPreapprovalStatus(preapproval.status);
      const mpSubId = preapproval.id ?? id;

      const { data: existing } = await admin
        .from("subscriptions")
        .select("id")
        .eq("mercadopago_subscription_id", mpSubId)
        .maybeSingle();

      const payload = {
        user_id,
        plan,
        status,
        payment_method: "card",
        current_period_end: null, // recorrente: sem expiração local
        mercadopago_subscription_id: mpSubId,
        payer_email: preapproval.payer_email ?? null,
        updated_at: new Date().toISOString(),
      };

      if (existing?.id) {
        await admin.from("subscriptions").update(payload).eq("id", existing.id);
      } else {
        await admin.from("subscriptions").insert(payload);
      }

      if (status === "active") {
        await admin.from("profiles").update({ plan }).eq("user_id", user_id);
      }
      return ok({ received: true });
    }

    // ---------- PAYMENT (Pix ou pagamento avulso) ----------
    if (topic.includes("payment")) {
      const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { Authorization: `Bearer ${mpAccessToken}` },
      });
      if (!r.ok) return ok({ received: true });
      const pay = (await r.json()) as MPPayment;

      // Pagamento vinculado a uma assinatura (preapproval) → tratar via preapproval
      if (pay.preapproval_id) {
        const pr = await fetch(`https://api.mercadopago.com/preapproval/${pay.preapproval_id}`, {
          headers: { Authorization: `Bearer ${mpAccessToken}` },
        });
        if (pr.ok) {
          const preapproval = (await pr.json()) as MPPreapproval;
          const { user_id, plan } = parseExternalRef(preapproval.external_reference);
          if (user_id && plan) {
            const status = mapPreapprovalStatus(preapproval.status);
            const mpSubId = preapproval.id ?? pay.preapproval_id;
            const { data: existing } = await admin
              .from("subscriptions")
              .select("id")
              .eq("mercadopago_subscription_id", mpSubId)
              .maybeSingle();
            const payload = {
              user_id,
              plan,
              status,
              payment_method: "card",
              current_period_end: null,
              mercadopago_subscription_id: mpSubId,
              payer_email: preapproval.payer_email ?? null,
              updated_at: new Date().toISOString(),
            };
            if (existing?.id) {
              await admin.from("subscriptions").update(payload).eq("id", existing.id);
            } else {
              await admin.from("subscriptions").insert(payload);
            }
            if (status === "active") {
              await admin.from("profiles").update({ plan }).eq("user_id", user_id);
            }
          }
        }
        return ok({ received: true });
      }

      // Pagamento Pix (avulso) → libera 30 dias
      const isPix =
        (pay.payment_method_id ?? "").toLowerCase() === "pix" ||
        (pay.payment_type_id ?? "").toLowerCase() === "pix";

      const { user_id, plan, type } = parseExternalRef(pay.external_reference);
      // fallback: metadata
      const meta = (pay.metadata ?? {}) as { user_id?: string; plan?: string; type?: string };
      const effUserId = user_id ?? (typeof meta.user_id === "string" ? meta.user_id : undefined);
      const effPlan =
        plan ?? (meta.plan === "basic" || meta.plan === "premium" ? meta.plan : undefined);
      const effType = type ?? (typeof meta.type === "string" ? meta.type : undefined);

      if (!effUserId || !effPlan) return ok({ received: true });
      if (!isPix && effType !== "pix") return ok({ received: true });

      const payStatus = (pay.status ?? "").toLowerCase();
      const paymentId = String(pay.id ?? id);

      // Idempotência por payment id
      const { data: existing } = await admin
        .from("subscriptions")
        .select("id")
        .eq("mercadopago_payment_id", paymentId)
        .maybeSingle();

      let subStatus: "active" | "pending" | "cancelled" | "expired" = "pending";
      let periodEnd: string | null = null;

      if (payStatus === "approved") {
        subStatus = "active";
        periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (payStatus === "rejected" || payStatus === "cancelled") {
        subStatus = "cancelled";
      } else if (payStatus === "refunded" || payStatus === "charged_back") {
        subStatus = "expired";
      } else {
        subStatus = "pending";
      }

      const payload = {
        user_id: effUserId,
        plan: effPlan,
        status: subStatus,
        payment_method: "pix",
        current_period_end: periodEnd,
        mercadopago_payment_id: paymentId,
        payer_email: pay.payer?.email ?? null,
        updated_at: new Date().toISOString(),
      };

      if (existing?.id) {
        await admin.from("subscriptions").update(payload).eq("id", existing.id);
      } else {
        await admin.from("subscriptions").insert(payload);
      }

      if (subStatus === "active") {
        await admin.from("profiles").update({ plan: effPlan }).eq("user_id", effUserId);
      }

      return ok({ received: true });
    }

    return ok({ received: true });
  } catch (err) {
    if (!IS_PROD) console.error("[mp-webhook] erro:", err);
    return ok({ received: true });
  }
});
