-- Add 'en_cours' value to project_status enum
ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'en_cours';