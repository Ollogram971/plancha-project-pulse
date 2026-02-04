-- Add sources_financement column as text array
ALTER TABLE public.projects
ADD COLUMN sources_financement text[] DEFAULT NULL;