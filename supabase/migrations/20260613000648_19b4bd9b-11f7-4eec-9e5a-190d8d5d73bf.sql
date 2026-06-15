ALTER TABLE public.conteudos DROP CONSTRAINT IF EXISTS conteudos_origem_check;
ALTER TABLE public.conteudos ADD CONSTRAINT conteudos_origem_check CHECK (origem IN ('gerador','remix','cronograma'));