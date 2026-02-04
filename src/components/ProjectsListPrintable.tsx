import { forwardRef } from "react";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  code: string;
  titre: string;
  statut: string;
  score_total: number | null;
  date_demarrage: string | null;
  budget_total: number | null;
  famille_theme: string | null;
  poles?: { code: string; libelle: string } | null;
}

interface ProjectsListPrintableProps {
  projects: Project[];
  budgetFormatted: string;
  budgetCount: number;
  totalProjects: number;
  filterInfo?: {
    pole?: string;
    status?: string;
    famille?: string;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "en_cours":
      return "bg-green-100 text-green-800 border-green-200";
    case "a_valider":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "archive":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
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

export const ProjectsListPrintable = forwardRef<HTMLDivElement, ProjectsListPrintableProps>(
  ({ projects, budgetFormatted, budgetCount, totalProjects, filterInfo }, ref) => {
    const today = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <div ref={ref} className="print-container hidden print:block p-8 bg-white text-black">
        {/* Header */}
        <div className="mb-6 border-b-2 border-gray-300 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Liste des Projets PLANCHA</h1>
              <p className="text-sm text-gray-600 mt-1">
                Classés par score PLANCHA décroissant • {projects.length} projet{projects.length > 1 ? 's' : ''}
              </p>
              {filterInfo && (filterInfo.pole || filterInfo.status || filterInfo.famille) && (
                <p className="text-xs text-gray-500 mt-1">
                  Filtres actifs: {[filterInfo.pole, filterInfo.status, filterInfo.famille].filter(Boolean).join(' • ')}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="border-2 border-green-600 rounded-lg px-4 py-2 bg-green-50">
                <p className="text-xs text-gray-600 font-medium">Budget total</p>
                <p className="text-xl font-bold text-green-700">{budgetFormatted}</p>
                {budgetCount < totalProjects && (
                  <p className="text-xs text-gray-500">({budgetCount}/{totalProjects} projets)</p>
                )}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Imprimé le {today}</p>
        </div>

        {/* Projects Table */}
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300 bg-gray-50">
              <th className="text-left py-2 px-2 font-semibold w-8">#</th>
              <th className="text-left py-2 px-2 font-semibold">Code</th>
              <th className="text-left py-2 px-2 font-semibold">Titre</th>
              <th className="text-left py-2 px-2 font-semibold">Pôle/Service</th>
              <th className="text-left py-2 px-2 font-semibold">Famille</th>
              <th className="text-center py-2 px-2 font-semibold">Statut</th>
              <th className="text-right py-2 px-2 font-semibold">Budget</th>
              <th className="text-right py-2 px-2 font-semibold">Score</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project, index) => (
              <tr key={project.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-2 px-2 text-gray-500 font-medium">{index + 1}</td>
                <td className="py-2 px-2 font-mono text-xs">{project.code}</td>
                <td className="py-2 px-2 font-medium max-w-xs">
                  <span className="line-clamp-2">{project.titre}</span>
                </td>
                <td className="py-2 px-2 text-gray-600 text-xs">{project.poles?.libelle || 'N/A'}</td>
                <td className="py-2 px-2 text-gray-600 text-xs">{project.famille_theme || '-'}</td>
                <td className="py-2 px-2 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(project.statut)}`}>
                    {formatStatus(project.statut)}
                  </span>
                </td>
                <td className="py-2 px-2 text-right font-mono text-xs">
                  {project.budget_total 
                    ? `${(Number(project.budget_total) / 1000).toFixed(0)}k€`
                    : '-'}
                </td>
                <td className="py-2 px-2 text-right font-mono font-bold">
                  {project.score_total !== null ? project.score_total.toFixed(1) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
          <span>PLANCHA - Gestion et suivi des projets</span>
          <span>Page 1</span>
        </div>
      </div>
    );
  }
);

ProjectsListPrintable.displayName = "ProjectsListPrintable";
