import jsPDF from "jspdf";

/**
 * Generates a comprehensive user manual PDF for PLANCHA Projets.
 * Returns a Blob of the PDF.
 */
export function generateUserManualPdf(): Blob {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 20;

  const colors = {
    primary: [200, 30, 60] as [number, number, number],
    dark: [30, 30, 30] as [number, number, number],
    gray: [100, 100, 100] as [number, number, number],
    lightGray: [180, 180, 180] as [number, number, number],
  };

  function checkPage(needed: number) {
    if (y + needed > 270) {
      doc.addPage();
      y = 20;
    }
  }

  function addTitle(text: string) {
    checkPage(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...colors.primary);
    doc.text(text, pageWidth / 2, y, { align: "center" });
    y += 12;
  }

  function addSectionTitle(num: string, text: string) {
    checkPage(18);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...colors.primary);
    doc.text(`${num}. ${text}`, marginLeft, y);
    y += 2;
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, y, marginLeft + contentWidth, y);
    y += 8;
  }

  function addSubSection(text: string) {
    checkPage(12);
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...colors.dark);
    doc.text(text, marginLeft + 4, y);
    y += 6;
  }

  function addParagraph(text: string) {
    checkPage(10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.dark);
    const lines = doc.splitTextToSize(text, contentWidth - 4);
    doc.text(lines, marginLeft + 4, y);
    y += lines.length * 5 + 3;
  }

  function addBullet(text: string) {
    checkPage(8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...colors.dark);
    doc.text("•", marginLeft + 6, y);
    const lines = doc.splitTextToSize(text, contentWidth - 16);
    doc.text(lines, marginLeft + 12, y);
    y += lines.length * 5 + 2;
  }

  // ═══════════════════════════════════════════
  // PAGE DE COUVERTURE
  // ═══════════════════════════════════════════
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(...colors.primary);
  doc.text("PLANCHA Projets", pageWidth / 2, 80, { align: "center" });

  doc.setFontSize(16);
  doc.setTextColor(...colors.dark);
  doc.text("Mode d'emploi complet", pageWidth / 2, 95, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...colors.gray);
  doc.text("Parc National de la Guadeloupe", pageWidth / 2, 115, { align: "center" });
  doc.text("Service Informatique", pageWidth / 2, 122, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Version du document : ${new Date().toLocaleDateString("fr-FR")}`, pageWidth / 2, 140, { align: "center" });

  // ═══════════════════════════════════════════
  // TABLE DES MATIÈRES
  // ═══════════════════════════════════════════
  doc.addPage();
  y = 20;
  addTitle("Table des matières");
  y += 4;

  const toc = [
    "1. Présentation générale",
    "2. Connexion et authentification",
    "3. Tableau de bord",
    "4. Gestion des projets",
    "5. Notation et évaluation (PLANCHA)",
    "6. Pondérations",
    "7. Thèmes",
    "8. Import / Export de données",
    "9. Administration",
    "10. FAQ et Aide",
    "11. Astuces et bonnes pratiques",
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...colors.dark);
  toc.forEach((item) => {
    doc.text(item, marginLeft + 10, y);
    y += 7;
  });

  // ═══════════════════════════════════════════
  // 1. PRÉSENTATION GÉNÉRALE
  // ═══════════════════════════════════════════
  doc.addPage();
  y = 20;
  addSectionTitle("1", "Présentation générale");

  addParagraph(
    "PLANCHA Projets est une application web de gestion et de priorisation de projets conçue pour le Parc National de la Guadeloupe (PNG). Elle permet de centraliser l'ensemble des projets, de les évaluer selon des critères multicritères pondérés, et de faciliter la prise de décision stratégique."
  );

  addSubSection("Fonctionnalités principales");
  addBullet("Création et suivi de projets avec un code unique auto-généré (PNG-AAAA-NNN)");
  addBullet("Évaluation multicritères avec une notation de 0 à 4 sur chaque critère");
  addBullet("Système de pondération configurable avec des profils de pondération multiples");
  addBullet("Classement automatique des projets par score pondéré");
  addBullet("Tableau de bord avec des indicateurs visuels (graphiques, statistiques)");
  addBullet("Gestion des thèmes et des pôles/services");
  addBullet("Import/export de données (Excel, PDF)");
  addBullet("Système de rôles (Administrateur, Validateur, Contributeur, Lecteur)");
  addBullet("Journal d'audit complet pour tracer toutes les modifications");

  // ═══════════════════════════════════════════
  // 2. CONNEXION ET AUTHENTIFICATION
  // ═══════════════════════════════════════════
  addSectionTitle("2", "Connexion et authentification");

  addSubSection("Se connecter");
  addParagraph(
    "Accédez à l'application via l'URL fournie par votre administrateur. Saisissez votre adresse e-mail et votre mot de passe, puis cliquez sur « Se connecter ». Si vous n'avez pas encore de compte, contactez votre administrateur qui vous enverra une invitation par e-mail."
  );

  addSubSection("Modifier son mot de passe");
  addParagraph(
    "Cliquez sur votre adresse e-mail affichée en haut à droite de l'écran, puis sélectionnez « Modifier le mot de passe ». Le mot de passe doit comporter au minimum 8 caractères."
  );

  addSubSection("Se déconnecter");
  addParagraph(
    "Cliquez sur le bouton de déconnexion (icône de porte de sortie) en haut à droite de l'écran. Vous serez redirigé vers la page de connexion."
  );

  addSubSection("Les rôles utilisateur");
  addBullet("Administrateur : accès complet à toutes les fonctionnalités, paramétrage de l'application, gestion des utilisateurs");
  addBullet("Validateur : peut valider et archiver des projets, noter les critères");
  addBullet("Contributeur : peut créer, modifier des projets et saisir les scores");
  addBullet("Lecteur : accès en consultation uniquement (tableau de bord, projets, fiches)");

  // ═══════════════════════════════════════════
  // 3. TABLEAU DE BORD
  // ═══════════════════════════════════════════
  addSectionTitle("3", "Tableau de bord");

  addParagraph(
    "Le tableau de bord est la page d'accueil de l'application. Il offre une vue synthétique de l'ensemble des projets en cours et de leur état d'avancement."
  );

  addSubSection("Indicateurs affichés");
  addBullet("Nombre total de projets par statut (À valider, En cours, Archivé)");
  addBullet("Répartition budgétaire globale (budget total vs budget acquis)");
  addBullet("Répartition des projets par pôle/service");
  addBullet("Classement des projets par score pondéré");
  addBullet("Alertes sur les projets dont la date de fin est dépassée");

  // ═══════════════════════════════════════════
  // 4. GESTION DES PROJETS
  // ═══════════════════════════════════════════
  addSectionTitle("4", "Gestion des projets");

  addSubSection("Liste des projets");
  addParagraph(
    "La page « Projets » affiche la liste de tous les projets sous forme de tableau. Vous pouvez filtrer les projets par statut, par pôle/service, et effectuer une recherche textuelle sur le titre ou le code."
  );

  addSubSection("Créer un nouveau projet");
  addParagraph(
    "Cliquez sur « Nouveau projet » en haut à droite de la liste. Renseignez les champs obligatoires :"
  );
  addBullet("Titre du projet (3 à 200 caractères)");
  addBullet("Pôle/Service de rattachement");
  addParagraph(
    "Les champs optionnels incluent : description, famille de thème, thèmes associés, budget (total et acquis), sources de financement, partenaires, dates (prévisionnelle de début, de démarrage, de fin), avancement, faisabilité, liens externes et risques."
  );
  addParagraph(
    "Le code projet au format PNG-AAAA-NNN est généré automatiquement à la création. AAAA correspond à l'année en cours et NNN est un numéro incrémental."
  );

  addSubSection("Modifier un projet");
  addParagraph(
    "Ouvrez la fiche du projet en cliquant sur son titre dans la liste, puis cliquez sur le bouton « Modifier ». Tous les champs sont modifiables à l'exception du code projet."
  );

  addSubSection("Statuts d'un projet");
  addBullet("À valider : projet nouvellement créé, en attente de validation");
  addBullet("En cours : projet validé et actif");
  addBullet("Archivé : projet terminé ou abandonné");

  addSubSection("Fiche détaillée et impression");
  addParagraph(
    "Chaque projet dispose d'une fiche détaillée consultable en cliquant sur son titre. Cette fiche peut être exportée en PDF au format A4 portrait via le bouton « Imprimer / PDF » en haut de la fiche."
  );

  addSubSection("Commentaires");
  addParagraph(
    "La fiche projet dispose d'un espace commentaires en bas de page. Tout utilisateur authentifié peut ajouter un commentaire. Les commentaires sont datés et signés."
  );

  // ═══════════════════════════════════════════
  // 5. NOTATION ET ÉVALUATION
  // ═══════════════════════════════════════════
  addSectionTitle("5", "Notation et évaluation (PLANCHA)");

  addParagraph(
    "Le système de notation PLANCHA permet d'évaluer chaque projet sur plusieurs critères. Chaque critère est noté de 0 à 4 selon une échelle de notation prédéfinie."
  );

  addSubSection("Les critères d'évaluation");
  addParagraph(
    "Les critères sont définis par l'administrateur dans la section « Pondérations ». Chaque critère possède un code, un libellé, une description et une échelle de notation détaillée (de 0 à 4)."
  );

  addSubSection("Saisie des scores");
  addParagraph(
    "Dans la fiche d'un projet, accédez à l'onglet ou à la section « Évaluation PLANCHA ». Pour chaque critère, sélectionnez un score de 0 à 4. Vous pouvez consulter l'échelle de notation en cliquant sur l'icône d'information à côté du critère."
  );

  addSubSection("Calcul du score pondéré");
  addParagraph(
    "Le score total pondéré est calculé automatiquement en multipliant chaque score brut par le poids du critère correspondant dans le profil de pondération actif. Le classement des projets est ensuite mis à jour en conséquence."
  );

  // ═══════════════════════════════════════════
  // 6. PONDÉRATIONS
  // ═══════════════════════════════════════════
  addSectionTitle("6", "Pondérations");

  addParagraph(
    "La page « Pondérations » (accessible uniquement aux administrateurs) permet de configurer les profils de pondération et les critères d'évaluation."
  );

  addSubSection("Profils de pondération");
  addParagraph(
    "Un profil de pondération définit le poids (en pourcentage) de chaque critère dans le calcul du score final. Vous pouvez créer plusieurs profils mais un seul peut être actif à la fois. Le profil actif est utilisé pour le classement des projets."
  );

  addSubSection("Gestion des critères");
  addBullet("Ajouter, modifier ou supprimer des critères d'évaluation");
  addBullet("Définir l'échelle de notation pour chaque critère (description des niveaux 0 à 4)");
  addBullet("Réorganiser l'ordre d'affichage des critères");

  addSubSection("Ajuster les poids");
  addParagraph(
    "Pour chaque profil de pondération, attribuez un pourcentage à chaque critère. Le total des poids doit idéalement atteindre 100%. Les modifications prennent effet immédiatement sur le calcul des scores."
  );

  // ═══════════════════════════════════════════
  // 7. THÈMES
  // ═══════════════════════════════════════════
  addSectionTitle("7", "Thèmes");

  addParagraph(
    "La page « Thèmes » (accessible uniquement aux administrateurs) permet de gérer la liste des thèmes pouvant être associés aux projets."
  );

  addSubSection("Structure d'un thème");
  addBullet("Code : identifiant court du thème");
  addBullet("Libellé : nom complet du thème");
  addBullet("Famille : catégorie regroupant plusieurs thèmes (ex : Biodiversité, Numérique)");

  addSubSection("Association aux projets");
  addParagraph(
    "Lors de la création ou la modification d'un projet, vous pouvez associer un ou plusieurs thèmes au projet. Cela permet ensuite de filtrer et d'analyser les projets par thématique."
  );

  // ═══════════════════════════════════════════
  // 8. IMPORT / EXPORT
  // ═══════════════════════════════════════════
  addSectionTitle("8", "Import / Export de données");

  addSubSection("Import de projets (Excel)");
  addParagraph(
    "Depuis la page Paramètres > Importation de projets, vous pouvez importer un lot de projets à partir d'un fichier Excel. Commencez par télécharger le template fourni, remplissez-le, puis importez-le par glisser-déposer ou en cliquant sur « Sélectionner un fichier »."
  );
  addBullet("Les colonnes obligatoires sont : Titre du projet, Pôle/Service (code)");
  addBullet("Les colonnes optionnelles sont : Famille de thème, Description");
  addBullet("Le code projet est généré automatiquement à l'import");
  addBullet("Si des erreurs de formatage sont détectées, l'import est bloqué et les erreurs sont listées");

  addSubSection("Export de données (Excel)");
  addParagraph(
    "Depuis la page Paramètres > Export des données, vous pouvez exporter l'ensemble des projets, les scores et les pondérations au format Excel."
  );

  addSubSection("Impression PDF");
  addParagraph(
    "Chaque fiche projet peut être imprimée individuellement au format PDF. La liste des projets peut également être imprimée avec un récapitulatif global."
  );

  // ═══════════════════════════════════════════
  // 9. ADMINISTRATION
  // ═══════════════════════════════════════════
  addSectionTitle("9", "Administration");

  addSubSection("Gestion des utilisateurs");
  addParagraph(
    "L'administrateur peut inviter de nouveaux utilisateurs par e-mail depuis Paramètres > Gestion des utilisateurs. Il peut modifier le rôle d'un utilisateur ou supprimer un compte. La suppression du dernier administrateur est bloquée par sécurité."
  );

  addSubSection("Gestion des pôles/services");
  addParagraph(
    "Les pôles et services sont gérés directement depuis l'interface de saisie des projets. L'administrateur ou le contributeur peut ajouter de nouveaux pôles."
  );

  addSubSection("Paramètres de l'application");
  addBullet("Version de l'application et année de mise à jour (affichées dans « À propos »)");
  addBullet("Journal d'audit : consultation et purge des 50 dernières actions");
  addBullet("Connexion à un serveur de base de données externe");

  addSubSection("Journal d'audit");
  addParagraph(
    "Le journal d'audit enregistre toutes les opérations (création, modification, suppression) effectuées sur les projets, scores, thèmes, etc. Seuls les administrateurs peuvent le consulter et le vider."
  );

  // ═══════════════════════════════════════════
  // 10. FAQ ET AIDE
  // ═══════════════════════════════════════════
  addSectionTitle("10", "FAQ et Aide");

  addParagraph(
    "L'application dispose d'une page FAQ accessible depuis le menu « Aide > FAQ ». La FAQ est organisée par catégories et dispose d'une barre de recherche. L'administrateur peut gérer le contenu de la FAQ (ajouter, modifier, supprimer des questions) directement depuis l'interface."
  );

  addSubSection("Menu Aide");
  addBullet("Télécharger le mode d'emploi : télécharge le présent document au format PDF");
  addBullet("FAQ : accès à la foire aux questions interactive");
  addBullet("À propos de Plancha : informations sur la version et les crédits de l'application");

  // ═══════════════════════════════════════════
  // 11. ASTUCES ET BONNES PRATIQUES
  // ═══════════════════════════════════════════
  addSectionTitle("11", "Astuces et bonnes pratiques");

  addBullet("Utilisez des titres de projet clairs et descriptifs pour faciliter la recherche");
  addBullet("Renseignez systématiquement la famille de thème pour permettre un filtrage efficace");
  addBullet("Mettez à jour régulièrement l'avancement des projets pour un tableau de bord fiable");
  addBullet("Consultez les échelles de notation avant d'évaluer un projet pour assurer la cohérence");
  addBullet("Vérifiez que le total des poids dans un profil de pondération atteint 100%");
  addBullet("Utilisez l'import Excel pour charger un grand nombre de projets en une seule opération");
  addBullet("Exportez régulièrement les données pour des sauvegardes ou des analyses externes");
  addBullet("Consultez le journal d'audit en cas de doute sur une modification récente");
  addBullet("Pensez à archiver les projets terminés pour garder la liste des projets actifs épurée");

  // ── Footer sur chaque page ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...colors.lightGray);
    doc.text(
      `PLANCHA Projets – Mode d'emploi – Page ${i}/${totalPages}`,
      pageWidth / 2,
      290,
      { align: "center" }
    );
  }

  return doc.output("blob");
}
