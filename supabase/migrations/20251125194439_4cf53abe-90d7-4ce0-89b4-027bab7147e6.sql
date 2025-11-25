-- Create app_settings table to store application version and update date
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version text NOT NULL DEFAULT 'v1.0',
  update_year integer NOT NULL DEFAULT 2025,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default values
INSERT INTO public.app_settings (version, update_year)
VALUES ('v1.0', 2025);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view app settings
CREATE POLICY "All authenticated users can view app settings"
  ON public.app_settings
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can update app settings
CREATE POLICY "Admins can update app settings"
  ON public.app_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();