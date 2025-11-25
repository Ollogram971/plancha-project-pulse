-- First, update existing projects to merge statuses
-- Merge "brouillon" into "a_valider"
UPDATE projects 
SET statut = 'a_valider' 
WHERE statut = 'brouillon';

-- Merge "valide" into "en_cours"
UPDATE projects 
SET statut = 'en_cours' 
WHERE statut = 'valide';

-- Now we need to recreate the enum with only 3 values
-- Since we can't directly modify enum values in PostgreSQL, we need to:
-- 1. Remove the default value
-- 2. Create a new enum type
-- 3. Change the column to use the new type
-- 4. Drop the old enum type
-- 5. Re-add the default value

-- Step 1: Remove the default value
ALTER TABLE projects 
  ALTER COLUMN statut DROP DEFAULT;

-- Step 2: Create new enum type with simplified statuses
CREATE TYPE project_status_new AS ENUM ('a_valider', 'en_cours', 'archive');

-- Step 3: Alter the projects table to use the new enum type
ALTER TABLE projects 
  ALTER COLUMN statut TYPE project_status_new 
  USING statut::text::project_status_new;

-- Step 4: Drop the old enum type and rename the new one
DROP TYPE project_status;
ALTER TYPE project_status_new RENAME TO project_status;

-- Step 5: Re-add the default value
ALTER TABLE projects 
  ALTER COLUMN statut SET DEFAULT 'a_valider'::project_status;