-- Allow contributors and admins to manage poles
DROP POLICY IF EXISTS "Admins can manage poles" ON public.poles;

CREATE POLICY "Contributors can manage poles" 
ON public.poles 
FOR ALL 
USING (has_role(auth.uid(), 'contributeur'::app_role) OR has_role(auth.uid(), 'admin'::app_role));