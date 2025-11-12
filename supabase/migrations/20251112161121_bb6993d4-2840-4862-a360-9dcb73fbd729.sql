-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'contributeur', 'lecteur');
CREATE TYPE public.project_status AS ENUM ('brouillon', 'a_valider', 'valide', 'archive');
CREATE TYPE public.financing_status AS ENUM ('aucun', 'partiel', 'complet');
CREATE TYPE public.feasibility_level AS ENUM ('bloquant', 'mitige', 'bon', 'optimal');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'lecteur',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pôles (departments)
CREATE TABLE public.poles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Thématiques (themes)
CREATE TABLE public.themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  famille TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Critères PLANCHA
CREATE TABLE public.criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  libelle TEXT NOT NULL,
  description TEXT,
  ordre INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profils de pondération (weight profiles)
CREATE TABLE public.weight_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  actif BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pondérations (weights for each criterion in a profile)
CREATE TABLE public.weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.weight_profiles(id) ON DELETE CASCADE NOT NULL,
  criterion_id UUID REFERENCES public.criteria(id) ON DELETE CASCADE NOT NULL,
  poids_percent DECIMAL(5,2) NOT NULL CHECK (poids_percent >= 0 AND poids_percent <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, criterion_id)
);

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  titre TEXT NOT NULL,
  description TEXT,
  pole_id UUID REFERENCES public.poles(id) NOT NULL,
  statut project_status NOT NULL DEFAULT 'brouillon',
  chef_projet_id UUID REFERENCES public.profiles(id),
  partenaires TEXT[],
  budget_total DECIMAL(15,2),
  budget_acquis DECIMAL(15,2),
  financement_statut financing_status DEFAULT 'aucun',
  date_previsionnelle_debut DATE,
  date_demarrage DATE,
  date_saisie TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_fin DATE,
  avancement INTEGER CHECK (avancement >= 0 AND avancement <= 100),
  faisabilite feasibility_level,
  risques TEXT,
  liens TEXT[],
  score_total DECIMAL(5,2) DEFAULT 0,
  rang INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT date_coherence CHECK (date_demarrage IS NULL OR date_fin IS NULL OR date_demarrage <= date_fin),
  CONSTRAINT budget_coherence CHECK (budget_acquis IS NULL OR budget_total IS NULL OR budget_acquis <= budget_total)
);

-- Project-Theme junction table
CREATE TABLE public.project_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  theme_id UUID REFERENCES public.themes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, theme_id)
);

-- Scores bruts (raw scores 0-4)
CREATE TABLE public.scores_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  criterion_id UUID REFERENCES public.criteria(id) ON DELETE CASCADE NOT NULL,
  score_0_4 INTEGER NOT NULL CHECK (score_0_4 >= 0 AND score_0_4 <= 4),
  source TEXT,
  commentaire TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, criterion_id, version)
);

-- Scores calculés (calculated weighted scores)
CREATE TABLE public.scores_calculated (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.weight_profiles(id) ON DELETE CASCADE NOT NULL,
  score_pondere DECIMAL(5,2) NOT NULL,
  rang INTEGER,
  details_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, profile_id)
);

-- Commentaires (comments)
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pièces jointes (attachments)
CREATE TABLE public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  type TEXT,
  url_stockage TEXT NOT NULL,
  nom_fichier TEXT NOT NULL,
  taille BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit log
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entite TEXT NOT NULL,
  entite_id UUID NOT NULL,
  action TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id),
  diff_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores_calculated ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles (admin only)
