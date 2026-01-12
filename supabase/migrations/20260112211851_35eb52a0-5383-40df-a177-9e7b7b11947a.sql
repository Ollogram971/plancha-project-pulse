-- Add EVA project ID field to projects table
-- This stores only the numeric part of the EVA URL (e.g., "602" for https://guadeloupe.evaparc.net/project/form/602)
ALTER TABLE public.projects
ADD COLUMN eva_project_id text DEFAULT NULL;

-- Add a check constraint to ensure only digits are stored
ALTER TABLE public.projects
ADD CONSTRAINT eva_project_id_numeric_only CHECK (eva_project_id IS NULL OR eva_project_id ~ '^\d+$');

COMMENT ON COLUMN public.projects.eva_project_id IS 'Identifiant numérique du projet dans EVA (evaparc.net)';