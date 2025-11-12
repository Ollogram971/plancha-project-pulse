-- Add created_by column to projects table for audit trail
ALTER TABLE projects 
ADD COLUMN created_by uuid REFERENCES auth.users(id);

-- Create trigger function to automatically set created_by on insert
CREATE OR REPLACE FUNCTION set_project_creator()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Create trigger to auto-populate created_by
CREATE TRIGGER set_project_creator_trigger
BEFORE INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION set_project_creator();