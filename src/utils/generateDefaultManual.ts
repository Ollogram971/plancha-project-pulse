import jsPDF from "jspdf";

/**
 * Generates the default PLANCHA Projets user manual as a PDF Blob.
 */
export function generateDefaultManualPdf(): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;
  let y = 20;

  const primary = [200, 50, 50]; // brand red-ish
  const dark = [30, 30, 30];
  const gray = [100, 100, 100];

  function checkPage(needed: number) {
    if (y + needed > 275) {
      doc.addPage();
      y = 20;
    }
  }

  function title(text: string) {
    checkPage(18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...primary as [number, number, number]);
    doc.text(text, marginL, y);
    y += 4;
    doc.setDrawColor(...primary as [number, number, number]);
    doc.setLineWidth(0.5);
    doc.line(marginL, y, pageW - marginR, y);
    y += 10;
  }

  function subtitle(text: string) {
    checkPage(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...dark as [number, number, number]);
    doc.text(text, marginL, y);
    y += 8;
  }

  function body(text: string) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...dark as [number, number, number]);
    const lines = doc.splitTextToSize(text, contentW);
    for (const line of lines) {
      checkPage(6);
      doc.text(line, marginL, y);
      y += 5;
    }
    y += 3;
  }

  function bullet(text: string) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...dark as [number, number, number]);
    const lines = doc.splitTextToSize(text, contentW - 8);
    checkPage(6);
    doc.text("•", marginL + 2, y);
    for (let i = 0; i < lines.length; i++) {
      checkPage(6);
      doc.text(lines[i], marginL + 8, y);
      y += 5;
    }
    y += 1;
  }

  function footer() {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...gray as [number, number, number]);
    doc.text("PLANCHA Projets – Mode d'emploi", marginL, 290);
    doc.text(`Page ${doc.getNumberOfPages()}`, pageW - marginR - 15, 290);
  }

  // ─── COVER PAGE ─────────────────────────────────────────────
  doc.setFillColor(...primary as [number, number, number]);
  doc.rect(0, 0, pageW, 50, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text("PLANCHA Projets", pageW / 2, 28, { align: "center" });
  doc.setFontSize(14);
  doc.text("Mode d'emploi", pageW / 2, 40, { align: "center" });

  y = 70;
  doc.setTextColor(...dark as [number, number, number]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Application de gestion et de priorisation de projets", pageW / 2, y, { align: "center" });
  y += 8;
  doc.text("Parc National de la Guadeloupe", pageW / 2, y, { align: "center" });
  y += 20;

  doc.setFontSize(10);
  doc.setTextColor(...gray as [number, number, number]);
  const date = new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long" });
  doc.text(`Version générée : ${date}`, pageW / 2, y, { align: "center" });

  // ─── TABLE DES MATIÈRES ────────────────────────────────────
  doc.addPage();
  y = 20;
  title("Table des matières");

  const chapters = [
    "1. Présentation générale",
    "2. Connexion et authentification",
    "3. Tableau de bord",
    "4. Gestion des projets",
    "5. Notation et pondérations",
    "6. Thèmes et familles",
    "7. Import / Export de données",
    "8. Administration",
    "9. FAQ et aide",
    "10. Astuces et bonnes pratiques",
  ];
  for (const ch of chapters) {
    body(ch);
  }

  // ─── 1. PRÉSENTATION GÉNÉRALE ──────────────────────────────
  doc.addPage();
  y = 20;
  title("1. Présentation générale");
  body("PLANCHA Projets est une application web de gestion et de priorisation de projets. Elle a été développée pour le Parc National de la Guadeloupe afin de faciliter le pilotage stratégique des projets.");
  body("L'application permet de :");
  bullet("Saisir et documenter les projets avec leurs informations détaillées (budget, dates, partenaires, etc.).");
  bullet("Évaluer chaque projet selon des critères multicritères pondérés.");
  bullet("Classer automatiquement les projets par score de priorisation.");
  bullet("Suivre l'avancement et le statut des projets.");
  bullet("Exporter les données pour des analyses complémentaires.");

  subtitle("Rôles utilisateurs");
  body("L'application gère quatre niveaux de rôles :");
  bullet("Administrateur : accès complet à toutes les fonctionnalités, gestion des utilisateurs, des critères, des pondérations et des paramètres.");
  bullet("Validateur : peut valider ou archiver des projets en plus des droits du contributeur.");
  bullet("Contributeur : peut créer, modifier et noter des projets.");
  bullet("Lecteur : accès en consultation uniquement, aucune modification possible.");

  // ─── 2. CONNEXION ──────────────────────────────────────────
  doc.addPage();
  y = 20;
  title("2. Connexion et authentification");
  body("Pour accéder à l'application, rendez-vous sur la page de connexion et saisissez votre adresse e-mail ainsi que votre mot de passe.");
  subtitle("Première connexion");
  body("Lors de votre première connexion, vous recevez un e-mail d'invitation contenant un lien pour définir votre mot de passe. Cliquez sur le lien, puis choisissez un mot de passe sécurisé (minimum 8 caractères).");
  subtitle("Mot de passe oublié");
  body("Sur la page de connexion, cliquez sur « Mot de passe oublié ? ». Un e-mail de réinitialisation vous sera envoyé.");
  subtitle("Modifier son mot de passe");
  body("Une fois connecté, cliquez sur votre adresse e-mail en haut à droite, puis sélectionnez « Modifier le mot de passe ». Saisissez le nouveau mot de passe et confirmez.");

  // ─── 3. TABLEAU DE BORD ────────────────────────────────────
  doc.addPage();
  y = 20;
  title("3. Tableau de bord");
  body("Le tableau de bord est la page d'accueil de l'application. Il offre une vue synthétique de l'ensemble des projets.");
  subtitle("Indicateurs clés");
  bullet("Nombre total de projets en cours, à valider et archivés.");
  bullet("Répartition des projets par pôle/service.");
  bullet("Évolution du budget total et du budget acquis.");
  bullet("Graphiques de répartition par statut de financement et par faisabilité.");
  subtitle("Graphiques");
  body("Les graphiques interactifs permettent de visualiser la répartition des projets selon différents axes : pôle, statut, financement, score de priorisation.");

  // ─── 4. GESTION DES PROJETS ────────────────────────────────
  doc.addPage();
  y = 20;
  title("4. Gestion des projets");
  subtitle("Liste des projets");
  body("La page « Projets » affiche la liste complète des projets avec des filtres par pôle, statut et recherche textuelle. Le tri peut être modifié en cliquant sur les en-têtes de colonnes.");
  subtitle("Créer un nouveau projet");
  body("Cliquez sur le bouton « Nouveau projet ». Renseignez les champs obligatoires :");
  bullet("Titre du projet (obligatoire).");
  bullet("Pôle/Service de rattachement (obligatoire).");
  body("Le code projet est généré automatiquement au format PNG-AAAA-NNN (Parc National Guadeloupe - Année - Numéro séquentiel).");
  body("Champs optionnels disponibles :");
  bullet("Description détaillée du projet.");
  bullet("Famille de thème et thèmes associés.");
  bullet("Dates prévisionnelles de début et de fin.");
  bullet("Budget total et budget acquis.");
  bullet("Sources de financement.");
  bullet("Partenaires impliqués.");
  bullet("Liens utiles (URL).");
  bullet("Évaluation de la faisabilité (bloquant, mitigé, bon, optimal).");
  bullet("Statut de financement.");

  subtitle("Fiche projet détaillée");
  body("En cliquant sur un projet, vous accédez à sa fiche complète comprenant :");
  bullet("Toutes les informations saisies.");
  bullet("La grille de notation multicritères.");
  bullet("Le score pondéré calculé automatiquement.");
  bullet("L'historique des commentaires.");
  bullet("Les pièces jointes.");
  bullet("Un bouton d'impression pour générer un PDF de la fiche.");

  subtitle("Modifier un projet");
  body("Sur la fiche projet, cliquez sur le bouton « Modifier » pour ouvrir le formulaire d'édition. Les modifications sont enregistrées dans l'historique d'audit.");

  subtitle("Archiver / Valider un projet");
  body("Les administrateurs et validateurs peuvent changer le statut d'un projet : « À valider », « En cours » ou « Archivé ». Les projets archivés restent consultables mais ne sont plus actifs.");

  // ─── 5. NOTATION ET PONDÉRATIONS ───────────────────────────
  doc.addPage();
  y = 20;
  title("5. Notation et pondérations");
  subtitle("Principe de notation");
  body("Chaque projet est évalué selon plusieurs critères définis par l'administrateur. Pour chaque critère, un score de 0 à 4 est attribué :");
  bullet("0 : Non applicable / Non évalué.");
  bullet("1 : Faible.");
  bullet("2 : Moyen.");
  bullet("3 : Bon.");
  bullet("4 : Excellent.");
  body("Les échelles de notation détaillées peuvent être consultées en cliquant sur l'icône d'information à côté de chaque critère.");

  subtitle("Profils de pondération");
  body("L'administrateur peut définir plusieurs profils de pondération via la page « Pondérations ». Chaque profil attribue un pourcentage de poids à chaque critère. Le total des pondérations doit atteindre 100 %.");
  body("Un seul profil peut être actif à la fois. Le profil actif est utilisé pour calculer les scores pondérés et le classement de tous les projets.");

  subtitle("Score pondéré et classement");
  body("Le score pondéré est calculé automatiquement en multipliant chaque note par le poids du critère correspondant. Les projets sont ensuite classés par score décroissant, ce qui détermine leur rang de priorisation.");

  // ─── 6. THÈMES ─────────────────────────────────────────────
  doc.addPage();
  y = 20;
  title("6. Thèmes et familles");
  body("Les thèmes permettent de catégoriser les projets par domaine d'intervention. Chaque thème possède un code, un libellé et peut être rattaché à une famille de thèmes.");
  subtitle("Gestion des thèmes (admin)");
  body("L'administrateur peut créer, modifier et supprimer des thèmes depuis la page « Thèmes ». Un thème ne peut être supprimé que s'il n'est associé à aucun projet.");

  // ─── 7. IMPORT / EXPORT ────────────────────────────────────
  doc.addPage();
  y = 20;
  title("7. Import / Export de données");
  subtitle("Import de projets");
  body("L'import permet de créer plusieurs projets en une seule opération à partir d'un fichier Excel (.xlsx).");
  body("Étapes :");
  bullet("1. Téléchargez le template Excel depuis la section « Importation de projets » dans les Paramètres.");
  bullet("2. Remplissez le template avec les données de vos projets. Les champs obligatoires sont : Titre du projet et Pôle/Service (code).");
  bullet("3. Importez le fichier par glisser-déposer ou en cliquant sur la zone d'import.");
  bullet("4. Le système vérifie automatiquement le formatage. En cas d'erreur, un message détaillé indique les corrections à apporter.");
  bullet("5. Si tout est correct, les projets sont créés avec un code automatique.");

  subtitle("Export de données");
  body("L'administrateur peut exporter les données au format Excel depuis la section « Export de données » dans les Paramètres :");
  bullet("Export de la liste complète des projets.");
  bullet("Export des scores et classements.");
  bullet("Export des données de notation détaillées.");

  // ─── 8. ADMINISTRATION ─────────────────────────────────────
  doc.addPage();
  y = 20;
  title("8. Administration");
  body("La section Paramètres (accessible aux administrateurs uniquement) regroupe les fonctionnalités de configuration de l'application.");

  subtitle("Gestion des utilisateurs");
  body("L'administrateur peut inviter de nouveaux utilisateurs par e-mail, leur attribuer un rôle et modifier ou supprimer les comptes existants.");

  subtitle("Informations de l'application");
  body("Mise à jour du numéro de version et de l'année de mise à jour, affichés dans la boîte de dialogue « À propos ».");

  subtitle("Connexion au serveur de base de données");
  body("Configuration et test de la connexion au serveur de base de données.");

  subtitle("Journal d'audit");
  body("Le journal d'audit enregistre automatiquement toutes les actions effectuées dans l'application : création, modification et suppression de projets, scores, utilisateurs, etc. L'administrateur peut consulter et vider ce journal.");

  subtitle("Mode d'emploi");
  body("L'administrateur peut remplacer le fichier PDF du mode d'emploi par une version mise à jour. Le fichier est accessible à tous les utilisateurs depuis le menu « Aide > Télécharger le mode d'emploi ».");

  // ─── 9. FAQ ────────────────────────────────────────────────
  doc.addPage();
  y = 20;
  title("9. FAQ et aide");
  body("La Foire Aux Questions est accessible depuis le menu « Aide > FAQ ». Elle regroupe les réponses aux questions courantes, organisées par catégorie :");
  bullet("Général : présentation, rôles, mot de passe.");
  bullet("Projets : création, modification, statuts.");
  bullet("Notation & Pondérations : fonctionnement des scores.");
  bullet("Import / Export : template, formats.");
  bullet("Administration : utilisateurs, paramètres.");
  bullet("Astuces : raccourcis et bonnes pratiques.");
  body("L'administrateur peut modifier le contenu de la FAQ depuis le bouton « Gérer la FAQ » accessible sur la page FAQ.");

  // ─── 10. ASTUCES ───────────────────────────────────────────
  doc.addPage();
  y = 20;
  title("10. Astuces et bonnes pratiques");
  bullet("Utilisez des titres de projet clairs et descriptifs pour faciliter la recherche.");
  bullet("Renseignez systématiquement la famille de thème pour une meilleure catégorisation.");
  bullet("Notez régulièrement les projets pour maintenir un classement à jour.");
  bullet("Vérifiez que la somme des pondérations atteint 100 % avant d'activer un profil.");
  bullet("Utilisez les commentaires sur les fiches projets pour documenter les décisions.");
  bullet("Exportez régulièrement les données pour disposer de sauvegardes.");
  bullet("Consultez l'échelle de notation détaillée avant de noter un critère pour assurer la cohérence.");
  bullet("Le code projet (PNG-AAAA-NNN) est généré automatiquement et ne peut pas être modifié.");
  bullet("Les projets archivés restent dans la base et peuvent être consultés à tout moment via le filtre de statut.");
  bullet("L'impression d'une fiche projet génère un PDF formaté, idéal pour les réunions et présentations.");

  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    footer();
  }

  return doc.output("blob");
}
