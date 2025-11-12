import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectEditDialog } from "@/components/ProjectEditDialog";

const getStatusColor = (status: string) => {
  switch (status) {
    case "valide":
      return "success";
    case "en_cours":
      return "secondary";
    case "a_valider":
      return "warning";
    case "brouillon":
      return "default";
    case "archive":
      return "destructive";
    default:
      return "default";
  }
};

const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    brouillon: "Brouillon",
    a_valider: "À valider",
    valide: "Validé",
    en_cours: "En cours",
    archive: "Archivé",
  };
  return statusMap[status] || status;
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          poles(code, libelle),
          profiles(full_name)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/projects")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux projets
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Projet non trouvé</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/projects")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour aux projets
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.titre}</h1>
          <p className="text-muted-foreground mt-2">{project.code}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusColor(project.statut) as any}>
            {formatStatus(project.statut)}
          </Badge>
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pôle</p>
              <p className="text-base">{project.poles?.libelle || "N/A"}</p>
            </div>
            {project.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-base">{project.description}</p>
              </div>
            )}
            {project.profiles?.full_name && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chef de projet</p>
                <p className="text-base">{project.profiles.full_name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score PLANCHA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Score total</p>
              <p className="text-3xl font-bold">
                {project.score_total ? project.score_total.toFixed(1) : "0.0"}
              </p>
            </div>
            {project.rang && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rang</p>
                <p className="text-base">#{project.rang}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.budget_total && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget total</p>
                <p className="text-base">{Number(project.budget_total).toLocaleString('fr-FR')} €</p>
              </div>
            )}
            {project.budget_acquis && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget acquis</p>
                <p className="text-base">{Number(project.budget_acquis).toLocaleString('fr-FR')} €</p>
              </div>
            )}
            {project.financement_statut && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Statut financement</p>
                <p className="text-base capitalize">{project.financement_statut.replace('_', ' ')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendrier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.date_previsionnelle_debut && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date prévisionnelle début</p>
                <p className="text-base">{new Date(project.date_previsionnelle_debut).toLocaleDateString('fr-FR')}</p>
              </div>
            )}
            {project.date_demarrage && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date de démarrage</p>
                <p className="text-base">{new Date(project.date_demarrage).toLocaleDateString('fr-FR')}</p>
              </div>
            )}
            {project.date_fin && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date de fin</p>
                <p className="text-base">{new Date(project.date_fin).toLocaleDateString('fr-FR')}</p>
              </div>
            )}
            {project.avancement !== null && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avancement</p>
                <p className="text-base">{project.avancement}%</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(project.risques || project.partenaires || project.liens) && (
        <Card>
          <CardHeader>
            <CardTitle>Informations complémentaires</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.risques && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risques</p>
                <p className="text-base">{project.risques}</p>
              </div>
            )}
            {project.partenaires && project.partenaires.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Partenaires</p>
                <ul className="list-disc list-inside">
                  {project.partenaires.map((partenaire, idx) => (
                    <li key={idx} className="text-base">{partenaire}</li>
                  ))}
                </ul>
              </div>
            )}
            {project.liens && project.liens.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Liens</p>
                <ul className="space-y-1">
                  {project.liens.map((lien, idx) => (
                    <li key={idx}>
                      <a href={lien} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {lien}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ProjectEditDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen}
        project={project}
      />
    </div>
  );
}
