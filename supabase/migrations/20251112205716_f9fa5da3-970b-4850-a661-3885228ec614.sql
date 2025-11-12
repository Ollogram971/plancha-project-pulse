-- Create helper function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'contributeur' THEN 2
      WHEN 'lecteur' THEN 3
    END
  LIMIT 1
$$;

-- Update RLS policies to allow all authenticated users to view all roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Create view for user profiles with roles
CREATE OR REPLACE VIEW public.users_with_roles AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.created_at,
  public.get_user_role(p.id) as role
FROM public.profiles p;