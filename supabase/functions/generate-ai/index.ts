// Supabase Edge Function: generate-ai
// Recebe { tipoDeGeracao, ...inputs } e chama a API do Gemini 2.5 Flash usando GEMINI_ROCKET_AI.
// Requer Authorization: Bearer <jwt> válido do Supabase.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const MASTER_PROMPT = `Você é a IA estratégica do RocketAI.

O RocketAI é um aplicativo que ajuda pequenos negócios, criadores, autônomos e social medias a criarem conteúdo para Instagram e TikTok sem depender de criatividade.

Sua função é agir como um social media especialista, estrategista de conteúdo, copywriter e planejador editorial.

Você NUNCA deve responder de forma genérica. Adapte sempre ao contexto do usuário considerando obrigatoriamente: nicho, objetivo, tema, formato, tom de voz, público-alvo, serviços/produtos, cidade/região (quando existir), conteúdos que deram certo, referências do usuário, pedido personalizado, etapa atual do app, e tarefa do cronograma (se houver).

Escreva em português do Brasil, simples, claro, prático e útil. Ajude usuários leigos.

EVITE: respostas vagas, ideias repetidas, textos genéricos, sugestões que servem para qualquer nicho, promessas exageradas, linguagem robótica, copiar literalmente referências enviadas.

PRIORIZE: ganchos fortes, clareza, consistência, conteúdo acionável, CTAs claras, personalização, variação de ideias, aplicação prática.

Quando o usuário pedir ideias, gere ideias completas e diferentes entre si. Cada tema deve produzir ideias coerentes com ele.

Quando gerar cronograma, RESPEITE o pedido personalizado acima das opções padrão.

Em Remix Inteligente: analise estrutura, gancho, tom, objetivo e formato. Crie uma nova versão adaptada ao nicho do usuário, sem copiar frases literalmente.

