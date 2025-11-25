-- Add RLS policy to allow admins to delete audit log entries
CREATE POLICY "Admins can delete audit log entries" 
ON public.audit_log 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));