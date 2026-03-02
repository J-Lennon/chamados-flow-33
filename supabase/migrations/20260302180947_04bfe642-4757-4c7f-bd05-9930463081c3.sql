
-- Allow agents to read all user_roles (needed for user management)
CREATE POLICY "Agents can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'agent'::app_role));

-- Fix ticket_messages RLS: allow requester to view ALL messages on their ticket (including internal)
DROP POLICY IF EXISTS "Users can view messages from their tickets" ON public.ticket_messages;

CREATE POLICY "Users can view messages from their tickets"
ON public.ticket_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = ticket_messages.ticket_id
    AND (
      tickets.requester_id = auth.uid()
      OR tickets.assigned_to = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'agent'::app_role)
    )
  )
);

-- Allow requester to send messages on their own tickets
DROP POLICY IF EXISTS "Users can create messages" ON public.ticket_messages;

CREATE POLICY "Users can create messages"
ON public.ticket_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM tickets
    WHERE tickets.id = ticket_messages.ticket_id
    AND (
      tickets.requester_id = auth.uid()
      OR tickets.assigned_to = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'agent'::app_role)
    )
  )
);
