import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, RotateCcw, Euro, Printer, FileSpreadsheet } from "lucide-react";
import ExcelJS from "exceljs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjects } from "@/hooks/useProjects";
import { usePoles } from "@/hooks/usePoles";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectDialog } from "@/components/ProjectDialog";
import { ProjectsListPrintable } from "@/components/ProjectsListPrintable";

const getStatusColor = (status: string) => {
  switch (status) {
    case "en_cours":
      return "secondary";
    case "a_valider":
      return "warning";
    case "archive":
      return "muted";
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
  const [filterFamilleTheme, setFilterFamilleTheme] = useState<string>("all");
  const printRef = useRef<HTMLDivElement>(null);

  const { data: projects, isLoading } = useProjects();
  const { data: poles } = usePoles();

  // Fetch unique theme families
  const { data: themeFamilies } = useQuery({
    queryKey: ['theme-families'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('themes')
        .select('famille')
        .not('famille', 'is', null)
        .order('famille');
      
      if (error) throw error;
      
      // Get unique families
      const uniqueFamilies = Array.from(new Set(data.map(t => t.famille).filter(Boolean)));
      return uniqueFamilies as string[];
    },
  });

  // Initialize filter from URL params
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam === 'attention') {
      setFilterStatus('attention');
    } else if (statusParam === 'en_cours') {
      setFilterStatus('en_cours');
    }
    
    const poleParam = searchParams.get('pole');
    if (poleParam) {
      setFilterPole(poleParam);
    }
  }, [searchParams]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterPole("all");
    setFilterStatus("all");
    setFilterFamilleTheme("all");
  };

  const hasActiveFilters = searchQuery !== "" || filterPole !== "all" || filterStatus !== "all" || filterFamilleTheme !== "all";

  // Get filter info for print
  const filterInfo = useMemo(() => {
    const poleName = poles?.find(p => p.id === filterPole)?.libelle;
    const statusLabel = filterStatus === "attention" ? "Attention requise" :
      filterStatus === "a_valider" ? "À valider" :
      filterStatus === "en_cours" ? "En cours" :
      filterStatus === "archive" ? "Archivé" : undefined;
    
    return {
      pole: filterPole !== "all" ? poleName : undefined,
      status: filterStatus !== "all" ? statusLabel : undefined,
      famille: filterFamilleTheme !== "all" ? filterFamilleTheme : undefined,
    };
  }, [filterPole, filterStatus, filterFamilleTheme, poles]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportXLS = async () => {
    if (!filteredProjects || filteredProjects.length === 0) return;

    const data = filteredProjects.map((project, index) => ({
      "#": index + 1,
      "Code": project.code,
      "Titre": project.titre,
      "Pôle/Service": project.poles?.libelle || "N/A",
      "Famille": project.famille_theme || "-",
      "Statut": formatStatus(project.statut),
      "Date démarrage": project.date_demarrage 
        ? new Date(project.date_demarrage).toLocaleDateString('fr-FR')
        : "-",
      "Budget (€)": project.budget_total || 0,
      "Score PLANCHA": project.score_total !== null ? project.score_total : "-",
    }));

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Projets");

    const headers = ["#", "Code", "Titre", "Pôle/Service", "Famille", "Statut", "Date démarrage", "Budget (€)", "Score PLANCHA"];
    ws.addRow(headers);
    // Bold header row
    ws.getRow(1).font = { bold: true };

    data.forEach(row => {
      ws.addRow(Object.values(row));
    });

    // Set column widths
    ws.columns = [
      { width: 5 },  // #
      { width: 12 }, // Code
      { width: 40 }, // Titre
      { width: 20 }, // Pôle
      { width: 15 }, // Famille
      { width: 12 }, // Statut
      { width: 15 }, // Date
      { width: 12 }, // Budget
      { width: 15 }, // Score
    ];

    const today = new Date().toISOString().slice(0, 10);
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projets-plancha-${today}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    return projects.filter((project) => {
      const formattedDate = project.date_demarrage 
        ? new Date(project.date_demarrage).toLocaleDateString('fr-FR')
        : '';
      
      const matchesSearch =
        searchQuery === "" ||
        project.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formattedDate.includes(searchQuery);

      const matchesPole =
        filterPole === "all" || project.pole_id === filterPole;

      const matchesStatus =
        filterStatus === "all" ? true :
        filterStatus === "attention" 
          ? project.statut === "a_valider"
          : project.statut === filterStatus;

      const matchesFamilleTheme =
        filterFamilleTheme === "all" || project.famille_theme === filterFamilleTheme;

      return matchesSearch && matchesPole && matchesStatus && matchesFamilleTheme;
    });
  }, [projects, searchQuery, filterPole, filterStatus, filterFamilleTheme]);

  // Calculate total budget of filtered projects
  const budgetStats = useMemo(() => {
    if (!filteredProjects || filteredProjects.length === 0) {
      return { total: 0, count: 0, formatted: "0 €" };
    }

    const projectsWithBudget = filteredProjects.filter(p => p.budget_total !== null && p.budget_total !== undefined);
    const total = projectsWithBudget.reduce((sum, project) => sum + Number(project.budget_total || 0), 0);
    
    // Format the budget in a readable way
    let formatted: string;
    if (total >= 1000000) {
      formatted = `${(total / 1000000).toFixed(2).replace('.', ',')} M€`;
    } else if (total >= 1000) {
      formatted = `${(total / 1000).toFixed(0)} k€`;
    } else {
      formatted = `${total.toFixed(0)} €`;
    }

    return { 
      total, 
      count: projectsWithBudget.length,
      formatted
    };
  }, [filteredProjects]);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projets</h1>
          <p className="text-muted-foreground mt-2">
            Gestion et suivi des projets PLANCHA
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportXLS}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export XLS
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
          <ProjectDialog />
        </div>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtres et recherche</CardTitle>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par code, titre, date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterPole} onValueChange={setFilterPole}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les Pôles/Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les Pôles/Services</SelectItem>
                {poles?.map((pole) => (
                  <SelectItem key={pole.id} value={pole.id}>
                    {pole.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterFamilleTheme} onValueChange={setFilterFamilleTheme}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les familles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les familles</SelectItem>
                {themeFamilies?.map((famille) => (
                  <SelectItem key={famille} value={famille}>
                    {famille}
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
      <Card className="print:hidden">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Liste des projets ({filteredProjects.length})</CardTitle>
              <CardDescription>
                Classés par score PLANCHA décroissant
              </CardDescription>
            </div>
            {budgetStats.count > 0 && (
              <div className="flex items-center gap-3 bg-primary/10 rounded-lg px-4 py-2.5 border border-primary/20">
                <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary text-primary-foreground">
                  <Euro className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground font-medium">Budget total</p>
                  <p className="text-lg font-bold text-primary">{budgetStats.formatted}</p>
                </div>
                {budgetStats.count < filteredProjects.length && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({budgetStats.count}/{filteredProjects.length} projets)
                  </span>
                )}
              </div>
            )}
          </div>
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
                              {project.famille_theme && (
                                <> • {project.famille_theme}</>
                              )}
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

      {/* Printable version */}
      <ProjectsListPrintable
        ref={printRef}
        projects={filteredProjects}
        budgetFormatted={budgetStats.formatted}
        budgetCount={budgetStats.count}
        totalProjects={filteredProjects.length}
        filterInfo={filterInfo}
      />
    </div>
  );
}
