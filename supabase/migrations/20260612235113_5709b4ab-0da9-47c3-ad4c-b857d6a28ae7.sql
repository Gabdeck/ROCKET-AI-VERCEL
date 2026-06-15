CREATE TABLE public.perfis_conteudo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  nome_negocio text,
  nicho text,
  tom_voz text,
  publico_alvo text,
  objetivo text,
  instagram text,
  whatsapp text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.perfis_conteudo TO authenticated;
GRANT ALL ON public.perfis_conteudo TO service_role;

ALTER TABLE public.perfis_conteudo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam seu próprio perfil"
  ON public.perfis_conteudo
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER perfis_conteudo_set_updated_at
  BEFORE UPDATE ON public.perfis_conteudo
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();