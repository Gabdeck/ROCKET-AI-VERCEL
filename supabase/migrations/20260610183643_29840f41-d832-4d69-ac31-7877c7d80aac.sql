
CREATE TABLE public.conteudos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nicho TEXT,
  objetivo TEXT,
  tema TEXT,
  formato TEXT,
  titulo TEXT,
  legenda TEXT,
  hashtags TEXT,
  roteiro_video TEXT,
  estrutura_carrossel JSONB,
  status TEXT NOT NULL DEFAULT 'ideia',
  data_postagem TIMESTAMPTZ,
  origem TEXT NOT NULL DEFAULT 'gerador' CHECK (origem IN ('gerador','remix')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conteudos TO authenticated;
GRANT ALL ON public.conteudos TO service_role;

ALTER TABLE public.conteudos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam seus próprios conteúdos"
  ON public.conteudos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER conteudos_set_updated_at
  BEFORE UPDATE ON public.conteudos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX conteudos_user_id_idx ON public.conteudos(user_id);
CREATE INDEX conteudos_status_idx ON public.conteudos(status);
