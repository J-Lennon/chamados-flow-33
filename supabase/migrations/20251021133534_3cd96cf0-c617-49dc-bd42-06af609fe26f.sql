-- Atualizar a função que cria novos usuários
-- Usuários com email real (@gmail, @outlook, etc) = admin
-- Usuários com email @sistema.interno = user (criados pelo admin)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Criar perfil
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Determinar role baseado no email
  -- Se email contém @sistema.interno = user (criado pelo admin)
  -- Caso contrário = admin (cadastro normal)
  IF NEW.email LIKE '%@sistema.interno' THEN
    user_role := 'user';
  ELSE
    user_role := 'admin';
  END IF;
  
  -- Atribuir role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;