-- Alterar constraint de foreign key para permitir SET NULL ao deletar usuário
-- Isso permite que tickets continuem existindo mesmo quando o usuário solicitante é deletado

-- 1. Remover constraint antiga para requester_id
ALTER TABLE public.tickets
DROP CONSTRAINT IF EXISTS tickets_requester_id_fkey;

-- 2. Adicionar nova constraint com ON DELETE SET NULL para requester_id
ALTER TABLE public.tickets
ADD CONSTRAINT tickets_requester_id_fkey 
FOREIGN KEY (requester_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- 3. Tornar a coluna requester_id nullable (se ainda não for)
ALTER TABLE public.tickets
ALTER COLUMN requester_id DROP NOT NULL;

-- 4. Remover constraint antiga para assigned_to (se existir)
ALTER TABLE public.tickets
DROP CONSTRAINT IF EXISTS tickets_assigned_to_fkey;

-- 5. Adicionar nova constraint com ON DELETE SET NULL para assigned_to
ALTER TABLE public.tickets
ADD CONSTRAINT tickets_assigned_to_fkey 
FOREIGN KEY (assigned_to) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;