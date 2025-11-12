import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, FolderKanban, AlertCircle } from "lucide-react";

// Mock data for demonstration
const mockStats = {
  totalProjects: 127,
  validatedProjects: 98,
  averageScore: 67.3,
  projectsNeedingAttention: 12,
};

const mockTopProjects = [
  { id: 1, code: "PNG-2025-001", title: "Restauration écologique zone humide", score: 94.2, pole: "Conservation" },
  { id: 2, code: "PNG-2025-015", title: "Sentier pédagogique biodiversité", score: 91.8, pole: "Éducation" },
  { id: 3, code: "PNG-2025-023", title: "Monitoring faune endémique", score: 89.5, pole: "Recherche" },
  { id: 4, code: "PNG-2024-087", title: "Lutte espèces invasives", score: 87.3, pole: "Conservation" },
  { id: 5, code: "PNG-2025-042", title: "Infrastructure accueil visiteurs", score: 85.1, pole: "Aménagement" },
];

const mockPoleDistribution = [
  { pole: "Conservation", count: 42, percentage: 33 },
  { pole: "Éducation", count: 28, percentage: 22 },
  { pole: "Recherche", count: 25, percentage: 20 },
  { pole: "Aménagement", count: 18, percentage: 14 },
  { pole: "Administration", count: 14, percentage: 11 },
];

export default function Dashboard() {
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
            <div className="text-2xl font-bold">{mockStats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {mockStats.validatedProjects} validés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Moyen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.averageScore}</div>
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
              {Math.round((mockStats.validatedProjects / mockStats.totalProjects) * 100)}%
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
            <div className="text-2xl font-bold">{mockStats.projectsNeedingAttention}</div>
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
              {mockTopProjects.map((project, index) => (
                <div key={project.id} className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">{project.title}</p>
                      <Badge variant="secondary" className="ml-2">
                        {project.score.toFixed(1)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {project.code} • {project.pole}
                    </p>
                  </div>
                </div>
              ))}
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
              {mockPoleDistribution.map((item) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
