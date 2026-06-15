
CREATE TABLE public.referencias_sucesso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('link','descricao')),
  url TEXT,
  descricao TEXT,
  motivo TEXT,
  resultado TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.referencias_sucesso TO authenticated;
GRANT ALL ON public.referencias_sucesso TO service_role;

ALTER TABLE public.referencias_sucesso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam suas próprias referências"
ON public.referencias_sucesso FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_referencias_sucesso_updated_at
BEFORE UPDATE ON public.referencias_sucesso
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_referencias_sucesso_user ON public.referencias_sucesso(user_id);
