import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, FolderKanban, AlertCircle } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useMemo } from "react";

export default function Dashboard() {
  const { data: projects, isLoading } = useProjects();

  const stats = useMemo(() => {
    if (!projects) return null;

    const validatedCount = projects.filter((p) => p.statut === "valide").length;
    const needsAttention = projects.filter(
      (p) => p.statut === "a_valider" || p.statut === "brouillon"
    ).length;
    const avgScore =
      projects.reduce((sum, p) => sum + (Number(p.score_total) || 0), 0) /
      projects.length;

    return {
      totalProjects: projects.length,
      validatedProjects: validatedCount,
      averageScore: avgScore,
      projectsNeedingAttention: needsAttention,
    };
  }, [projects]);

  const topProjects = useMemo(() => {
    if (!projects) return [];
    return [...projects]
      .sort((a, b) => (Number(b.score_total) || 0) - (Number(a.score_total) || 0))
      .slice(0, 5);
  }, [projects]);

  const poleDistribution = useMemo(() => {
    if (!projects) return [];

    const poleCount = new Map<string, number>();
    projects.forEach((project) => {
      const pole = project.poles?.libelle || "Non défini";
      poleCount.set(pole, (poleCount.get(pole) || 0) + 1);
    });

    const total = projects.length;
    return Array.from(poleCount.entries())
      .map(([pole, count]) => ({
        pole,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [projects]);

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projets</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.validatedProjects} validés
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Validation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats.validatedProjects / stats.totalProjects) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              +12% ce trimestre
            </p>
          </CardContent>
        </Card>

        <Card>
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
            <CardTitle>Top 5 Projets (Score PLANCHA)</CardTitle>
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
                  <div key={project.id} className="flex items-start gap-4">
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
            <CardTitle>Répartition par Pôle</CardTitle>
            <CardDescription>
              Distribution des projets par pôle d'activité
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
                    <span className="font-medium">{item.pole}</span>
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
