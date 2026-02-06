import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Download, Database, FileCode, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Tables disponibles pour l'export
const AVAILABLE_TABLES = [
  { id: "projects", label: "Projets", table: "projects" },
  { id: "poles", label: "Pôles", table: "poles" },
  { id: "themes", label: "Thèmes", table: "themes" },
  { id: "criteria", label: "Critères", table: "criteria" },
  { id: "criterion_scales", label: "Échelles de notation", table: "criterion_scales" },
  { id: "weight_profiles", label: "Profils de pondération", table: "weight_profiles" },
  { id: "weights", label: "Pondérations", table: "weights" },
  { id: "scores_raw", label: "Scores bruts", table: "scores_raw" },
  { id: "scores_calculated", label: "Scores calculés", table: "scores_calculated" },
  { id: "comments", label: "Commentaires", table: "comments" },
  { id: "attachments", label: "Pièces jointes", table: "attachments" },
  { id: "project_themes", label: "Thèmes de projets", table: "project_themes" },
  { id: "app_settings", label: "Paramètres application", table: "app_settings" },
  { id: "profiles", label: "Profils utilisateurs (hors admins)", table: "profiles" },
  { id: "user_roles", label: "Rôles utilisateurs (hors admins)", table: "user_roles" },
  { id: "audit_log", label: "Journal d'audit", table: "audit_log" },
] as const;

type TableId = typeof AVAILABLE_TABLES[number]["id"];