REGRA DE SAÍDA CRÍTICA: toda resposta deve ser um objeto JSON válido, sem markdown, sem crases, sem texto fora do JSON. Apenas o objeto JSON puro.`;

const SCHEMAS: Record<string, string> = {
  gerar_temas: `{ "temas": [ { "titulo": "string", "descricao": "string", "objetivoDoTema": "string" } ] } — gere pelo menos 6 temas`,
  gerar_mais_temas: `{ "temas": [ { "titulo": "string", "descricao": "string", "objetivoDoTema": "string" } ] } — gere 6 temas NOVOS`,
  gerar_ideias: `{ "ideias": [ { "titulo": "string", "explicacao": "string", "legenda": "string", "hashtags": ["string"], "formatoRecomendado": "Foto | Carrossel | Vídeo", "cta": "string", "motivoDaIdeia": "string" } ] } — exatamente 3 ideias`,
  gerar_ideias_parecidas: `{ "ideias": [ { "titulo": "string", "explicacao": "string", "legenda": "string", "hashtags": ["string"], "formatoRecomendado": "Foto | Carrossel | Vídeo", "cta": "string", "motivoDaIdeia": "string" } ] } — exatamente 3 ideias parecidas`,
  gerar_legenda: `{ "legenda": "string", "hashtags": ["string"] }`,
  gerar_hashtags: `{ "hashtags": ["string"] }`,
  gerar_carrossel: `{ "tituloCarrossel": "string", "estruturaCarrossel": [ { "slide": 1, "texto": "string", "orientacaoVisual": "string" } ], "legenda": "string", "hashtags": ["string"] } — 5 a 7 slides`,
  gerar_roteiro_video: `{ "tituloVideo": "string", "tipoVideo": "string", "duracaoRecomendada": "string", "roteiroVideo": [ { "cena": 1, "instrucaoDeGravacao": "string", "textoNaTela": "string", "falaOuLegenda": "string" } ], "legenda": "string", "hashtags": ["string"] }`,
  responder_chat_etapa: `{ "respostaChat": "string", "sugestoes": ["string"], "proximoPasso": "string" }`,
  recomendar_formato: `{ "formatoRecomendado": "Foto | Carrossel | Vídeo", "justificativa": "string", "alternativa": "string", "botoes": ["Usar Foto", "Usar Carrossel", "Usar Vídeo"] }`,
  gerar_cronograma: `{ "cronograma": [ { "semana": "Semana 1", "dia": "Segunda-feira", "periodo": "Manhã | Tarde | Noite", "tema": "string", "formato": "Foto | Carrossel | Vídeo", "titulo": "string", "objetivoDoPost": "string", "status": "Pendente" } ], "resumoCronograma": "string" }`,
  interpretar_cronograma_personalizado: `{ "interpretacao": { "dias": ["string"], "frequencia": "string", "quantidadePorDia": "string", "formatosPreferidos": ["string"], "formatosEvitar": ["string"], "prioridades": ["string"], "totalEstimado": "string" }, "resumo": "string", "precisaConfirmar": true }`,
  executar_tarefa_cronograma: `{ "tarefa": { "tema": "string", "formato": "string", "titulo": "string" }, "ideias": [ { "titulo": "string", "explicacao": "string", "legenda": "string", "hashtags": ["string"], "formatoRecomendado": "string" } ] }`,
  remix_inteligente: `{ "analiseReferencia": { "estrutura": "string", "gancho": "string", "tom": "string", "objetivo": "string", "formato": "string" }, "novaVersao": { "titulo": "string", "explicacao": "string", "legenda": "string", "hashtags": ["string"], "formatoRecomendado": "Foto | Carrossel | Vídeo", "estruturaCarrossel": [ { "slide": 1, "texto": "string" } ], "roteiroVideo": [ { "cena": 1, "instrucaoDeGravacao": "string", "textoNaTela": "string" } ] }, "nivelSemelhanca": "Baixo | Médio | Alto", "oQueFoiMantido": ["string"], "oQueFoiAlterado": ["string"] }`,
  deixar_mais_diferente: `{ "novaVersao": { "titulo": "string", "explicacao": "string", "legenda": "string", "hashtags": ["string"], "estruturaCarrossel": [ { "slide": 1, "texto": "string" } ] }, "oQueMudou": ["string"], "nivelSemelhanca": "Baixo" }`,
  deixar_mais_viral: `{ "novaVersao": { "titulo": "string", "explicacao": "string", "legenda": "string", "hashtags": ["string"], "estruturaCarrossel": [ { "slide": 1, "texto": "string" } ] }, "ganchoNovo": "string", "porqueViraliza": "string" }`,
  deixar_mais_vendedor: `{ "novaVersao": { "titulo": "string", "explicacao": "string", "legenda": "string", "hashtags": ["string"], "estruturaCarrossel": [ { "slide": 1, "texto": "string" } ] }, "ctaNovo": "string", "canalRecomendado": "WhatsApp | Direct | Agendamento | Loja" }`,
  trocar_formato: `{ "formatoNovo": "Foto | Carrossel | Vídeo", "novaVersao": { "titulo": "string", "explicacao": "string", "legenda": "string", "hashtags": ["string"], "estruturaCarrossel": [ { "slide": 1, "texto": "string" } ], "roteiroVideo": [ { "cena": 1, "instrucaoDeGravacao": "string", "textoNaTela": "string" } ] } }`,
  melhorar_legenda: `{ "legenda": "string", "hashtags": ["string"], "oQueMelhorou": ["string"] }`,
  resumo_perfil_conteudo: `{ "resumo": "string", "oQueAIEntendeu": ["string"], "sugestoesParaMelhorar": ["string"] }`,
  remix_pesquisas: `{ "pesquisas": { "instagram": ["string","string","string","string","string"], "tiktok": ["string","string","string","string","string"], "reels": ["string","string","string","string","string"], "youtubeShorts": ["string","string","string","string","string"] }, "explicacao": "string" } — palavras-chave/termos de busca específicos do nicho, em português, prontos para colar na busca de cada plataforma`,
  remix_analise_referencia: `{ "analise": { "estrutura": "string", "gancho": "string", "storytelling": "string", "cta": "string", "ritmo": "string", "sequenciaCenas": "string", "tom": "string", "porqueFunciona": "string" } } — analise profunda da referência enviada (link ou texto). Se for só um link sem contexto, deduza pelo padrão da plataforma e nicho do usuário`,
  remix_final: `{ "novaVersao": { "titulo": "string", "formatoRecomendado": "Foto | Carrossel | Vídeo | Reels", "roteiro": [ { "cena": 1, "instrucao": "string", "textoNaTela": "string", "fala": "string" } ], "legenda": "string", "cta": "string", "hashtags": ["string"] }, "explicacaoEstrategica": "string", "oQueFoiPreservado": ["string"], "oQueFoiAdaptado": ["string"] } — gere um conteúdo otimizado para o resultado/objetivo escolhido, preservando os elementos selecionados, com intensidade e estilo definidos`,
};

const ALLOWED_TIPOS = new Set(Object.keys(SCHEMAS));

const REMIX_TIPOS = new Set([
  "remix_inteligente",
  "deixar_mais_diferente",
  "deixar_mais_viral",
  "deixar_mais_vendedor",
  "trocar_formato",
  "melhorar_legenda",
  "remix_pesquisas",
  "remix_analise_referencia",
  "remix_final",
]);

const BASIC_MONTHLY_LIMIT = 100;

const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Limites de validação do payload
const MAX_PAYLOAD_BYTES = 32 * 1024; // 32 KB
const MAX_PEDIDO_PERSONALIZADO = 2000;
const MAX_MENSAGEM_USUARIO = 2000;
const MAX_REFERENCIA_TEXTO = 4000;
const MAX_REFERENCIA_DESCRICAO = 2000;
const IS_PROD = (Deno.env.get("DENO_ENV") ?? Deno.env.get("ENVIRONMENT") ?? "production") === "production";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function safeParseJson<T>(raw: string): T {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned) as T;
}

function clamp(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  return v.length > max ? v.slice(0, max) : v;
}

function validateAndSanitize(input: Record<string, unknown>): { ok: true; data: Record<string, unknown> } | { ok: false; erro: string } {
  if (!input || typeof input !== "object") return { ok: false, erro: "Payload inválido." };

  const tipo = input.tipoDeGeracao;
  if (!tipo || typeof tipo !== "string") return { ok: false, erro: "tipoDeGeracao é obrigatório." };
  if (!ALLOWED_TIPOS.has(tipo)) return { ok: false, erro: "tipoDeGeracao inválido." };

  const sanitized: Record<string, unknown> = { ...input };
  if (typeof input.pedidoPersonalizado === "string") sanitized.pedidoPersonalizado = clamp(input.pedidoPersonalizado, MAX_PEDIDO_PERSONALIZADO);
  if (typeof input.mensagemUsuario === "string") sanitized.mensagemUsuario = clamp(input.mensagemUsuario, MAX_MENSAGEM_USUARIO);
  if (input.referenciaRemix && typeof input.referenciaRemix === "object") {
    const r = input.referenciaRemix as Record<string, unknown>;
    sanitized.referenciaRemix = {
      ...r,
      texto: clamp(r.texto, MAX_REFERENCIA_TEXTO) ?? r.texto,
      descricao: clamp(r.descricao, MAX_REFERENCIA_DESCRICAO) ?? r.descricao,
    };
  }
  return { ok: true, data: sanitized };
}

function buildUserPrompt(input: Record<string, unknown>): string {
  const tipo = String(input.tipoDeGeracao ?? "");
  const schema = SCHEMAS[tipo] ?? `{ "resultado": "string" }`;
  return `CONTEXTO DO USUÁRIO (JSON):
