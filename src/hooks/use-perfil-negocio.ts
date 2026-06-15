import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type PerfilNegocio = {
  nome: string;
  nicho: string;
  tom: string;
  publico: string;
  objetivo: string;
  instagram: string;
  whatsapp: string;
};

const EMPTY: PerfilNegocio = {
  nome: "",
  nicho: "",
  tom: "",
  publico: "",
  objetivo: "",
  instagram: "",
  whatsapp: "",
};

export function usePerfilNegocio() {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState<PerfilNegocio>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("perfis_conteudo")
        .select("nome_negocio,nicho,tom_voz,publico_alvo,objetivo,instagram,whatsapp")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setPerfil({
          nome: data.nome_negocio ?? "",
          nicho: data.nicho ?? "",
          tom: data.tom_voz ?? "",
          publico: data.publico_alvo ?? "",
          objetivo: data.objetivo ?? "",
          instagram: data.instagram ?? "",
          whatsapp: data.whatsapp ?? "",
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const salvar = useCallback(
    async (p: PerfilNegocio) => {
      if (!user) return { error: new Error("Sem usuário") };
      setSaving(true);
      const { error } = await supabase.from("perfis_conteudo").upsert(
        {
          user_id: user.id,
          nome_negocio: p.nome,
          nicho: p.nicho,
          tom_voz: p.tom,
          publico_alvo: p.publico,
          objetivo: p.objetivo,
          instagram: p.instagram,
          whatsapp: p.whatsapp,
        },
        { onConflict: "user_id" },
      );
      setSaving(false);
      if (!error) setPerfil(p);
      return { error };
    },
    [user],
  );

  return { perfil, setPerfil, salvar, loading, saving };
}

export function perfilParaIA(p: PerfilNegocio, extras?: { referencias?: unknown[]; conteudosQueDeramCerto?: unknown[] }) {
  return {
    nomeNegocio: p.nome || undefined,
    nichoPrincipal: p.nicho || undefined,
    tomDeVoz: p.tom || undefined,
    publicoAlvo: p.publico || undefined,
    objetivoPrincipal: p.objetivo || undefined,
    instagram: p.instagram || undefined,
    whatsapp: p.whatsapp || undefined,
    referencias: extras?.referencias,
    conteudosQueDeramCerto: extras?.conteudosQueDeramCerto,
  };
}
