-- Adicionar coluna de cidade na tabela tickets
ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS city TEXT;