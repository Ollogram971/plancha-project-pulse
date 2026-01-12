-- Update RLS policies to include validateur where contributeur is already allowed

-- Projects table: update insert policy
DROP POLICY IF EXISTS "Contributeurs can insert projects" ON public.projects;
CREATE POLICY "Contributeurs can insert projects" ON public.projects
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'contributeur'::app_role) OR 
  has_role(auth.uid(), 'validateur'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Projects table: update update policy
DROP POLICY IF EXISTS "Contributeurs can update projects" ON public.projects;
CREATE POLICY "Contributeurs can update projects" ON public.projects
FOR UPDATE USING (
  has_role(auth.uid(), 'contributeur'::app_role) OR 
  has_role(auth.uid(), 'validateur'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Scores raw: update policy
DROP POLICY IF EXISTS "Contributeurs can manage scores" ON public.scores_raw;
CREATE POLICY "Contributeurs can manage scores" ON public.scores_raw
FOR ALL USING (
  has_role(auth.uid(), 'contributeur'::app_role) OR 
  has_role(auth.uid(), 'validateur'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Scores calculated: update policy
DROP POLICY IF EXISTS "System can manage calculated scores" ON public.scores_calculated;
CREATE POLICY "System can manage calculated scores" ON public.scores_calculated
FOR ALL USING (
  has_role(auth.uid(), 'contributeur'::app_role) OR 
  has_role(auth.uid(), 'validateur'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Attachments: update policy
DROP POLICY IF EXISTS "Contributeurs can manage attachments" ON public.attachments;
CREATE POLICY "Contributeurs can manage attachments" ON public.attachments
FOR ALL USING (
  has_role(auth.uid(), 'contributeur'::app_role) OR 
  has_role(auth.uid(), 'validateur'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Project themes: update policy
DROP POLICY IF EXISTS "Contributeurs can manage project themes" ON public.project_themes;
CREATE POLICY "Contributeurs can manage project themes" ON public.project_themes
FOR ALL USING (
  has_role(auth.uid(), 'contributeur'::app_role) OR 
  has_role(auth.uid(), 'validateur'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Poles: update policy
DROP POLICY IF EXISTS "Contributors can manage poles" ON public.poles;
CREATE POLICY "Contributors can manage poles" ON public.poles
FOR ALL USING (
  has_role(auth.uid(), 'contributeur'::app_role) OR 
  has_role(auth.uid(), 'validateur'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'contributeur'::app_role) OR 
  has_role(auth.uid(), 'validateur'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Update get_user_role function to include validateur
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'validateur' THEN 2
      WHEN 'contributeur' THEN 3
      WHEN 'lecteur' THEN 4
    END
  LIMIT 1
$function$;