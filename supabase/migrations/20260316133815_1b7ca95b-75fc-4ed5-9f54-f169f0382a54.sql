-- Create a default empresa for the admin user
INSERT INTO public.empresas (id, nome, plano)
VALUES (gen_random_uuid(), 'Empresa Principal', 'basic')
ON CONFLICT DO NOTHING;

-- Get the empresa id and assign to all users
DO $$
DECLARE
  emp_id uuid;
BEGIN
  SELECT id INTO emp_id FROM public.empresas LIMIT 1;
  
  UPDATE public.profiles SET empresa_id = emp_id WHERE empresa_id IS NULL;
  UPDATE public.user_roles SET empresa_id = emp_id WHERE empresa_id IS NULL;
  UPDATE public.tickets SET empresa_id = emp_id WHERE empresa_id IS NULL;
  UPDATE public.ticket_messages SET empresa_id = emp_id WHERE empresa_id IS NULL;
  UPDATE public.ticket_history SET empresa_id = emp_id WHERE empresa_id IS NULL;
  UPDATE public.ticket_escalations SET empresa_id = emp_id WHERE empresa_id IS NULL;
END $$;

-- Fix the handle_new_user trigger so telesdesk users get empresa_id set later by edge function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role app_role;
  new_empresa_id uuid;
BEGIN
  IF NEW.email LIKE '%@telesdesk.com' THEN
    user_role := 'user';
    new_empresa_id := NULL;
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
$function$;