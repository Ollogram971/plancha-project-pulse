-- Fix Security Definer View issue by recreating with security_invoker = true
-- This ensures the view runs with the permissions of the querying user, not the view owner

-- Drop the existing view
DROP VIEW IF EXISTS public.users_with_roles;

-- Recreate the view with security_invoker = true
-- This is the PostgreSQL 15+ way to ensure views use the caller's permissions
CREATE VIEW public.users_with_roles
WITH (security_invoker = true)
AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.created_at,
    public.get_user_role(p.id) AS role
FROM public.profiles p;