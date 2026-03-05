
-- Allow admins to update any profile (for editing name/email in user management)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update own profile or admins can update any"
ON public.profiles
FOR UPDATE
USING (
  (auth.uid() = id) OR has_role(auth.uid(), 'admin'::app_role)
);
