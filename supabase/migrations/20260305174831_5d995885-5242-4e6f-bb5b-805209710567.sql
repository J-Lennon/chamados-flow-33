
-- FASE 2: Multi-tenant architecture (part 2)

-- 1. Create empresas table
CREATE TABLE public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  plano text NOT NULL DEFAULT 'basic',
  data_contratacao timestamp with time zone NOT NULL DEFAULT now(),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- 2. Add empresa_id to all tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id);
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id);
ALTER TABLE public.ticket_messages ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id);
ALTER TABLE public.ticket_history ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id);
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS empresa_id uuid REFERENCES public.empresas(id);

-- 3. Helper functions
CREATE OR REPLACE FUNCTION public.get_user_empresa_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- 4. RLS for empresas
CREATE POLICY "Super admins can do everything on empresas"
  ON public.empresas FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view own empresa"
  ON public.empresas FOR SELECT TO authenticated
  USING (id = public.get_user_empresa_id(auth.uid()));

-- 5. Recreate profiles RLS
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "View profiles in own empresa"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR empresa_id = public.get_user_empresa_id(auth.uid())
    OR id = auth.uid()
  );

CREATE POLICY "Update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- 6. Recreate tickets RLS
DROP POLICY IF EXISTS "Users can view relevant tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Agents can update tickets" ON public.tickets;

CREATE POLICY "View tickets in own empresa"
  ON public.tickets FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (
      empresa_id = public.get_user_empresa_id(auth.uid())
      AND (requester_id = auth.uid() OR assigned_to = auth.uid()
           OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'))
    )
  );

CREATE POLICY "Create tickets in own empresa"
  ON public.tickets FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = requester_id
    AND empresa_id = public.get_user_empresa_id(auth.uid())
  );

CREATE POLICY "Update tickets in own empresa"
  ON public.tickets FOR UPDATE TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (
      empresa_id = public.get_user_empresa_id(auth.uid())
      AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'))
    )
  );

-- 7. Recreate ticket_messages RLS
DROP POLICY IF EXISTS "Users can create messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "Users can view messages from their tickets" ON public.ticket_messages;

CREATE POLICY "View messages in own empresa"
  ON public.ticket_messages FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (
      empresa_id = public.get_user_empresa_id(auth.uid())
      AND EXISTS (
        SELECT 1 FROM tickets WHERE tickets.id = ticket_messages.ticket_id
        AND (tickets.requester_id = auth.uid() OR tickets.assigned_to = auth.uid()
             OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'))
      )
    )
  );

CREATE POLICY "Create messages in own empresa"
  ON public.ticket_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND empresa_id = public.get_user_empresa_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM tickets WHERE tickets.id = ticket_messages.ticket_id
      AND (tickets.requester_id = auth.uid() OR tickets.assigned_to = auth.uid()
           OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'))
    )
  );

-- 8. Recreate ticket_history RLS
DROP POLICY IF EXISTS "Users can view history from their tickets" ON public.ticket_history;
DROP POLICY IF EXISTS "Block deletes from ticket history" ON public.ticket_history;
DROP POLICY IF EXISTS "Block direct inserts to ticket history" ON public.ticket_history;
DROP POLICY IF EXISTS "Block updates to ticket history" ON public.ticket_history;

CREATE POLICY "View history in own empresa"
  ON public.ticket_history FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (
      empresa_id = public.get_user_empresa_id(auth.uid())
      AND EXISTS (
        SELECT 1 FROM tickets WHERE tickets.id = ticket_history.ticket_id
        AND (tickets.requester_id = auth.uid() OR tickets.assigned_to = auth.uid()
             OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'agent'))
      )
    )
  );

CREATE POLICY "Block deletes history" ON public.ticket_history FOR DELETE TO authenticated USING (false);
CREATE POLICY "Block inserts history" ON public.ticket_history FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "Block updates history" ON public.ticket_history FOR UPDATE TO authenticated USING (false);

-- 9. Recreate user_roles RLS
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Agents can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Super admins manage all roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins manage roles in own empresa"
  ON public.user_roles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND empresa_id = public.get_user_empresa_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin') AND empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Agents view roles in own empresa"
  ON public.user_roles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'agent') AND empresa_id = public.get_user_empresa_id(auth.uid()));

CREATE POLICY "Users view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 10. Update handle_new_user for multi-tenant
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  new_empresa_id uuid;
BEGIN
  IF NEW.email LIKE '%@telesdesk.com' THEN
    user_role := 'user';
  ELSE
    user_role := 'admin';
    INSERT INTO public.empresas (nome)
    VALUES (split_part(NEW.email, '@', 2))
    RETURNING id INTO new_empresa_id;
  END IF;
  
  INSERT INTO public.profiles (id, full_name, empresa_id)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), new_empresa_id);
  
  INSERT INTO public.user_roles (user_id, role, empresa_id)
  VALUES (NEW.id, user_role, new_empresa_id);
  
  RETURN NEW;
END;
$$;

-- 11. Update log_ticket_change for multi-tenant
CREATE OR REPLACE FUNCTION public.log_ticket_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO public.ticket_history (ticket_id, action, details, performed_by, empresa_id)
      VALUES (NEW.id, 'status_changed', 'Status alterado de ' || OLD.status || ' para ' || NEW.status, auth.uid(), NEW.empresa_id);
    END IF;
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      INSERT INTO public.ticket_history (ticket_id, action, details, performed_by, empresa_id)
      VALUES (NEW.id, 'assigned', 'Chamado atribuído', auth.uid(), NEW.empresa_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
