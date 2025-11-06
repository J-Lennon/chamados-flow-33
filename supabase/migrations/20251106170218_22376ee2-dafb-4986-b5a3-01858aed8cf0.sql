-- Criar função para definir SLA automaticamente ao criar ticket
CREATE OR REPLACE FUNCTION public.set_ticket_sla()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Define SLA como 10 dias a partir da data de criação
  NEW.sla_due_date := NEW.created_at + INTERVAL '10 days';
  RETURN NEW;
END;
$$;

-- Criar trigger para definir SLA ao inserir novo ticket
DROP TRIGGER IF EXISTS set_sla_on_insert ON public.tickets;
CREATE TRIGGER set_sla_on_insert
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ticket_sla();