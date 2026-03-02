
-- Fix profiles: restrict to authenticated users, with role-based scoping
DROP POLICY "Users can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'agent'::app_role)
  OR EXISTS (
    SELECT 1 FROM tickets
    WHERE (tickets.requester_id = auth.uid() OR tickets.assigned_to = auth.uid())
      AND (tickets.requester_id = profiles.id OR tickets.assigned_to = profiles.id)
  )
);

-- Fix tickets: restrict to participants + admins/agents
DROP POLICY "Users can view all tickets" ON public.tickets;

CREATE POLICY "Users can view relevant tickets"
ON public.tickets FOR SELECT
TO authenticated
USING (
  requester_id = auth.uid()
  OR assigned_to = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'agent'::app_role)
);