${JSON.stringify(input, null, 2)}

TIPO DE GERAÇÃO: ${tipo}

SCHEMA DE SAÍDA OBRIGATÓRIO (retorne SOMENTE este objeto JSON, sem markdown, sem texto extra):
${schema}

Retorne agora o JSON conforme o schema acima, em português do Brasil, totalmente personalizado para o contexto.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1) Auth: exigir Authorization Bearer e validar via Supabase
    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return jsonResponse({ success: false, erro: "Não autenticado." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ success: false, erro: "Configuração do servidor indisponível." }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse({ success: false, erro: "Sessão inválida ou expirada." }, 401);
    }
    const userId = userData.user.id;

    // Service-role client para checar plano e uso (RPCs revogadas para roles públicos)
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const adminClient = serviceKey
      ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
      : null;

    // 2) Tamanho do payload
    const rawBody = await req.text();
    if (rawBody.length > MAX_PAYLOAD_BYTES) {
      return jsonResponse({ success: false, erro: "Payload muito grande." }, 413);
    }

    let parsedBody: Record<string, unknown>;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return jsonResponse({ success: false, erro: "JSON inválido." }, 400);
    }

    const v = validateAndSanitize(parsedBody);
    if (!v.ok) return jsonResponse({ success: false, erro: v.erro }, 400);
    const input = v.data;

    // 3) Chave da IA — nunca expor
    const apiKey = Deno.env.get("GEMINI_ROCKET_AI");
    if (!apiKey) {
      return jsonResponse({ success: false, erro: "Serviço de IA indisponível no momento." }, 503);
    }

    const tipo = String(input.tipoDeGeracao);

    // 4) Plano e limites — requer assinatura ATIVA (basic ou premium)
    let plan: "basic" | "premium" | null = null;
    if (adminClient) {
      const { data: planData } = await adminClient.rpc("get_user_plan", { _user_id: userId });
      if (planData === "premium") plan = "premium";
      else if (planData === "basic") plan = "basic";
    }

    if (!plan) {
      return jsonResponse({
        success: false,
        erro: "Você precisa de uma assinatura ativa para usar a RocketAI.",
        code: "no_active_subscription",
      }, 402);
    }

    // Remix é exclusivo do Premium
    if (REMIX_TIPOS.has(tipo) && plan !== "premium") {
      return jsonResponse({
        success: false,
        erro: "O Remix Inteligente faz parte do RocketAI Premium.",
        code: "premium_required",
      }, 403);
    }

    // Limite mensal do Basic
    if (plan === "basic" && adminClient) {
      const month = new Date().toISOString().slice(0, 7);
      const { data: usage } = await adminClient
        .from("user_usage")
        .select("generation_count")
        .eq("user_id", userId)
        .eq("month", month)
        .maybeSingle();
      const count = usage?.generation_count ?? 0;
      if (count >= BASIC_MONTHLY_LIMIT) {
        return jsonResponse({
          success: false,
          erro: "Você utilizou as 100 gerações disponíveis do plano Basic neste mês. Faça upgrade para o RocketAI Premium e tenha gerações ilimitadas.",
          code: "basic_limit_reached",
        }, 429);
      }
    }

    const userPrompt = buildUserPrompt(input);
    const temperature = tipo.includes("cronograma") ? 0.6 : 0.9;

    const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { role: "system", parts: [{ text: MASTER_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature, responseMimeType: "application/json" },
      }),
    });

    if (!res.ok) {
      if (!IS_PROD) {
        const errText = await res.text();
        console.error("[gemini] HTTP", res.status, errText);
      } else {
        console.error("[gemini] HTTP", res.status);
      }
      if (res.status === 429) {
        return jsonResponse({ success: false, erro: "Muitas requisições. Tente novamente em instantes." }, 429);
      }
      if (res.status === 401 || res.status === 403) {
        return jsonResponse({ success: false, erro: "Serviço de IA indisponível no momento." }, 502);
      }
      return jsonResponse({ success: false, erro: "Serviço de IA indisponível no momento." }, 502);
    }

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!raw) {
      return jsonResponse({ success: false, erro: "Resposta vazia da IA" }, 502);
    }

    let parsed: { resumo?: string };
    try {
      parsed = safeParseJson<{ resumo?: string }>(raw);
    } catch (e) {
      if (!IS_PROD) console.error("[generate-ai] JSON inválido:", e, raw);
      else console.error("[generate-ai] JSON inválido da IA");
      return jsonResponse({ success: false, erro: "A IA respondeu em formato inválido. Tente novamente." }, 200);
    }

    // Incrementa uso somente em geração bem-sucedida (Basic conta limite; Premium para métricas)
    if (adminClient) {
      try {
        await adminClient.rpc("increment_user_usage", { _user_id: userId });
      } catch (e) {
        if (!IS_PROD) console.error("[generate-ai] increment_user_usage", e);
      }
    }

    return jsonResponse({
      success: true,
      tipoDeGeracao: tipo,
      resumo: typeof parsed.resumo === "string" ? parsed.resumo : "",
      dados: JSON.stringify(parsed ?? {}),
    });
  } catch (err) {
    if (!IS_PROD) console.error("[generate-ai] erro:", err);
    else console.error("[generate-ai] erro interno");
    return jsonResponse({ success: false, erro: "Não foi possível gerar agora. Tente novamente." }, 500);
  }
});
