
-- Create storage bucket for user manual
INSERT INTO storage.buckets (id, name, public) VALUES ('user-manual', 'user-manual', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone authenticated to read the manual
CREATE POLICY "Manual is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-manual');

-- Only admins can upload/update the manual
CREATE POLICY "Admins can upload manual"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-manual' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update manual"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-manual' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete manual"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-manual' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
