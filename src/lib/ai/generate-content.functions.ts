import { supabase } from "@/integrations/supabase/client";

export type TipoDeGeracao =
  | "gerar_temas"
  | "gerar_mais_temas"
  | "gerar_ideias"
  | "gerar_ideias_parecidas"
  | "gerar_legenda"
  | "gerar_hashtags"
  | "gerar_carrossel"
  | "gerar_roteiro_video"
  | "responder_chat_etapa"
  | "recomendar_formato"
  | "gerar_cronograma"
  | "interpretar_cronograma_personalizado"
  | "executar_tarefa_cronograma"
  | "remix_inteligente"
  | "deixar_mais_diferente"
  | "deixar_mais_viral"
  | "deixar_mais_vendedor"
  | "trocar_formato"
  | "melhorar_legenda"
  | "remix_pesquisas"
  | "remix_analise_referencia"
  | "remix_final"
  | "resumo_perfil_conteudo";

export interface PerfilDeConteudo {
  nomeNegocio?: string;
  descricaoNegocio?: string;
  nichoPrincipal?: string;
  publicoAlvo?: string;
  cidadeRegiao?: string;
  objetivoPrincipal?: string;
  tomDeVoz?: string;
  palavrasQueUsa?: string;
  palavrasQueNaoUsa?: string;
  servicosPrincipais?: string;
  servicosMaisLucrativos?: string;
  promocoesRecorrentes?: string;
  formatosPreferidos?: string;
  formatosEvitar?: string;
  frequenciaPadrao?: string;
  diasPreferidos?: string;
  horariosPreferidos?: string;
  instagram?: string;
  whatsapp?: string;
  referencias?: unknown[];
  conteudosQueDeramCerto?: unknown[];
}

export interface GenerateInput {
  tipoDeGeracao: TipoDeGeracao;
  nicho?: string;
  objetivo?: string;
  tema?: string;
  formato?: string;
  pedidoPersonalizado?: string;
  mensagemUsuario?: string;
  etapaAtual?: string;
  perfilDeConteudo?: PerfilDeConteudo;
  cronogramaAtual?: unknown[];
  conteudosSalvos?: unknown[];
  tarefaSelecionada?: {
    dia?: string;
    tema?: string;
    formato?: string;
    titulo?: string;
    status?: string;
  };
  referenciaRemix?: {
    tipo?: string;
    texto?: string;
    link?: string;
    descricao?: string;
  };
  ideiaAtual?: { titulo?: string; legenda?: string; hashtags?: string; formato?: string };
  freq?: string;
  periodo?: string;
}

export type GenerateResponse =
  | { success: true; tipoDeGeracao: string; resumo: string; dados: string }
  | { success: false; erro: string; code?: string };

export async function generateContent(input: GenerateInput): Promise<GenerateResponse> {
  const { data, error } = await supabase.functions.invoke("generate-ai", {
    body: input,
  });
  if (error) {
    // supabase-js empacota status != 2xx em FunctionsHttpError mesmo com body JSON válido.
    const ctxResp = (error as { context?: { response?: Response } } | undefined)?.context?.response;
    if (ctxResp && typeof ctxResp.json === "function") {
      try {
        const body = await ctxResp.clone().json();
        if (body && typeof body === "object") return body as GenerateResponse;
      } catch { /* ignore */ }
    }
    console.error("[generateContent] invoke error:", error);
    return { success: false, erro: error.message ?? "Não foi possível gerar agora." };
  }
  return data as GenerateResponse;
}
