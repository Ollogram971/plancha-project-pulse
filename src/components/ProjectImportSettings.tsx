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
        "Titre du projet*": "Restauration écologique zone humide",
        "Pôle/Service (code)*": "DSI",
        "Famille de thème": "Biodiversité",
        "Description": "Description détaillée du projet",
      },
    ];

    // Create empty rows for user to fill
    const emptyRows = Array(19).fill({
      "Titre du projet*": "",
      "Pôle/Service (code)*": "",
      "Famille de thème": "",
      "Description": "",
    });

    const allData = [...templateData, ...emptyRows];

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(allData);

    // Set column widths
    ws["!cols"] = [
      { wch: 40 }, // Titre
      { wch: 20 }, // Pôle
      { wch: 25 }, // Famille de thème
      { wch: 50 }, // Description
    ];

    // Create instructions sheet
    const instructionsData = [
      { "Colonne": "Titre du projet*", "Description": "Titre du projet (obligatoire)", "Valeurs possibles": "Texte libre (min 3, max 200 caractères)" },
      { "Colonne": "Pôle/Service (code)*", "Description": "Code du pôle/service (obligatoire)", "Valeurs possibles": "Code existant dans l'application (ex: DSI, DRH)" },
      { "Colonne": "Famille de thème", "Description": "Famille thématique du projet", "Valeurs possibles": "Texte libre (ex: Biodiversité, Numérique)" },
      { "Colonne": "Description", "Description": "Description détaillée du projet", "Valeurs possibles": "Texte libre (max 5000 caractères)" },
      { "Colonne": "", "Description": "", "Valeurs possibles": "" },
      { "Colonne": "Note", "Description": "Le code projet (PNG-AAAA-NNN) sera généré automatiquement lors de l'importation.", "Valeurs possibles": "" },
    ];

    const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
    wsInstructions["!cols"] = [
      { wch: 25 },
      { wch: 55 },
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
            Le code projet sera généré automatiquement à l'import.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
