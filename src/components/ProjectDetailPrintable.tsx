import { forwardRef } from "react";

interface ProjectDetailPrintableProps {
  project: {
    id: string;
    code: string;
    titre: string;
    statut: string;
    description?: string | null;
    score_total: number | null;
    rang?: number | null;
    budget_total?: number | null;
    budget_acquis?: number | null;
    financement_statut?: string | null;
    sources_financement?: string[] | null;
    date_previsionnelle_debut?: string | null;
    date_demarrage?: string | null;
    date_fin?: string | null;
    avancement?: number | null;
    risques?: string | null;
    partenaires?: string[] | null;
    liens?: string[] | null;
    poles?: { code: string; libelle: string } | null;
    profiles?: { full_name: string } | null;
  };
  activeWeights?: any[];
  projectScores?: any[];
  allScales?: any[];
}

const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    a_valider: "À valider",
    en_cours: "En cours",
    archive: "Archivé",
  };
  return statusMap[status] || status;
};

const getStatusClass = (status: string) => {
  switch (status) {
    case "en_cours":
      return "en-cours";
    case "a_valider":
      return "a-valider";
    case "archive":
      return "archive";
    default:
      return "";
  }
};

const getScoreLabel = (score: number, criterionId?: string, allScales?: any[]) => {
  if (criterionId && allScales) {
    const scale = allScales.find(
      (s: any) => s.criterion_id === criterionId && s.score_value === score
    );
    if (scale?.description && scale.description !== "Non défini") {
      return `${score} - ${scale.description}`;
    }
  }
  const defaultLabels: Record<number, string> = {
    0: "Non applicable", 1: "Faible", 2: "Moyen", 3: "Bon", 4: "Excellent",
  };
  return defaultLabels[score] !== undefined ? `${score} - ${defaultLabels[score]}` : "-";
};

