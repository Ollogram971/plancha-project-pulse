-- Fix PUBLIC_DATA_EXPOSURE: User Role Information Visible to All Authenticated Users
-- The current policy allows any authenticated user to view all role assignments
-- This enables user enumeration and reveals admin/privileged accounts

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- Create a restricted policy: users can only view their own role, admins can view all
CREATE POLICY "Users can view own role or admins can view all"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);