CREATE POLICY "Admins can manage user roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for reference tables (read by all authenticated, write by admin)
CREATE POLICY "All authenticated users can view poles" ON public.poles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage poles" ON public.poles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "All authenticated users can view themes" ON public.themes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage themes" ON public.themes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "All authenticated users can view criteria" ON public.criteria
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage criteria" ON public.criteria
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for weight profiles
CREATE POLICY "All authenticated users can view weight profiles" ON public.weight_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage weight profiles" ON public.weight_profiles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "All authenticated users can view weights" ON public.weights
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage weights" ON public.weights
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for projects (all authenticated can read, contributeur+ can write)
CREATE POLICY "All authenticated users can view projects" ON public.projects
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Contributeurs can insert projects" ON public.projects
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'contributeur') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Contributeurs can update projects" ON public.projects
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'contributeur') OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete projects" ON public.projects
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS for project_themes (same as projects)
CREATE POLICY "All authenticated users can view project themes" ON public.project_themes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Contributeurs can manage project themes" ON public.project_themes
  FOR ALL USING (
    public.has_role(auth.uid(), 'contributeur') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- RLS for scores_raw
CREATE POLICY "All authenticated users can view scores" ON public.scores_raw
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Contributeurs can manage scores" ON public.scores_raw
  FOR ALL USING (
    public.has_role(auth.uid(), 'contributeur') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- RLS for scores_calculated (computed, read-only for most)
CREATE POLICY "All authenticated users can view calculated scores" ON public.scores_calculated
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage calculated scores" ON public.scores_calculated
  FOR ALL USING (
    public.has_role(auth.uid(), 'contributeur') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- RLS for comments
CREATE POLICY "All authenticated users can view comments" ON public.comments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments or admins can delete any" ON public.comments
  FOR DELETE USING (
    auth.uid() = author_id OR 
    public.has_role(auth.uid(), 'admin')
  );

-- RLS for attachments
CREATE POLICY "All authenticated users can view attachments" ON public.attachments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Contributeurs can manage attachments" ON public.attachments
  FOR ALL USING (
    public.has_role(auth.uid(), 'contributeur') OR 
    public.has_role(auth.uid(), 'admin')
  );

-- RLS for audit_log (read-only except for system)
CREATE POLICY "Admins can view audit log" ON public.audit_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit log entries" ON public.audit_log
  FOR INSERT WITH CHECK (true);

-- Trigger function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign default lecteur role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'lecteur');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weight_profiles_updated_at
  BEFORE UPDATE ON public.weight_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scores_raw_updated_at
  BEFORE UPDATE ON public.scores_raw
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scores_calculated_updated_at
  BEFORE UPDATE ON public.scores_calculated
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default PLANCHA criteria
INSERT INTO public.criteria (code, libelle, description, ordre) VALUES
  ('alignement_png', 'Alignement PNG', 'Alignement avec les objectifs du Parc National', 1),
  ('interet_strategique', 'Intérêt stratégique', 'Importance stratégique du projet', 2),
  ('emblematique', 'Emblématique', 'Caractère emblématique et symbolique', 3),
  ('structurant', 'Structurant', 'Impact structurant pour l''organisation', 4),
  ('avancement', 'Avancement', 'Degré d''avancement du projet', 5),
  ('financement', 'Financement', 'Situation du financement', 6),
  ('faisabilite', 'Faisabilité', 'Niveau de faisabilité technique et organisationnelle', 7);

-- Insert default weight profile "Standard PNG"
INSERT INTO public.weight_profiles (nom, description, actif) VALUES
  ('Standard PNG', 'Profil de pondération standard du Parc National de la Guadeloupe', true);

-- Get the profile ID and insert default weights
DO $$
DECLARE
  v_profile_id UUID;
  v_crit_align UUID;
  v_crit_interet UUID;
  v_crit_emblem UUID;
  v_crit_struct UUID;
  v_crit_avanc UUID;
  v_crit_financ UUID;
  v_crit_fais UUID;
BEGIN
  SELECT id INTO v_profile_id FROM public.weight_profiles WHERE nom = 'Standard PNG';
  SELECT id INTO v_crit_align FROM public.criteria WHERE code = 'alignement_png';
  SELECT id INTO v_crit_interet FROM public.criteria WHERE code = 'interet_strategique';
  SELECT id INTO v_crit_emblem FROM public.criteria WHERE code = 'emblematique';
  SELECT id INTO v_crit_struct FROM public.criteria WHERE code = 'structurant';
  SELECT id INTO v_crit_avanc FROM public.criteria WHERE code = 'avancement';
  SELECT id INTO v_crit_financ FROM public.criteria WHERE code = 'financement';
  SELECT id INTO v_crit_fais FROM public.criteria WHERE code = 'faisabilite';

  INSERT INTO public.weights (profile_id, criterion_id, poids_percent) VALUES
    (v_profile_id, v_crit_align, 20.00),
    (v_profile_id, v_crit_interet, 15.00),
    (v_profile_id, v_crit_emblem, 10.00),
    (v_profile_id, v_crit_struct, 20.00),
    (v_profile_id, v_crit_avanc, 10.00),
    (v_profile_id, v_crit_financ, 15.00),
    (v_profile_id, v_crit_fais, 10.00);
END $$;