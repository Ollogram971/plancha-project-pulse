-- Create a generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_data jsonb;
  new_data jsonb;
  diff jsonb;
BEGIN
  -- Prepare old and new data as JSONB
  IF (TG_OP = 'DELETE') THEN
    old_data = row_to_json(OLD)::jsonb;
    
    INSERT INTO public.audit_log (
      action,
      entite,
      entite_id,
      author_id,
      diff_json
    ) VALUES (
      'suppression',
      TG_TABLE_NAME,
      OLD.id,
      auth.uid(),
      old_data
    );
    
    RETURN OLD;
    
  ELSIF (TG_OP = 'UPDATE') THEN
    old_data = row_to_json(OLD)::jsonb;
    new_data = row_to_json(NEW)::jsonb;
    
    -- Calculate diff: only changed fields
    diff = jsonb_build_object(
      'old', old_data,
      'new', new_data
    );
    
    INSERT INTO public.audit_log (
      action,
      entite,
      entite_id,
      author_id,
      diff_json
    ) VALUES (
      'modification',
      TG_TABLE_NAME,
      NEW.id,
      auth.uid(),
      diff
    );
    
    RETURN NEW;
    
  ELSIF (TG_OP = 'INSERT') THEN
    new_data = row_to_json(NEW)::jsonb;
    
    INSERT INTO public.audit_log (
      action,
      entite,
      entite_id,
      author_id,
      diff_json
    ) VALUES (
      'creation',
      TG_TABLE_NAME,
      NEW.id,
      auth.uid(),
      new_data
    );
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create triggers for projects table
DROP TRIGGER IF EXISTS audit_projects_insert ON public.projects;
CREATE TRIGGER audit_projects_insert
AFTER INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_projects_update ON public.projects;
CREATE TRIGGER audit_projects_update
AFTER UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_projects_delete ON public.projects;
CREATE TRIGGER audit_projects_delete
AFTER DELETE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Create triggers for poles table
DROP TRIGGER IF EXISTS audit_poles_insert ON public.poles;
CREATE TRIGGER audit_poles_insert
AFTER INSERT ON public.poles
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_poles_update ON public.poles;
CREATE TRIGGER audit_poles_update
AFTER UPDATE ON public.poles
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_poles_delete ON public.poles;
CREATE TRIGGER audit_poles_delete
AFTER DELETE ON public.poles
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Create triggers for criteria table
DROP TRIGGER IF EXISTS audit_criteria_insert ON public.criteria;
CREATE TRIGGER audit_criteria_insert
AFTER INSERT ON public.criteria
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_criteria_update ON public.criteria;
CREATE TRIGGER audit_criteria_update
AFTER UPDATE ON public.criteria
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_criteria_delete ON public.criteria;
CREATE TRIGGER audit_criteria_delete
AFTER DELETE ON public.criteria
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Create triggers for scores_raw table
DROP TRIGGER IF EXISTS audit_scores_raw_insert ON public.scores_raw;
CREATE TRIGGER audit_scores_raw_insert
AFTER INSERT ON public.scores_raw
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_scores_raw_update ON public.scores_raw;
CREATE TRIGGER audit_scores_raw_update
AFTER UPDATE ON public.scores_raw
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

DROP TRIGGER IF EXISTS audit_scores_raw_delete ON public.scores_raw;
CREATE TRIGGER audit_scores_raw_delete
AFTER DELETE ON public.scores_raw
FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();