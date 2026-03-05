import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Settings2, Users, Database, FileText, Trash2, Info } from "lucide-react";
import { DatabaseServerSettings } from "@/components/DatabaseServerSettings";
import { DataExportSettings } from "@/components/DataExportSettings";
import { ProjectImportSettings } from "@/components/ProjectImportSettings";
import { UserManualSettings } from "@/components/UserManualSettings";
import { ProjectResetSettings } from "@/components/ProjectResetSettings";
import { UserManagementDialog } from "@/components/UserManagementDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns/format";
import { fr } from "date-fns/locale/fr";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch app settings
  const { data: appSettings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  });

  // State for app version
  const [appVersion, setAppVersion] = useState("");
  const [appYear, setAppYear] = useState("");

  // Update local state when data is fetched
  useEffect(() => {
    if (appSettings) {
      setAppVersion(appSettings.version);
      setAppYear(appSettings.update_year.toString());
    }
  }, [appSettings]);

  // Update app settings mutation
  const updateAppSettingsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("app_settings")
        .update({
          version: appVersion,
          update_year: parseInt(appYear),
        })
        .eq("id", appSettings?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast({
        title: "Version mise à jour",
        description: "Les informations de version ont été mises à jour avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la version. " + (error as Error).message,
        variant: "destructive",
      });
    },
  });
  
  // Clear audit logs mutation
  const clearAuditMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("audit_log")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all records
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      toast({
        title: "Audit vidé",
        description: "Tous les enregistrements d'audit ont été supprimés.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de vider l'audit. " + (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Fetch audit logs
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from("audit_log")
        .select(`
          *,
          profiles:author_id (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;

      // Fetch project titles for project-related logs
      const projectIds = logs
        ?.filter(log => log.entite === 'projects')
        .map(log => log.entite_id) || [];

      // For scores_raw, we need to get project_id from the table
      const scoresIds = logs
        ?.filter(log => log.entite === 'scores_raw')
        .map(log => log.entite_id) || [];

      let projectTitles: Record<string, string> = {};
      let scoresProjectMap: Record<string, string> = {};

      if (projectIds.length > 0) {
        const { data: projects } = await supabase
          .from("projects")
          .select("id, titre")
          .in("id", projectIds);
        
        if (projects) {
          projectTitles = Object.fromEntries(
            projects.map(p => [p.id, p.titre])
          );
        }
      }

      if (scoresIds.length > 0) {
        const { data: scores } = await supabase
          .from("scores_raw")
          .select("id, project_id, projects(titre)")
          .in("id", scoresIds);
        
        if (scores) {
          scoresProjectMap = Object.fromEntries(
            scores.map(s => [s.id, (s.projects as any)?.titre || ''])
          );
        }
      }

      // Map technical table names to user-friendly labels
      const entityLabels: Record<string, string> = {
        'scores_raw': 'Scores',
        'projects': 'Projets',
        'user_roles': 'Rôles utilisateurs',
        'themes': 'Thèmes',
        'poles': 'Pôles',
        'criteria': 'Critères',
        'weights': 'Pondérations',
        'weight_profiles': 'Profils de pondération',
        'criterion_scales': 'Échelles de notation',
        'comments': 'Commentaires',
        'attachments': 'Pièces jointes',
        'project_themes': 'Thèmes de projets',
        'app_settings': 'Paramètres application',
        'profiles': 'Utilisateurs',
      };

      // Map actions to user-friendly labels
      const actionLabels: Record<string, string> = {
        'creation': 'Création',
        'modification': 'Modification',
        'suppression': 'Suppression',
        'invitation': 'Invitation',
      };

      // Enrich logs with project titles or friendly labels
      return logs?.map(log => {
        const actionDisplay = actionLabels[log.action] || log.action;
        const userName = (log.diff_json as any)?.full_name || (log.diff_json as any)?.new?.full_name;
        
        let entityDisplay: string;
        if (log.entite === 'projects' && projectTitles[log.entite_id]) {
          entityDisplay = projectTitles[log.entite_id];
        } else if (log.entite === 'scores_raw' && scoresProjectMap[log.entite_id]) {
          entityDisplay = `Scores (${scoresProjectMap[log.entite_id]})`;
        } else if ((log.entite === 'profiles' || log.entite === 'user_roles') && userName) {
          entityDisplay = `${entityLabels[log.entite] || log.entite} (${userName})`;
        } else {
          entityDisplay = entityLabels[log.entite] || log.entite;
        }
        
        return { ...log, entity_display: entityDisplay, action_display: actionDisplay };
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground mt-2">
          Configuration de l'application PLANCHA
        </p>
      </div>

      {/* Settings sections */}
      <div className="grid gap-6">
        {/* App Version Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <CardTitle>Informations de l'application</CardTitle>
            </div>
            <CardDescription>
              Version et date de mise à jour de l'application PLANCHA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input 
                  id="version" 
                  type="text" 
                  value={appVersion}
                  onChange={(e) => setAppVersion(e.target.value)}
                  placeholder="v1.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Année de mise à jour</Label>
                <Input 
                  id="year" 
                  type="number" 
                  value={appYear}
                  onChange={(e) => setAppYear(e.target.value)}
                  placeholder="2025"
                  min="2000"
                  max="2100"
                />
              </div>
            </div>
            <Separator />
            <Button 
              onClick={() => updateAppSettingsMutation.mutate()}
              disabled={!appVersion || !appYear || updateAppSettingsMutation.isPending}
            >
              {updateAppSettingsMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </CardContent>
        </Card>

        {/* Users management */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Gestion des utilisateurs</CardTitle>
            </div>
            <CardDescription>
              Gérer les accès et les rôles (Administrateur, Contributeur, Lecteur)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Invitez des utilisateurs et gérez leurs rôles d'accès à l'application.
            </p>
            <UserManagementDialog />
          </CardContent>
        </Card>

        {/* Database Server Settings */}
        <DatabaseServerSettings />

        {/* Project Import Settings */}
        <ProjectImportSettings />

        {/* User Manual Settings */}
        <UserManualSettings />

        {/* Data Export Settings */}
        <DataExportSettings />

        {/* Project Reset */}
        <ProjectResetSettings />

        {/* Audit Log */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle>Audit</CardTitle>
                </div>
                <CardDescription className="mt-1.5">
                  Suivi des modifications et des actions effectuées dans l'application
                </CardDescription>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={!auditLogs || auditLogs.length === 0}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Vider l'Audit
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Tous les enregistrements d'audit seront définitivement supprimés.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => clearAuditMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Confirmer la suppression
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : auditLogs && auditLogs.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Projets</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.profiles?.full_name || log.profiles?.email || "Système"}
                          </TableCell>
                          <TableCell className="text-sm">
                            <span className="capitalize">{log.action}</span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.entity_display}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucun enregistrement d'audit disponible
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Affichage des 50 dernières actions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
