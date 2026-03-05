-- Fix audit_log INSERT policy to enforce author_id = auth.uid()
DROP POLICY IF EXISTS "System can insert audit log entries" ON public.audit_log;

-- Allow trigger (SECURITY DEFINER) inserts + enforce author_id for direct inserts
CREATE POLICY "System can insert audit log entries"
ON public.audit_log
FOR INSERT
WITH CHECK (
  author_id = auth.uid() OR author_id IS NULL
);