
-- Explicitly block direct user modifications to audit log
CREATE POLICY "Block direct inserts to ticket history"
ON public.ticket_history
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Block updates to ticket history"
ON public.ticket_history
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Block deletes from ticket history"
ON public.ticket_history
FOR DELETE
TO authenticated
USING (false);
