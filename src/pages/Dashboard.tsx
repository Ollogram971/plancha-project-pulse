import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, FolderKanban, AlertCircle } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useProjects();

  // Filter only projects "en cours" for dashboard
  const activeProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter((p) => p.statut === "en_cours");
  }, [projects]);

  const stats = useMemo(() => {
    if (!projects) return null;

    // Count ALL projects regardless of status
    const allProjectsCount = projects.length;
    // Count projects by status
    const needsAttention = projects.filter((p) => p.statut === "a_valider").length;
    const inProgress = activeProjects.length;
    const archived = projects.filter((p) => p.statut === "archive").length;
    
    // Calculate average score only if there are active projects
    const avgScore = activeProjects.length > 0
      ? activeProjects.reduce((sum, p) => sum + (Number(p.score_total) || 0), 0) / activeProjects.length
      : 0;

    return {
      allProjectsCount,
      activeProjects: inProgress,
      averageScore: avgScore,
      projectsNeedingAttention: needsAttention,
      archivedProjects: archived,
    };
  }, [activeProjects, projects]);

  const topProjects = useMemo(() => {
    if (!activeProjects) return [];
    return [...activeProjects]
      .sort((a, b) => {
        // Sort by score first (descending)
        const scoreDiff = (Number(b.score_total) || 0) - (Number(a.score_total) || 0);
        
        // If scores are equal, sort by date_fin (most recent first)
        if (scoreDiff === 0) {
          const dateA = a.date_fin ? new Date(a.date_fin).getTime() : 0;
          const dateB = b.date_fin ? new Date(b.date_fin).getTime() : 0;
          return dateB - dateA;
        }
        
        return scoreDiff;
      })
      .slice(0, 10);
  }, [activeProjects]);

  const poleDistribution = useMemo(() => {
    if (!activeProjects || activeProjects.length === 0) return [];

    const poleCount = new Map<string, { count: number; poleId: string }>();
    activeProjects.forEach((project) => {
      const pole = project.poles?.libelle || "Non défini";
      const poleId = project.pole_id || "";
      const current = poleCount.get(pole);
      if (current) {
        poleCount.set(pole, { count: current.count + 1, poleId: current.poleId });
      } else {
        poleCount.set(pole, { count: 1, poleId });
      }
    });

    const total = activeProjects.length;
    return Array.from(poleCount.entries())
      .map(([pole, { count, poleId }]) => ({
        pole,
        poleId,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [activeProjects]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!stats) return null;
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble des projets PLANCHA - Parc National de la Guadeloupe
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate('/projects')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projets</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.allProjectsCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProjects} en cours · {stats.projectsNeedingAttention} à valider · {stats.archivedProjects} archivés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Moyen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              sur 100 points PLANCHA
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate('/projects?status=en_cours')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets Actifs</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeProjects}
            </div>
            <p className="text-xs text-muted-foreground">
              projets en cours
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate('/projects?status=attention')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attention Requise</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projectsNeedingAttention}</div>
            <p className="text-xs text-muted-foreground">
              projets en attente
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top projects */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Projets (Score PLANCHA)</CardTitle>
            <CardDescription>
              Classement des projets selon leur score pondéré
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun projet disponible
                </p>
              ) : (
                topProjects.map((project, index) => (
                  <div 
                    key={project.id} 
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-none">{project.titre}</p>
                        <Badge variant="secondary" className="ml-2">
                          {Number(project.score_total || 0).toFixed(1)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {project.code} • {project.poles?.libelle || "N/A"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pole distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Pôle/Service</CardTitle>
            <CardDescription>
              Distribution des projets par domaine d'activité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {poleDistribution.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune donnée disponible
                </p>
              ) : (
                poleDistribution.map((item) => (
                <div key={item.pole} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span 
                      className="font-medium hover:text-primary cursor-pointer transition-colors"
                      onClick={() => navigate(`/projects?pole=${item.poleId}`)}
                    >
                      {item.pole}
                    </span>
                    <span className="text-muted-foreground">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