export const ProjectDetailPrintable = forwardRef<HTMLDivElement, ProjectDetailPrintableProps>(
  ({ project, activeWeights, projectScores, allScales }, ref) => {
    const today = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Calculate progress
    let calculatedProgress: number | null = null;
    if (project.date_demarrage && project.date_fin) {
      const startDate = new Date(project.date_demarrage);
      const endDate = new Date(project.date_fin);
      const todayDate = new Date();
      const totalDuration = endDate.getTime() - startDate.getTime();
      const elapsed = todayDate.getTime() - startDate.getTime();
      if (totalDuration > 0) {
        calculatedProgress = Math.round((elapsed / totalDuration) * 100);
        calculatedProgress = Math.max(0, Math.min(100, calculatedProgress));
      }
    }
    const displayProgress = calculatedProgress ?? project.avancement;

    return (
      <div ref={ref} className="project-print-container hidden print:block">
        {/* Header */}
        <div className="print-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="print-title">{project.titre}</h1>
              <p className="print-code">{project.code}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`print-status ${getStatusClass(project.statut)}`}>
                {formatStatus(project.statut)}
              </span>
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '12px', color: '#666' }}>Score PLANCHA</span>
                <p className="print-score">
                  {project.score_total ? project.score_total.toFixed(1) : "0.0"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="print-grid">
          {/* Informations générales */}
          <div className="print-section">
            <h3 className="print-section-title">Informations générales</h3>
            <div className="print-row">
              <span className="print-label">Pôle/Service</span>
              <span className="print-value">{project.poles?.libelle || "N/A"}</span>
            </div>
            {project.profiles?.full_name && (
              <div className="print-row">
                <span className="print-label">Chef de projet</span>
                <span className="print-value">{project.profiles.full_name}</span>
              </div>
            )}
            {project.description && (
              <div className="print-row">
                <span className="print-label">Description</span>
                <span className="print-value">{project.description}</span>
              </div>
            )}
            {project.rang && (
              <div className="print-row">
                <span className="print-label">Rang</span>
                <span className="print-value">#{project.rang}</span>
              </div>
            )}
          </div>

          {/* Budget */}
          <div className="print-section">
            <h3 className="print-section-title">Budget</h3>
            {project.budget_total && (
              <div className="print-row">
                <span className="print-label">Budget total</span>
                <span className="print-value">{Number(project.budget_total).toLocaleString('fr-FR')} €</span>
              </div>
            )}
            {project.budget_acquis && (
              <div className="print-row">
                <span className="print-label">Budget acquis</span>
                <span className="print-value">{Number(project.budget_acquis).toLocaleString('fr-FR')} €</span>
              </div>
            )}
            {project.financement_statut && (
              <div className="print-row">
                <span className="print-label">Statut financement</span>
                <span className="print-value" style={{ textTransform: 'capitalize' }}>
                  {project.financement_statut.replace('_', ' ')}
                </span>
              </div>
            )}
            {project.sources_financement && project.sources_financement.length > 0 && (
              <div className="print-row" style={{ flexDirection: 'column' }}>
                <span className="print-label" style={{ marginBottom: '4px' }}>Sources de financement</span>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                  {[...project.sources_financement].sort((a, b) => a.localeCompare(b, 'fr')).map((source, idx) => (
                    <li key={idx}>{source}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Calendrier */}
          <div className="print-section">
            <h3 className="print-section-title">Calendrier</h3>
            {project.date_previsionnelle_debut && (
              <div className="print-row">
                <span className="print-label">Date prév. début</span>
                <span className="print-value">
                  {new Date(project.date_previsionnelle_debut).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
            {project.date_demarrage && (
              <div className="print-row">
                <span className="print-label">Date de démarrage</span>
                <span className="print-value">
                  {new Date(project.date_demarrage).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
            {project.date_fin && (
              <div className="print-row">
                <span className="print-label">Date de fin</span>
                <span className="print-value">
                  {new Date(project.date_fin).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
            {displayProgress !== null && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="print-label">Avancement</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{displayProgress}%</span>
                </div>
                <div className="print-progress-bar">
                  <div className="print-progress-fill" style={{ width: `${displayProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Informations complémentaires */}
          <div className="print-section">
            <h3 className="print-section-title">Informations complémentaires</h3>
            {project.risques ? (
              <div className="print-row" style={{ flexDirection: 'column' }}>
                <span className="print-label" style={{ marginBottom: '4px' }}>Risques</span>
                <span className="print-value">{project.risques}</span>
              </div>
            ) : null}
            {project.partenaires && project.partenaires.length > 0 ? (
              <div className="print-row" style={{ flexDirection: 'column' }}>
                <span className="print-label" style={{ marginBottom: '4px' }}>Partenaires</span>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                  {project.partenaires.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {project.liens && project.liens.length > 0 ? (
              <div className="print-row" style={{ flexDirection: 'column' }}>
                <span className="print-label" style={{ marginBottom: '4px' }}>Liens</span>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                  {project.liens.map((l, idx) => (
                    <li key={idx}>{l}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {!project.risques && (!project.partenaires || project.partenaires.length === 0) && (!project.liens || project.liens.length === 0) && (
              <p style={{ fontSize: '12px', color: '#999', fontStyle: 'italic' }}>Aucune information complémentaire</p>
            )}
          </div>
        </div>

        {/* Évaluation du projet */}
        {activeWeights && activeWeights.length > 0 && (
          <div className="print-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #e5e5e5' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#2d6a4f', margin: 0 }}>Évaluation du projet</h3>
                <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 0 0' }}>Chaque critère est noté de 0 à 4</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', color: '#666' }}>Score total</span>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#2d6a4f', margin: 0 }}>
                  {project.score_total ? project.score_total.toFixed(2) : "0.00"} / 100
                </p>
              </div>
            </div>
            <div className="print-criteria-grid">
              {activeWeights.map((weight: any) => {
                const criterionScore = projectScores?.find(
                  (s: any) => s.criterion_id === weight.criterion_id
                );
                const scoreValue = criterionScore?.score_0_4 ?? 0;

                return (
                  <div key={weight.id} className="print-criterion">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p className="print-criterion-name">{weight.criteria?.libelle}</p>
                        <p className="print-criterion-score">Poids: {Number(weight.poids_percent).toFixed(0)}%</p>
                      </div>
                      <span style={{ fontSize: '11px', color: '#666' }}>= {(scoreValue * 25).toFixed(2)}</span>
                    </div>
                    <p className="print-criterion-score">{getScoreLabel(scoreValue, weight.criterion_id, allScales)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="print-footer">
          <span>PLANCHA - Fiche projet</span>
          <span>Imprimé le {today}</span>
        </div>
      </div>
    );
  }
);

ProjectDetailPrintable.displayName = "ProjectDetailPrintable";
