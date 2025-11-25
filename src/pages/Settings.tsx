import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Settings2, Users, Weight, Database, FileText, AlertCircle, Trash2 } from "lucide-react";
import { UserManagementDialog } from "@/components/UserManagementDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns/format";
import { fr } from "date-fns/locale/fr";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CriterionScalesDialog } from "@/components/CriterionScalesDialog";
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
  
  // Fetch criteria from database
  const { data: criteria } = useQuery({
    queryKey: ["criteria"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("criteria")
        .select("*")
        .order("ordre");

      if (error) throw error;
      return data;
    },
  });

  // Map criterion codes to IDs
  const criterionMap = useMemo(() => {
    if (!criteria) return {};
    return Object.fromEntries(criteria.map((c) => [c.code, c.id]));
  }, [criteria]);
  
  // State for weight values
  const [weights, setWeights] = useState({
    align: 20,
    strategic: 15,
    emblematic: 10,
    structural: 20,
    progress: 10,
    financing: 15,
    feasibility: 10,
  });

  // Calculate total dynamically
  const totalWeight = useMemo(() => {
    return Object.values(weights).reduce((sum, value) => sum + value, 0);
  }, [weights]);

  // Check if total is valid
  const isValidTotal = totalWeight === 100;

  const handleWeightChange = (key: keyof typeof weights, value: string) => {
    const numValue = parseInt(value) || 0;
    setWeights(prev => ({ ...prev, [key]: numValue }));
  };

  const handleSaveWeights = () => {
    if (!isValidTotal) {
      toast({
        title: "Erreur de validation",
        description: `Le total des pondérations doit être égal à 100%. Actuellement: ${totalWeight}%`,
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Pondérations enregistrées",
      description: "Les pondérations ont été mises à jour avec succès.",
    });
  };

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

      let projectTitles: Record<string, string> = {};
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

      // Enrich logs with project titles
      return logs?.map(log => ({
        ...log,
        entity_display: log.entite === 'projects' && projectTitles[log.entite_id]
          ? projectTitles[log.entite_id]
          : log.entite
      }));
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
        {/* Criteria weights */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Weight className="h-5 w-5 text-primary" />
              <CardTitle>Pondérations PLANCHA</CardTitle>
            </div>
            <CardDescription>
              Configuration des poids des critères d'évaluation (total doit être 100%)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isValidTotal && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Le total des pondérations doit être égal à 100% pour pouvoir enregistrer. 
                  Actuellement: {totalWeight}%
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="align">Alignement PNG</Label>
                  <CriterionScalesDialog
                    criterionCode="alignement_png"
                    criterionLabel="Alignement PNG"
                    criterionId={criterionMap.alignement_png}
                  />
                </div>
                <div className="flex gap-2">
                  <Input 
                    id="align" 
                    type="number" 
                    value={weights.align}
                    onChange={(e) => handleWeightChange('align', e.target.value)}
                    min={0}
                    max={100}
                  />
                  <span className="flex items-center text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="strategic">Intérêt stratégique</Label>
                  <CriterionScalesDialog
                    criterionCode="interet_strategique"
                    criterionLabel="Intérêt stratégique"
                    criterionId={criterionMap.interet_strategique}
                  />
                </div>
                <div className="flex gap-2">
                  <Input 
                    id="strategic" 
                    type="number" 
                    value={weights.strategic}
                    onChange={(e) => handleWeightChange('strategic', e.target.value)}
                    min={0}
                    max={100}
                  />
                  <span className="flex items-center text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="emblematic">Emblématique</Label>
                  <CriterionScalesDialog
                    criterionCode="emblematique"
                    criterionLabel="Emblématique"
                    criterionId={criterionMap.emblematique}
                  />
                </div>
                <div className="flex gap-2">
                  <Input 
                    id="emblematic" 
                    type="number" 
                    value={weights.emblematic}
                    onChange={(e) => handleWeightChange('emblematic', e.target.value)}
                    min={0}
                    max={100}
                  />
                  <span className="flex items-center text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="structural">Structurant</Label>
                  <CriterionScalesDialog
                    criterionCode="structurant"
                    criterionLabel="Structurant"
                    criterionId={criterionMap.structurant}
                  />
                </div>
                <div className="flex gap-2">
                  <Input 
                    id="structural" 
                    type="number" 
                    value={weights.structural}
                    onChange={(e) => handleWeightChange('structural', e.target.value)}
                    min={0}
                    max={100}
                  />
                  <span className="flex items-center text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="progress">Avancement</Label>
                  <CriterionScalesDialog
                    criterionCode="avancement"
                    criterionLabel="Avancement"
                    criterionId={criterionMap.avancement}
                  />
                </div>
                <div className="flex gap-2">
                  <Input 
                    id="progress" 
                    type="number" 
                    value={weights.progress}
                    onChange={(e) => handleWeightChange('progress', e.target.value)}
                    min={0}
                    max={100}
                  />
                  <span className="flex items-center text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="financing">Financement</Label>
                  <CriterionScalesDialog
                    criterionCode="financement"
                    criterionLabel="Financement"
                    criterionId={criterionMap.financement}
                  />
                </div>
                <div className="flex gap-2">
                  <Input 
                    id="financing" 
                    type="number" 
                    value={weights.financing}
                    onChange={(e) => handleWeightChange('financing', e.target.value)}
                    min={0}
                    max={100}
                  />
                  <span className="flex items-center text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="feasibility">Faisabilité</Label>
                  <CriterionScalesDialog
                    criterionCode="faisabilite"
                    criterionLabel="Faisabilité"
                    criterionId={criterionMap.faisabilite}
                  />
                </div>
                <div className="flex gap-2">
                  <Input 
                    id="feasibility" 
                    type="number" 
                    value={weights.feasibility}
                    onChange={(e) => handleWeightChange('feasibility', e.target.value)}
                    min={0}
                    max={100}
                  />
                  <span className="flex items-center text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2 flex items-end">
                <div className={`flex-1 p-3 rounded-md ${isValidTotal ? 'bg-muted' : 'bg-destructive/10 border border-destructive'}`}>
                  <p className={`text-sm font-medium ${isValidTotal ? '' : 'text-destructive'}`}>
                    Total: {totalWeight}%
                  </p>
                  <p className="text-xs text-muted-foreground">Profil: Standard PNG</p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button 
                onClick={handleSaveWeights}
                disabled={!isValidTotal}
              >
                Enregistrer les pondérations
              </Button>
              <Button variant="outline">Créer un nouveau profil</Button>
            </div>
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

        {/* Import/Export */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Import / Export</CardTitle>
            </div>
            <CardDescription>
              Importer et exporter les données de projets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline">Importer ODS/Excel</Button>
                <Button variant="outline">Exporter vers Excel</Button>
                <Button variant="outline">Exporter PDF</Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Formats supportés: ODS, XLSX, CSV, PDF
              </p>
            </div>
          </CardContent>
        </Card>

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
                        <TableHead>Entité</TableHead>
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
