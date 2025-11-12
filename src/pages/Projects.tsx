import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data
const mockProjects = [
  {
    id: 1,
    code: "PNG-2025-001",
    title: "Restauration écologique zone humide",
    pole: "Conservation",
    status: "Validé",
    score: 94.2,
    dateStart: "2025-03-15",
    budget: 250000,
  },
  {
    id: 2,
    code: "PNG-2025-015",
    title: "Sentier pédagogique biodiversité",
    pole: "Éducation",
    status: "Validé",
    score: 91.8,
    dateStart: "2025-04-01",
    budget: 180000,
  },
  {
    id: 3,
    code: "PNG-2025-023",
    title: "Monitoring faune endémique",
    pole: "Recherche",
    status: "Validé",
    score: 89.5,
    dateStart: "2025-02-20",
    budget: 320000,
  },
  {
    id: 4,
    code: "PNG-2024-087",
    title: "Lutte espèces invasives",
    pole: "Conservation",
    status: "En cours",
    score: 87.3,
    dateStart: "2024-11-10",
    budget: 140000,
  },
  {
    id: 5,
    code: "PNG-2025-042",
    title: "Infrastructure accueil visiteurs",
    pole: "Aménagement",
    status: "À valider",
    score: 85.1,
    dateStart: "2025-06-01",
    budget: 450000,
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Validé":
      return "success";
    case "En cours":
      return "secondary";
    case "À valider":
      return "warning";
    default:
      return "default";
  }
};

export default function Projects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPole, setFilterPole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

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
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau projet
        </Button>
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
                <SelectItem value="conservation">Conservation</SelectItem>
                <SelectItem value="education">Éducation</SelectItem>
                <SelectItem value="recherche">Recherche</SelectItem>
                <SelectItem value="amenagement">Aménagement</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="valide">Validé</SelectItem>
                <SelectItem value="encours">En cours</SelectItem>
                <SelectItem value="avalider">À valider</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des projets ({mockProjects.length})</CardTitle>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Trier
            </Button>
          </div>
          <CardDescription>
            Classés par score PLANCHA décroissant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockProjects.map((project, index) => (
              <Card key={project.id} className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base">{project.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {project.code} • {project.pole}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={getStatusColor(project.status) as any}>
                            {project.status}
                          </Badge>
                          <Badge variant="outline" className="font-mono font-bold">
                            {project.score.toFixed(1)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Démarrage: {new Date(project.dateStart).toLocaleDateString('fr-FR')}</span>
                        <span>Budget: {(project.budget / 1000).toFixed(0)}k€</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
