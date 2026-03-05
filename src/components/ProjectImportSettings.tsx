import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ExcelJS from "exceljs";
import { supabase } from "@/integrations/supabase/client";
import { usePoles } from "@/hooks/usePoles";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ParsedProject {
  titre: string;
  pole_code: string;
  famille_theme?: string;
  description?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export function ProjectImportSettings() {
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: poles } = usePoles();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Titre du projet*": "Restauration écologique zone humide",
        "Pôle/Service (code)*": "DSI",
        "Famille de thème": "Biodiversité",
        "Description": "Description détaillée du projet",
      },
    ];

    const emptyRows = Array(19).fill({
      "Titre du projet*": "",
      "Pôle/Service (code)*": "",
      "Famille de thème": "",
      "Description": "",
    });

    const wb = new ExcelJS.Workbook();
    
    // Projects sheet
    const ws = wb.addWorksheet("Projets à importer");
    const projectHeaders = ["Titre du projet*", "Pôle/Service (code)*", "Famille de thème", "Description"];
    ws.addRow(projectHeaders);
    ws.getRow(1).font = { bold: true };
    allData.forEach(row => ws.addRow(Object.values(row)));
    ws.columns = [{ width: 40 }, { width: 20 }, { width: 25 }, { width: 50 }];

    // Instructions sheet
    const wsInstructions = wb.addWorksheet("Instructions");
    const instrHeaders = ["Colonne", "Description", "Valeurs possibles"];
    wsInstructions.addRow(instrHeaders);
    wsInstructions.getRow(1).font = { bold: true };
    instructionsData.forEach(row => wsInstructions.addRow(Object.values(row)));
    wsInstructions.columns = [{ width: 25 }, { width: 55 }, { width: 50 }];

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-import-projets-plancha.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const validateProjects = (projects: ParsedProject[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    const poleCodes = poles?.map(p => p.code.toUpperCase()) ?? [];

    projects.forEach((project, index) => {
      const row = index + 2; // Row 1 is header

      if (!project.titre || project.titre.trim().length < 3) {
        errors.push({ row, field: "Titre du projet", message: "Le titre est obligatoire (min 3 caractères)" });
      } else if (project.titre.trim().length > 200) {
        errors.push({ row, field: "Titre du projet", message: "Le titre est trop long (max 200 caractères)" });
      }

      if (!project.pole_code || project.pole_code.trim().length === 0) {
        errors.push({ row, field: "Pôle/Service (code)", message: "Le code pôle est obligatoire" });
      } else if (!poleCodes.includes(project.pole_code.trim().toUpperCase())) {
        errors.push({ row, field: "Pôle/Service (code)", message: `Code pôle "${project.pole_code}" inconnu. Codes valides : ${poleCodes.join(", ")}` });
      }

      if (project.description && project.description.length > 5000) {
        errors.push({ row, field: "Description", message: "La description est trop longue (max 5000 caractères)" });
      }
    });

    return errors;
  };

  const parseExcelFile = (file: File): Promise<ParsedProject[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const wb = new ExcelJS.Workbook();
          await wb.xlsx.load(buffer);

          const worksheet = wb.worksheets[0];
          if (!worksheet) {
            reject(new Error("Le fichier Excel ne contient aucun onglet."));
            return;
          }

          // Read header row
          const headerRow = worksheet.getRow(1);
          const headers: string[] = [];
          headerRow.eachCell((cell, colNumber) => {
            headers[colNumber] = cell.value?.toString() ?? "";
          });

          if (headers.length === 0) {
            reject(new Error("Le fichier Excel ne contient aucune donnée."));
            return;
          }

          const hasTitre = headers.some(h => h?.includes("Titre"));
          const hasPole = headers.some(h => h?.includes("Pôle") || h?.includes("Pole"));

          if (!hasTitre || !hasPole) {
            reject(new Error("Colonnes obligatoires manquantes. Utilisez le template fourni (Titre du projet*, Pôle/Service (code)*)."));
            return;
          }

          const titreCol = headers.findIndex(h => h?.includes("Titre"));
          const poleCol = headers.findIndex(h => h?.includes("Pôle") || h?.includes("Pole"));
          const familleCol = headers.findIndex(h => h && (h.toLowerCase().includes("famille") || h.toLowerCase().includes("thème") || h.toLowerCase().includes("theme")));
          const descCol = headers.findIndex(h => h?.toLowerCase().includes("description"));

          const projects: ParsedProject[] = [];
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // skip header
            const titre = row.getCell(titreCol)?.value?.toString().trim() ?? "";
            if (!titre || titre.length === 0) return;
            projects.push({
              titre,
              pole_code: row.getCell(poleCol)?.value?.toString().trim() ?? "",
              famille_theme: familleCol >= 0 ? row.getCell(familleCol)?.value?.toString().trim() : undefined,
              description: descCol >= 0 ? row.getCell(descCol)?.value?.toString().trim() : undefined,
            });
          });

          if (projects.length === 0) {
            reject(new Error("Aucun projet valide trouvé dans le fichier."));
            return;
          }

          resolve(projects);
        } catch {
          reject(new Error("Impossible de lire le fichier Excel. Vérifiez le format du fichier."));
        }
      };
      reader.onerror = () => reject(new Error("Erreur lors de la lecture du fichier."));
      reader.readAsArrayBuffer(file);
    });
  };

  const generateProjectCodes = async (count: number): Promise<string[]> => {
    const currentYear = new Date().getFullYear();
    const yearPrefix = `PNG-${currentYear}-`;

    const { data: projects } = await supabase
      .from("projects")
      .select("code")
      .like("code", `${yearPrefix}%`)
      .order("code", { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (projects && projects.length > 0) {
      const lastNumber = parseInt(projects[0].code.split("-")[2] || "0");
      nextNumber = lastNumber + 1;
    }

    return Array.from({ length: count }, (_, i) =>
      `${yearPrefix}${(nextNumber + i).toString().padStart(3, "0")}`
    );
  };

  const handleImport = async (file: File) => {
    setIsImporting(true);
    setValidationErrors([]);
    setImportSuccess(null);

    try {
      const projects = await parseExcelFile(file);
      const errors = validateProjects(projects);

      if (errors.length > 0) {
        setValidationErrors(errors);
        toast({
          variant: "destructive",
          title: "Erreurs de validation",
          description: `${errors.length} erreur(s) détectée(s). Corrigez le fichier et réessayez.`,
        });
        setIsImporting(false);
        return;
      }

      // Generate codes and resolve pole IDs
      const codes = await generateProjectCodes(projects.length);
      const projectsToInsert = projects.map((p, i) => {
        const pole = poles?.find(pole => pole.code.toUpperCase() === p.pole_code.toUpperCase());
        return {
          code: codes[i],
          titre: p.titre.trim(),
          pole_id: pole!.id,
          famille_theme: p.famille_theme || null,
          description: p.description || null,
        };
      });

      const { error } = await supabase.from("projects").insert(projectsToInsert);

      if (error) throw error;

      setImportSuccess(projects.length);
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      toast({
        title: "Importation réussie",
        description: `${projects.length} projet(s) importé(s) avec succès.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur d'importation",
        description: error.message || "Une erreur est survenue lors de l'importation.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileSelect = (file: File) => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast({
        variant: "destructive",
        title: "Format non supporté",
        description: "Veuillez sélectionner un fichier Excel (.xlsx ou .xls).",
      });
      return;
    }
    setSelectedFile(file);
    setValidationErrors([]);
    setImportSuccess(null);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

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
          <Button onClick={handleDownloadTemplate} variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Télécharger le template Excel
          </Button>
        </div>

        {/* Import section */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`rounded-lg p-4 space-y-3 border-2 border-dashed transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 bg-muted/30"
          }`}
        >
          <div className="flex items-start gap-3">
            <Upload className={`h-8 w-8 mt-0.5 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
            <div className="flex-1">
              <h4 className="font-medium">2. Importez votre fichier</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Glissez-déposez votre fichier Excel ici, ou cliquez sur le bouton pour le sélectionner.
              </p>
            </div>
          </div>

          {selectedFile ? (
            <div className="flex items-center gap-2 bg-background rounded-md p-2 border">
              <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm truncate flex-1">{selectedFile.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => { setSelectedFile(null); setValidationErrors([]); setImportSuccess(null); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : null}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
                e.target.value = "";
              }}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full sm:w-auto"
            >
              <Upload className="mr-2 h-4 w-4" />
              Sélectionner un fichier
            </Button>
            {selectedFile && (
              <Button
                onClick={() => handleImport(selectedFile)}
                disabled={isImporting}
                className="w-full sm:w-auto"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importation...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Importer les projets
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Erreurs de validation ({validationErrors.length}) :</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside text-sm">
                {validationErrors.map((err, i) => (
                  <li key={i}>
                    Ligne {err.row}, <em>{err.field}</em> : {err.message}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Success */}
        {importSuccess !== null && (
          <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              <strong>{importSuccess} projet(s)</strong> importé(s) avec succès. Les codes projet ont été générés automatiquement.
            </AlertDescription>
          </Alert>
        )}

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
