import { supabase } from "@/integrations/supabase/client";

export type SalvarConteudoInput = {
  user_id: string;
  nicho?: string | null;
  objetivo?: string | null;
  tema?: string | null;
  formato?: string | null;
  titulo?: string | null;
  legenda?: string | null;
  hashtags?: string | null;
  roteiro_video?: string | null;
  estrutura_carrossel?: unknown | null;
  status?: string;
  origem?: string;
};

export async function salvarConteudo(input: SalvarConteudoInput) {
  return supabase.from("conteudos").insert({
    user_id: input.user_id,
    nicho: input.nicho ?? null,
    objetivo: input.objetivo ?? null,
    tema: input.tema ?? null,
    formato: input.formato ?? null,
    titulo: input.titulo ?? null,
    legenda: input.legenda ?? null,
    hashtags: input.hashtags ?? null,
    roteiro_video: input.roteiro_video ?? null,
    // deno/json coercion handled by supabase-js
    estrutura_carrossel: (input.estrutura_carrossel ?? null) as never,
    status: input.status ?? "ideia",
    origem: input.origem ?? "gerador",
  });
}
