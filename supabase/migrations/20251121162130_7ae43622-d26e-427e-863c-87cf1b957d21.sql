-- Create table for criterion rating scales (échelles d'évaluation)
CREATE TABLE public.criterion_scales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  criterion_id UUID NOT NULL REFERENCES public.criteria(id) ON DELETE CASCADE,
  score_value INTEGER NOT NULL CHECK (score_value >= 0 AND score_value <= 4),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(criterion_id, score_value)
);

-- Enable RLS
ALTER TABLE public.criterion_scales ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "All authenticated users can view criterion scales"
ON public.criterion_scales
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage criterion scales"
ON public.criterion_scales
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_criterion_scales_updated_at
BEFORE UPDATE ON public.criterion_scales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default scales for existing criteria
INSERT INTO public.criterion_scales (criterion_id, score_value, description)
SELECT id, 0, 'Aucun lien' FROM public.criteria WHERE code = 'align'
UNION ALL
SELECT id, 1, 'Lien indirect ou secondaire' FROM public.criteria WHERE code = 'align'
UNION ALL
SELECT id, 2, 'Contribue à une mission du PNG' FROM public.criteria WHERE code = 'align'
UNION ALL
SELECT id, 3, 'Aligné avec plusieurs missions clés du PNG' FROM public.criteria WHERE code = 'align'
UNION ALL
SELECT id, 4, 'Priorité affichée par le PNG' FROM public.criteria WHERE code = 'align';