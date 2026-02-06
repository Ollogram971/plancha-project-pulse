import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as XLSX from "xlsx";

export function ProjectImportSettings() {
  const handleDownloadTemplate = () => {
    // Create template data with example row
    const templateData = [
      {
        "Code*": "PROJ-001",
        "Titre*": "Exemple de projet",
        "Pôle (code)*": "DSI",
        "Description": "Description détaillée du projet",
        "Statut": "a_valider",
        "Chef de projet (email)": "jean.dupont@example.com",
        "Budget total (€)": 50000,
        "Budget acquis (€)": 25000,
        "Financement": "partiel",
        "Date début prévisionnelle": "2025-03-01",
        "Date démarrage": "",
        "Date fin": "2025-12-31",
        "Avancement (%)": 0,
        "Faisabilité": "bon",
        "Famille thématique": "Numérique",
        "Partenaires (séparés par ;)": "Partenaire A; Partenaire B",
        "Sources financement (séparées par ;)": "Région; Europe",
        "Risques": "Risques potentiels identifiés",
        "Liens (séparés par ;)": "https://example.com",
        "ID EVA": "",
      },
    ];

    // Create empty rows for user to fill
    const emptyRows = Array(19).fill({
      "Code*": "",
      "Titre*": "",
      "Pôle (code)*": "",
      "Description": "",
      "Statut": "",
      "Chef de projet (email)": "",
      "Budget total (€)": "",
      "Budget acquis (€)": "",
      "Financement": "",
      "Date début prévisionnelle": "",
      "Date démarrage": "",
      "Date fin": "",
      "Avancement (%)": "",
      "Faisabilité": "",
      "Famille thématique": "",
      "Partenaires (séparés par ;)": "",
      "Sources financement (séparées par ;)": "",
      "Risques": "",
      "Liens (séparés par ;)": "",
      "ID EVA": "",
    });

    const allData = [...templateData, ...emptyRows];

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(allData);

    // Set column widths
    ws["!cols"] = [
      { wch: 12 }, // Code
      { wch: 35 }, // Titre
      { wch: 15 }, // Pôle
      { wch: 40 }, // Description
      { wch: 12 }, // Statut
      { wch: 28 }, // Chef de projet
      { wch: 15 }, // Budget total
      { wch: 15 }, // Budget acquis
      { wch: 14 }, // Financement
      { wch: 20 }, // Date début prév
      { wch: 15 }, // Date démarrage
      { wch: 12 }, // Date fin
      { wch: 14 }, // Avancement
      { wch: 12 }, // Faisabilité
      { wch: 18 }, // Famille
      { wch: 30 }, // Partenaires
      { wch: 30 }, // Sources financement
      { wch: 35 }, // Risques
      { wch: 25 }, // Liens
      { wch: 12 }, // ID EVA
    ];

    // Create instructions sheet
    const instructionsData = [
      { "Colonne": "Code*", "Description": "Code unique du projet (obligatoire)", "Valeurs possibles": "Texte libre (ex: PROJ-001)" },
      { "Colonne": "Titre*", "Description": "Titre du projet (obligatoire)", "Valeurs possibles": "Texte libre" },
      { "Colonne": "Pôle (code)*", "Description": "Code du pôle/service (obligatoire)", "Valeurs possibles": "Code existant dans l'application (ex: DSI, DRH)" },
      { "Colonne": "Description", "Description": "Description détaillée du projet", "Valeurs possibles": "Texte libre" },
      { "Colonne": "Statut", "Description": "Statut du projet", "Valeurs possibles": "a_valider | en_cours | archive" },
      { "Colonne": "Chef de projet (email)", "Description": "Email du chef de projet", "Valeurs possibles": "Email d'un utilisateur existant" },
      { "Colonne": "Budget total (€)", "Description": "Budget total en euros", "Valeurs possibles": "Nombre (ex: 50000)" },
      { "Colonne": "Budget acquis (€)", "Description": "Budget déjà acquis en euros", "Valeurs possibles": "Nombre (ex: 25000)" },
      { "Colonne": "Financement", "Description": "Statut du financement", "Valeurs possibles": "aucun | recherche_financement | partiel | complet" },
      { "Colonne": "Date début prévisionnelle", "Description": "Date de début prévue", "Valeurs possibles": "Format AAAA-MM-JJ (ex: 2025-03-01)" },
      { "Colonne": "Date démarrage", "Description": "Date de démarrage effectif", "Valeurs possibles": "Format AAAA-MM-JJ" },
      { "Colonne": "Date fin", "Description": "Date de fin prévue", "Valeurs possibles": "Format AAAA-MM-JJ" },
      { "Colonne": "Avancement (%)", "Description": "Pourcentage d'avancement", "Valeurs possibles": "Nombre entre 0 et 100" },
      { "Colonne": "Faisabilité", "Description": "Niveau de faisabilité", "Valeurs possibles": "bloquant | mitige | bon | optimal" },
      { "Colonne": "Famille thématique", "Description": "Famille thématique du projet", "Valeurs possibles": "Texte libre" },
      { "Colonne": "Partenaires", "Description": "Liste des partenaires", "Valeurs possibles": "Séparés par point-virgule (;)" },
      { "Colonne": "Sources financement", "Description": "Sources de financement", "Valeurs possibles": "Séparées par point-virgule (;)" },
      { "Colonne": "Risques", "Description": "Risques identifiés", "Valeurs possibles": "Texte libre" },
      { "Colonne": "Liens", "Description": "Liens utiles", "Valeurs possibles": "Séparés par point-virgule (;)" },
      { "Colonne": "ID EVA", "Description": "Identifiant EVA externe", "Valeurs possibles": "Texte libre" },
    ];

    const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
    wsInstructions["!cols"] = [
      { wch: 28 },
      { wch: 40 },
      { wch: 50 },
    ];

    // Create workbook with both sheets
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Projets à importer");
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

    // Download file
    XLSX.writeFile(wb, "template-import-projets-plancha.xlsx");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          <CardTitle>Importation de projets</CardTitle>
        </div>
        <CardDescription>
          Importez des lots de projets via un fichier Excel correctement formaté
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template download section */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="h-8 w-8 text-primary mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium">1. Téléchargez le template</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Utilisez ce fichier Excel pré-formaté pour préparer vos projets à importer. 
                Le fichier contient deux onglets : un pour saisir les projets et un avec les instructions détaillées.
              </p>
            </div>
          </div>
          <Button 
            onClick={handleDownloadTemplate}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Télécharger le template Excel
          </Button>
        </div>

        {/* Import section - placeholder for now */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-3 border-2 border-dashed">
          <div className="flex items-start gap-3">
            <Upload className="h-8 w-8 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-muted-foreground">2. Importez votre fichier</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Une fois le template rempli, vous pourrez l'importer ici pour créer les projets en masse.
              </p>
            </div>
          </div>
          <Button 
            variant="secondary"
            disabled
            className="w-full sm:w-auto"
          >
            <Upload className="mr-2 h-4 w-4" />
            Importer un fichier (bientôt disponible)
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important :</strong> Les colonnes marquées d'un astérisque (*) sont obligatoires. 
            Assurez-vous que les codes de pôles correspondent à ceux existants dans l'application.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
