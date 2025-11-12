-- Drop the security definer view and recreate without security definer
DROP VIEW IF EXISTS public.users_with_roles;

CREATE VIEW public.users_with_roles AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.created_at,
  public.get_user_role(p.id) as role
FROM public.profiles p;

-- Grant appropriate permissions on the view
GRANT SELECT ON public.users_with_roles TO authenticated;