export function DataExportSettings() {
  const { toast } = useToast();
  const [selectedTables, setSelectedTables] = useState<Set<TableId>>(new Set());
  const [isExportingData, setIsExportingData] = useState(false);
  const [isExportingStructure, setIsExportingStructure] = useState(false);

  const toggleTable = (tableId: TableId) => {
    const newSelected = new Set(selectedTables);
    if (newSelected.has(tableId)) {
      newSelected.delete(tableId);
    } else {
      newSelected.add(tableId);
    }
    setSelectedTables(newSelected);
  };

  const selectAll = () => {
    setSelectedTables(new Set(AVAILABLE_TABLES.map(t => t.id)));
  };

  const deselectAll = () => {
    setSelectedTables(new Set());
  };

  const escapeValue = (value: unknown): string => {
    if (value === null || value === undefined) return "NULL";
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
    if (Array.isArray(value)) {
      return `ARRAY[${value.map(v => `'${String(v).replace(/'/g, "''")}'`).join(", ")}]`;
    }
    if (typeof value === "object") {
      return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    }
    return `'${String(value).replace(/'/g, "''")}'`;
  };

  const generateInsertStatements = (tableName: string, rows: Record<string, unknown>[]): string => {
    if (rows.length === 0) return `-- Table ${tableName}: aucune donnée\n`;

    const statements: string[] = [];
    statements.push(`-- Table: ${tableName}`);
    statements.push(`-- Nombre d'enregistrements: ${rows.length}`);
    statements.push("");

    for (const row of rows) {
      const columns = Object.keys(row);
      const values = columns.map(col => escapeValue(row[col]));
      statements.push(
        `INSERT INTO public.${tableName} (${columns.join(", ")}) VALUES (${values.join(", ")});`
      );
    }
    statements.push("");

    return statements.join("\n");
  };

  const fetchTableData = async (tableName: string): Promise<Record<string, unknown>[]> => {
    // Cas spécial pour profiles et user_roles: exclure les admins
    if (tableName === "profiles") {
      // Récupérer les IDs des admins
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      
      const adminIds = adminRoles?.map(r => r.user_id) || [];
      
      if (adminIds.length > 0) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .not("id", "in", `(${adminIds.join(",")})`);
        
        if (error) throw error;
        return (data || []) as Record<string, unknown>[];
      }
    }

    if (tableName === "user_roles") {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .neq("role", "admin");
      
      if (error) throw error;
      return (data || []) as Record<string, unknown>[];
    }

    // Cas général
    const { data, error } = await supabase
      .from(tableName)
      .select("*");
    
    if (error) throw error;
    return (data || []) as Record<string, unknown>[];
  };

  const exportData = async () => {
    if (selectedTables.size === 0) {
      toast({
        title: "Aucune table sélectionnée",
        description: "Veuillez sélectionner au moins une table à exporter.",
        variant: "destructive",
      });
      return;
    }

    setIsExportingData(true);

    try {
      const sqlParts: string[] = [];
      sqlParts.push("-- ============================================");
      sqlParts.push("-- Export des données PLANCHA");
      sqlParts.push(`-- Date: ${new Date().toLocaleString("fr-FR")}`);
      sqlParts.push("-- ============================================");
      sqlParts.push("");
      sqlParts.push("-- Note: Les profils et rôles des administrateurs sont exclus pour des raisons de sécurité.");
      sqlParts.push("");

      for (const tableConfig of AVAILABLE_TABLES) {
        if (!selectedTables.has(tableConfig.id)) continue;

        try {
          const rows = await fetchTableData(tableConfig.table);
          sqlParts.push(generateInsertStatements(tableConfig.table, rows));
        } catch (error) {
          sqlParts.push(`-- Erreur lors de l'export de ${tableConfig.table}: ${(error as Error).message}\n`);
        }
      }

      // Télécharger le fichier
      const blob = new Blob([sqlParts.join("\n")], { type: "text/sql" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `plancha_data_export_${new Date().toISOString().split("T")[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: "Le fichier SQL des données a été téléchargé.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter les données. " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsExportingData(false);
    }
  };

  const generateCreateTableStatements = (): string => {
    const statements: string[] = [];
    statements.push("-- ============================================");
    statements.push("-- Structure des tables PLANCHA");
    statements.push(`-- Date: ${new Date().toLocaleString("fr-FR")}`);
    statements.push("-- ============================================");
    statements.push("");

    // Enums
    statements.push("-- Enums");
    statements.push("DO $$ BEGIN");
    statements.push("  CREATE TYPE app_role AS ENUM ('admin', 'contributeur', 'lecteur', 'validateur');");
    statements.push("EXCEPTION WHEN duplicate_object THEN NULL; END $$;");
    statements.push("");
    statements.push("DO $$ BEGIN");
    statements.push("  CREATE TYPE project_status AS ENUM ('a_valider', 'en_cours', 'archive');");
    statements.push("EXCEPTION WHEN duplicate_object THEN NULL; END $$;");
    statements.push("");
    statements.push("DO $$ BEGIN");
    statements.push("  CREATE TYPE financing_status AS ENUM ('aucun', 'recherche_financement', 'partiel', 'complet');");
    statements.push("EXCEPTION WHEN duplicate_object THEN NULL; END $$;");
    statements.push("");
    statements.push("DO $$ BEGIN");
    statements.push("  CREATE TYPE feasibility_level AS ENUM ('bloquant', 'mitige', 'bon', 'optimal');");
    statements.push("EXCEPTION WHEN duplicate_object THEN NULL; END $$;");
    statements.push("");

    // Tables
    const tableDefinitions: Record<string, string> = {
      poles: `
CREATE TABLE IF NOT EXISTS public.poles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  libelle TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
      themes: `
CREATE TABLE IF NOT EXISTS public.themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  libelle TEXT NOT NULL,
  famille TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
      criteria: `
CREATE TABLE IF NOT EXISTS public.criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  libelle TEXT NOT NULL,
  description TEXT,
  ordre INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
      criterion_scales: `
CREATE TABLE IF NOT EXISTS public.criterion_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  criterion_id UUID NOT NULL REFERENCES public.criteria(id) ON DELETE CASCADE,
  score_value INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
      weight_profiles: `
CREATE TABLE IF NOT EXISTS public.weight_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  actif BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
      weights: `
CREATE TABLE IF NOT EXISTS public.weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.weight_profiles(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES public.criteria(id) ON DELETE CASCADE,
  poids_percent NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
      profiles: `
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
      user_roles: `
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'lecteur',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);`,
      projects: `
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  titre TEXT NOT NULL,
  description TEXT,
  pole_id UUID NOT NULL REFERENCES public.poles(id),
  statut project_status NOT NULL DEFAULT 'a_valider',
  chef_projet_id UUID REFERENCES public.profiles(id),
  budget_total NUMERIC,
  budget_acquis NUMERIC,
  financement_statut financing_status DEFAULT 'aucun',
  sources_financement TEXT[],
  date_previsionnelle_debut DATE,
  date_demarrage DATE,
  date_fin DATE,
  date_saisie TIMESTAMPTZ NOT NULL DEFAULT now(),
  avancement INTEGER,
  faisabilite feasibility_level,
  score_total NUMERIC DEFAULT 0,
  rang INTEGER,
  partenaires TEXT[],
  risques TEXT,
  liens TEXT[],
  famille_theme TEXT,
  eva_project_id TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
      project_themes: `
CREATE TABLE IF NOT EXISTS public.project_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
      scores_raw: `
CREATE TABLE IF NOT EXISTS public.scores_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  criterion_id UUID NOT NULL REFERENCES public.criteria(id) ON DELETE CASCADE,
  score_0_4 INTEGER NOT NULL,
  commentaire TEXT,
  source TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
      scores_calculated: `
CREATE TABLE IF NOT EXISTS public.scores_calculated (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.weight_profiles(id) ON DELETE CASCADE,
  score_pondere NUMERIC NOT NULL,
  rang INTEGER,
  details_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
      comments: `
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
      attachments: `
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  nom_fichier TEXT NOT NULL,
  url_stockage TEXT NOT NULL,
  type TEXT,
  taille BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
      app_settings: `
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL DEFAULT 'v1.0',
  update_year INTEGER NOT NULL DEFAULT 2025,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
      audit_log: `
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entite TEXT NOT NULL,
  entite_id UUID NOT NULL,
  author_id UUID REFERENCES public.profiles(id),
  diff_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
    };

    for (const tableConfig of AVAILABLE_TABLES) {
      if (!selectedTables.has(tableConfig.id)) continue;
      
      const definition = tableDefinitions[tableConfig.table];
      if (definition) {
        statements.push(`-- Table: ${tableConfig.label}`);
        statements.push(definition);
        statements.push("");
      }
    }

    return statements.join("\n");
  };

  const exportStructure = async () => {
    if (selectedTables.size === 0) {
      toast({
        title: "Aucune table sélectionnée",
        description: "Veuillez sélectionner au moins une table à exporter.",
        variant: "destructive",
      });
      return;
    }

    setIsExportingStructure(true);

    try {
      const sql = generateCreateTableStatements();

      // Télécharger le fichier
      const blob = new Blob([sql], { type: "text/sql" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `plancha_structure_export_${new Date().toISOString().split("T")[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export réussi",
        description: "Le fichier SQL de la structure a été téléchargé.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter la structure. " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsExportingStructure(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          <CardTitle>Export tables de données</CardTitle>
        </div>
        <CardDescription>
          Exportez les données ou la structure des tables au format SQL
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélection des tables */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Tables à exporter</h4>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Tout sélectionner
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Tout désélectionner
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 bg-muted/50 rounded-lg">
            {AVAILABLE_TABLES.map((table) => (
              <div key={table.id} className="flex items-center space-x-2">
                <Checkbox
                  id={table.id}
                  checked={selectedTables.has(table.id)}
                  onCheckedChange={() => toggleTable(table.id)}
                />
                <Label
                  htmlFor={table.id}
                  className="text-sm cursor-pointer"
                >
                  {table.label}
                </Label>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground">
            <strong>Note de sécurité :</strong> Les profils et rôles des utilisateurs administrateurs sont automatiquement exclus des exports.
          </p>
        </div>

        <Separator />

        {/* Boutons d'export */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Export des données */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Export des données</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Génère un fichier SQL avec des instructions INSERT pour sauvegarder les données des tables sélectionnées.
            </p>
            <Button
              onClick={exportData}
              disabled={isExportingData || selectedTables.size === 0}
              className="w-full"
            >
              {isExportingData ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter les données (SQL)
                </>
              )}
            </Button>
          </div>

          {/* Export de la structure */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-primary" />
              <h4 className="font-medium">Export de la structure</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Génère un fichier SQL avec des instructions CREATE TABLE IF NOT EXISTS pour recréer la structure des tables.
            </p>
            <Button
              onClick={exportStructure}
              disabled={isExportingStructure || selectedTables.size === 0}
              variant="outline"
              className="w-full"
            >
              {isExportingStructure ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter la structure (SQL)
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
