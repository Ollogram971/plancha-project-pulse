-- Add famille_theme column to projects table
ALTER TABLE public.projects 
ADD COLUMN famille_theme TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.projects.famille_theme IS 'Famille de thème sélectionnée pour le projet';