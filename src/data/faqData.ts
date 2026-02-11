export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface FaqCategory {
  name: string;
  icon: string; // lucide icon name
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  { name: "Général", icon: "info" },
  { name: "Projets", icon: "folder" },
  { name: "Notation & Pondérations", icon: "bar-chart" },
  { name: "Import / Export", icon: "upload" },
  { name: "Administration", icon: "shield" },
  { name: "Astuces", icon: "lightbulb" },
];

export const DEFAULT_FAQ: FaqItem[] = [
  // ── Général ──
  {
    id: "gen-1",
    question: "Qu'est-ce que PLANCHA Projets ?",
    answer: "PLANCHA Projets est une application de gestion et de priorisation de projets développée pour le Parc National de la Guadeloupe. Elle permet de saisir, évaluer et classer les projets selon des critères pondérés afin d'aider à la prise de décision.",
    category: "Général",
  },
  {
    id: "gen-2",
    question: "Quels sont les différents rôles utilisateur ?",
    answer: "Il existe 4 rôles :\n• **Administrateur** : accès complet (paramétrage, gestion des utilisateurs, pondérations, thèmes…).\n• **Validateur** : peut valider ou archiver des projets.\n• **Contributeur** : peut créer et modifier des projets.\n• **Lecteur** : accès en consultation uniquement.",
    category: "Général",
  },
  {
    id: "gen-3",
    question: "Comment changer mon mot de passe ?",
    answer: "Cliquez sur votre adresse e-mail en haut à droite de l'écran, puis sélectionnez **Modifier le mot de passe**. Renseignez votre nouveau mot de passe (8 caractères minimum) et confirmez.",
    category: "Général",
  },

  // ── Projets ──
  {
    id: "proj-1",
    question: "Comment créer un nouveau projet ?",
    answer: "Rendez-vous sur la page **Projets**, puis cliquez sur le bouton **Nouveau projet**. Renseignez les champs obligatoires (titre, pôle/service) et complétez les informations optionnelles (description, thèmes, budget, dates…). Le code projet est généré automatiquement au format `PNG-AAAA-NNN`.",
    category: "Projets",
  },
  {
    id: "proj-2",
    question: "Que signifient les statuts de projet ?",
    answer: "• **À valider** : le projet vient d'être créé et attend une validation.\n• **En cours** : le projet est validé et en phase active.\n• **Archivé** : le projet est terminé ou abandonné.\n\nSeuls les utilisateurs avec le rôle Validateur ou Administrateur peuvent changer le statut.",
    category: "Projets",
  },
  {
    id: "proj-3",
    question: "Comment ajouter des pièces jointes à un projet ?",
    answer: "Ouvrez la fiche détaillée du projet, puis utilisez la section **Pièces jointes** pour glisser-déposer ou sélectionner vos fichiers. Les formats courants sont acceptés (PDF, images, documents Office…).",
    category: "Projets",
  },
  {
    id: "proj-4",
    question: "Comment filtrer et rechercher des projets ?",
    answer: "Sur la page **Projets**, utilisez la barre de recherche pour filtrer par titre ou code. Vous pouvez également filtrer par pôle, statut ou thème grâce aux filtres disponibles au-dessus de la liste.",
    category: "Projets",
  },
  {
    id: "proj-5",
    question: "Qu'est-ce que la faisabilité d'un projet ?",
    answer: "La faisabilité indique le niveau de réalisme du projet :\n• **Optimal** : toutes les conditions sont réunies.\n• **Bon** : conditions favorables avec quelques réserves.\n• **Mitigé** : des obstacles significatifs existent.\n• **Bloquant** : le projet ne peut pas être réalisé en l'état.",
    category: "Projets",
  },
  {
    id: "proj-6",
    question: "Comment sont gérées les dates de fin de projet ?",
    answer: "Lorsqu'un projet dépasse sa date de fin prévisionnelle sans être archivé, une alerte s'affiche en haut de l'application pour prévenir les utilisateurs des projets échus. Cela permet de prendre les décisions nécessaires (prolongation, archivage…).",
    category: "Projets",
  },

  // ── Notation & Pondérations ──
  {
    id: "note-1",
    question: "Comment fonctionne la notation des projets ?",
    answer: "Chaque projet est évalué sur plusieurs critères (ex : impact environnemental, faisabilité financière…). Chaque critère reçoit une note de 0 à 4 selon une échelle prédéfinie. Le score total est calculé automatiquement en appliquant les pondérations du profil actif.",
    category: "Notation & Pondérations",
  },
  {
    id: "note-2",
    question: "Qu'est-ce qu'un profil de pondération ?",
    answer: "Un profil de pondération définit l'importance relative de chaque critère (en pourcentage). Par exemple, un profil peut accorder 30 % à l'impact biodiversité et 10 % au budget. Seul un profil peut être actif à la fois. L'administrateur peut créer plusieurs profils et basculer entre eux.",
    category: "Notation & Pondérations",
  },
  {
    id: "note-3",
    question: "Comment consulter les échelles de notation ?",
    answer: "Sur la page **Pondérations**, cliquez sur l'icône d'information à côté d'un critère pour voir le détail de l'échelle de notation (description de chaque note de 0 à 4).",
    category: "Notation & Pondérations",
  },
  {
    id: "note-4",
    question: "Comment le rang d'un projet est-il calculé ?",
    answer: "Le rang est déterminé par le score pondéré total du projet par rapport aux autres projets. Plus le score est élevé, meilleur est le rang. Le classement est recalculé automatiquement à chaque modification de notation ou de pondération.",
    category: "Notation & Pondérations",
  },

  // ── Import / Export ──
  {
    id: "imp-1",
    question: "Comment importer des projets en masse ?",
    answer: "Allez dans **Paramètres > Importation de projets**.\n1. Téléchargez le template Excel.\n2. Remplissez-le avec vos projets (colonnes : Titre*, Pôle/Service*, Famille de thème, Description).\n3. Importez le fichier via le bouton ou par glisser-déposer.\n\nLe code projet est généré automatiquement. Les erreurs de formatage sont signalées avant l'import.",
    category: "Import / Export",
  },
  {
    id: "imp-2",
    question: "Comment exporter les données ?",
    answer: "Depuis **Paramètres > Exportation des données**, vous pouvez exporter la liste des projets, les scores ou d'autres données au format Excel. Vous pouvez également imprimer la fiche détaillée d'un projet depuis sa page.",
    category: "Import / Export",
  },
  {
    id: "imp-3",
    question: "Le template d'import a-t-il changé ?",
    answer: "Le template actuel comporte 4 colonnes : **Titre du projet** (obligatoire), **Pôle/Service (code)** (obligatoire), **Famille de thème** et **Description**. La colonne Code projet n'existe plus car il est généré automatiquement. Téléchargez toujours la dernière version du template.",
    category: "Import / Export",
  },

  // ── Administration ──
  {
    id: "admin-1",
    question: "Comment gérer les utilisateurs ?",
    answer: "Dans **Paramètres > Gestion des utilisateurs**, l'administrateur peut :\n• Inviter de nouveaux utilisateurs par e-mail.\n• Attribuer ou modifier les rôles.\n• Consulter la liste des utilisateurs inscrits.\n\nChaque utilisateur reçoit un e-mail d'invitation avec un lien de connexion.",
    category: "Administration",
  },
  {
    id: "admin-2",
    question: "Comment gérer les pôles et services ?",
    answer: "Depuis **Paramètres > Gestion des pôles**, l'administrateur peut ajouter, modifier ou supprimer des pôles/services. Chaque pôle est identifié par un code unique et un libellé. Un pôle ne peut pas être supprimé s'il est référencé par des projets.",
    category: "Administration",
  },
  {
    id: "admin-3",
    question: "Comment configurer le serveur de base de données ?",
    answer: "Dans **Paramètres > Serveur de base de données**, l'administrateur peut tester la connexion au serveur par défaut ou configurer un serveur externe PostgreSQL. Après un test de connexion réussi, cliquez sur **Enregistrer** pour basculer vers ce serveur.",
    category: "Administration",
  },
  {
    id: "admin-4",
    question: "Comment gérer les thèmes de projet ?",
    answer: "La page **Thèmes** (accessible aux administrateurs) permet de créer, modifier et organiser les thèmes et familles de thèmes. Les thèmes sont ensuite associables aux projets pour les catégoriser.",
    category: "Administration",
  },

  // ── Astuces ──
  {
    id: "tip-1",
    question: "Comment imprimer la fiche d'un projet ?",
    answer: "Ouvrez la fiche détaillée du projet et cliquez sur l'icône **Imprimer** dans la barre d'actions. Une version optimisée pour l'impression s'affichera, incluant toutes les informations du projet, ses scores et ses commentaires.",
    category: "Astuces",
  },
  {
    id: "tip-2",
    question: "Le tableau de bord affiche-t-il des statistiques en temps réel ?",
    answer: "Oui, le **Tableau de bord** affiche des indicateurs clés mis à jour en temps réel : nombre de projets par statut, répartition par pôle, avancement moyen, projets échus, etc. C'est le point d'entrée idéal pour avoir une vue d'ensemble.",
    category: "Astuces",
  },
  {
    id: "tip-3",
    question: "Puis-je ajouter des commentaires sur un projet ?",
    answer: "Oui, chaque fiche projet dispose d'une section **Commentaires** où tous les utilisateurs authentifiés peuvent laisser des observations, remarques ou suggestions. Les commentaires sont horodatés et identifient l'auteur.",
    category: "Astuces",
  },
  {
    id: "tip-4",
    question: "Comment revenir rapidement au tableau de bord ?",
    answer: "Cliquez sur le logo **PLANCHA** ou sur **Tableau de bord** dans la barre de navigation en haut de l'écran.",
    category: "Astuces",
  },
  {
    id: "tip-5",
    question: "Les sources de financement sont-elles prédéfinies ?",
    answer: "Oui, une liste de sources de financement courantes est proposée lors de la saisie (FEDER, OFB, Collectivités, etc.). Vous pouvez en sélectionner plusieurs pour un même projet.",
    category: "Astuces",
  },
];

const FAQ_STORAGE_KEY = "plancha_faq_data";

export function getFaqData(): FaqItem[] {
  const stored = localStorage.getItem(FAQ_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_FAQ;
    }
  }
  return DEFAULT_FAQ;
}

export function saveFaqData(items: FaqItem[]): void {
  localStorage.setItem(FAQ_STORAGE_KEY, JSON.stringify(items));
}

export function resetFaqData(): void {
  localStorage.removeItem(FAQ_STORAGE_KEY);
}
