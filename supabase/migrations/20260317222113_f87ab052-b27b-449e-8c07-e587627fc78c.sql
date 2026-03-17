-- Allow deleting users while preserving historical records by nulling profile references
ALTER TABLE public.ticket_messages
ALTER COLUMN sender_id DROP NOT NULL;

ALTER TABLE public.ticket_messages
DROP CONSTRAINT IF EXISTS ticket_messages_sender_id_fkey;
ALTER TABLE public.ticket_messages
ADD CONSTRAINT ticket_messages_sender_id_fkey
FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.ticket_history
DROP CONSTRAINT IF EXISTS ticket_history_performed_by_fkey;
ALTER TABLE public.ticket_history
ADD CONSTRAINT ticket_history_performed_by_fkey
FOREIGN KEY (performed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.ticket_escalations
DROP CONSTRAINT IF EXISTS ticket_escalations_escalated_by_fkey;
ALTER TABLE public.ticket_escalations
ADD CONSTRAINT ticket_escalations_escalated_by_fkey
FOREIGN KEY (escalated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.tickets
DROP CONSTRAINT IF EXISTS tickets_escalated_from_fkey;
ALTER TABLE public.tickets
ADD CONSTRAINT tickets_escalated_from_fkey
FOREIGN KEY (escalated_from) REFERENCES public.profiles(id) ON DELETE SET NULL;