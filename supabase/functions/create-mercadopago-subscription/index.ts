// Supabase Edge Function: create-mercadopago-subscription
// Cria uma assinatura recorrente (preapproval) no Mercado Pago e retorna a URL de checkout.
//
// Segurança:
// - Exige Authorization Bearer válido do Supabase.
// - Aceita apenas plan = "basic" | "premium".
// - Preço é definido NO BACKEND (nunca recebido do frontend).
// - Usa MERCADOPAGO_ACCESS_TOKEN dos Supabase Secrets (nunca logado).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const IS_PROD =
  (Deno.env.get("DENO_ENV") ?? Deno.env.get("ENVIRONMENT") ?? "production") === "production";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Plan = "basic" | "premium";

const PRICES: Record<Plan, { amount: number; reason: string }> = {
  basic: { amount: 24.9, reason: "RocketAI Basic — Assinatura mensal" },
  premium: { amount: 29.9, reason: "RocketAI Premium — Assinatura mensal" },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ erro: "method_not_allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return jsonResponse({ erro: "Não autenticado." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    const mpAccessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ erro: "Configuração do servidor indisponível." }, 500);
    }
    if (!mpAccessToken) {
      return jsonResponse({ erro: "Pagamentos indisponíveis no momento." }, 503);
    }

    // Identifica o usuário
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user?.email) {
      return jsonResponse({ erro: "Sessão inválida." }, 401);
    }
    const userId = userData.user.id;
    const userEmail = userData.user.email;

    // Valida input
    let body: { plan?: string; backUrl?: string };
    try {
      body = (await req.json()) as { plan?: string; backUrl?: string };
    } catch {
      return jsonResponse({ erro: "JSON inválido." }, 400);
    }
    const plan = body.plan as Plan | undefined;
    if (plan !== "basic" && plan !== "premium") {
      return jsonResponse({ erro: "Plano inválido." }, 400);
    }
    const price = PRICES[plan];

    // back_url: deve voltar para uma página real do app (Configurações)
    const origin = req.headers.get("origin") ?? "";
    const fallback = body.backUrl && /^https?:\/\//.test(body.backUrl) ? body.backUrl : null;
    const backUrl =
      (fallback && fallback) ||
      (origin ? `${origin}/configuracoes?subscription=pending` : "https://rocketai.lovable.app/configuracoes?subscription=pending");

    // Cria preapproval no Mercado Pago
    const mpPayload = {
      reason: price.reason,
      external_reference: JSON.stringify({ user_id: userId, plan, email: userEmail }),
      payer_email: userEmail,
      back_url: backUrl,
      status: "pending",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: price.amount,
        currency_id: "BRL",
      },
    };

    const mpRes = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mpAccessToken}`,
      },
      body: JSON.stringify(mpPayload),
    });

    const mpJson = (await mpRes.json().catch(() => ({}))) as {
      id?: string;
      init_point?: string;
      sandbox_init_point?: string;
      message?: string;
    };

    if (!mpRes.ok || !mpJson.init_point) {
      if (!IS_PROD) console.error("[create-mp-subscription] MP error", mpRes.status, mpJson);
      else console.error("[create-mp-subscription] MP error", mpRes.status);
      return jsonResponse({ erro: "Não foi possível iniciar o checkout." }, 502);
    }

    return jsonResponse({
      checkoutUrl: mpJson.init_point,
      preapprovalId: mpJson.id,
      plan,
    });
  } catch (err) {
    if (!IS_PROD) console.error("[create-mp-subscription] erro:", err);
    else console.error("[create-mp-subscription] erro interno");
    return jsonResponse({ erro: "Não foi possível iniciar o checkout." }, 500);
  }
});
