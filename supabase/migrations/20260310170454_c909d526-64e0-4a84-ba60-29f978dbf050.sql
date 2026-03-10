-- Add support level and escalation tracking to tickets
ALTER TABLE public.tickets 
  ADD COLUMN IF NOT EXISTS nivel_atendimento integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS escalated_from uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS escalated_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS escalation_reason text;

-- Create escalation history table
CREATE TABLE IF NOT EXISTS public.ticket_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  from_level integer NOT NULL,
  to_level integer NOT NULL,
  escalated_by uuid REFERENCES public.profiles(id),
  reason text,
  empresa_id uuid REFERENCES public.empresas(id),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ticket_escalations ENABLE ROW LEVEL SECURITY;

-- RLS: View escalations in own empresa
CREATE POLICY "View escalations in own empresa"
ON public.ticket_escalations
FOR SELECT
TO authenticated
USING (
  is_super_admin(auth.uid()) OR 
  (empresa_id = get_user_empresa_id(auth.uid()))
);

-- RLS: Agents/admins can insert escalations
CREATE POLICY "Agents insert escalations"
ON public.ticket_escalations
FOR INSERT
TO authenticated
WITH CHECK (
  empresa_id = get_user_empresa_id(auth.uid()) AND
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'))
);