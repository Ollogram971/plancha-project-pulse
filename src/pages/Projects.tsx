import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjects } from "@/hooks/useProjects";
import { usePoles } from "@/hooks/usePoles";
import { ProjectDialog } from "@/components/ProjectDialog";

const getStatusColor = (status: string) => {
  switch (status) {
    case "en_cours":
      return "secondary";
    case "a_valider":
      return "warning";
    case "archive":
      return "outline";
    default:
      return "default";
  }
};

const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    a_valider: "À valider",
    en_cours: "En cours",
    archive: "Archivé",
  };
  return statusMap[status] || status;
};

export default function Projects() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPole, setFilterPole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: projects, isLoading } = useProjects();
  const { data: poles } = usePoles();

  // Initialize filter from URL params
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam === 'attention') {
      setFilterStatus('attention');
    }
  }, [searchParams]);

  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    return projects.filter((project) => {
      const matchesSearch =
        searchQuery === "" ||
        project.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPole =
        filterPole === "all" || project.pole_id === filterPole;

      const matchesStatus =
        filterStatus === "all" ? true :
        filterStatus === "attention" 
          ? project.statut === "a_valider"
          : project.statut === filterStatus;

      return matchesSearch && matchesPole && matchesStatus;
    });
  }, [projects, searchQuery, filterPole, filterStatus]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projets</h1>
          <p className="text-muted-foreground mt-2">
            Gestion et suivi des projets PLANCHA
          </p>
        </div>
        <ProjectDialog />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres et recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par code, titre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterPole} onValueChange={setFilterPole}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les pôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les pôles</SelectItem>
                {poles?.map((pole) => (
                  <SelectItem key={pole.id} value={pole.id}>
                    {pole.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="attention">Attention requise</SelectItem>
                <SelectItem value="a_valider">À valider</SelectItem>
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="archive">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des projets ({filteredProjects.length})</CardTitle>
          <CardDescription>
            Classés par score PLANCHA décroissant
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun projet trouvé
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project, index) => (
                <Card 
                  key={project.id} 
                  className="hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base">{project.titre}</h3>
                            <p className="text-sm text-muted-foreground">
                              {project.code} • {project.poles?.libelle || "N/A"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={getStatusColor(project.statut) as any}>
                              {formatStatus(project.statut)}
                            </Badge>
                            {project.score_total !== null && (
                              <Badge variant="outline" className="font-mono font-bold">
                                {project.score_total.toFixed(1)}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {project.date_demarrage && (
                            <span>Démarrage: {new Date(project.date_demarrage).toLocaleDateString('fr-FR')}</span>
                          )}
                          {project.budget_total && (
                            <span>Budget: {(Number(project.budget_total) / 1000).toFixed(0)}k€</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
