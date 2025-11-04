-- Atualizar role do usuário atual para admin
UPDATE user_roles 
SET role = 'admin'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'johnlennonandrade@gmail.com'
);

-- Se não existir registro, criar um
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'johnlennonandrade@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM user_roles WHERE user_id = auth.users.id
);