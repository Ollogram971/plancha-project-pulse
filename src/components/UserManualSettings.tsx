import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Upload, Download, FileText, CheckCircle2, Loader2, X, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateDefaultManualPdf } from "@/utils/generateDefaultManual";

const BUCKET = "user-manual";
const FILE_NAME = "mode-emploi-plancha.pdf";

export function UserManualSettings() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentFile, setCurrentFile] = useState<{ name: string; size: number; updatedAt: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Check if a manual already exists in storage
  const fetchCurrentFile = useCallback(async () => {
    const { data, error } = await supabase.storage.from(BUCKET).list("", { limit: 1, search: FILE_NAME });
    if (!error && data && data.length > 0) {
      const file = data[0];
      setCurrentFile({
        name: file.name,
        size: file.metadata?.size || 0,
        updatedAt: file.updated_at || file.created_at || "",
      });
    } else {
      setCurrentFile(null);
    }
  }, []);

  useEffect(() => {
    fetchCurrentFile();
  }, [fetchCurrentFile]);

  const uploadFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({ title: "Format invalide", description: "Seuls les fichiers PDF sont acceptés.", variant: "destructive" });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "La taille maximum est de 20 Mo.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const { error } = await supabase.storage.from(BUCKET).upload(FILE_NAME, file, { upsert: true, contentType: "application/pdf" });
      if (error) throw error;
      toast({ title: "Mode d'emploi mis à jour", description: "Le fichier a été remplacé avec succès." });
      await fetchCurrentFile();
    } catch (err: any) {
      toast({ title: "Erreur d'upload", description: err.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateDefault = async () => {
    setIsGenerating(true);
    try {
      const blob = generateDefaultManualPdf();
      const file = new File([blob], FILE_NAME, { type: "application/pdf" });
      await uploadFile(file);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "—";
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <CardTitle>Mode d'emploi</CardTitle>
        </div>
        <CardDescription>
          Gérez le fichier PDF du mode d'emploi téléchargeable par les utilisateurs depuis le menu Aide
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current file info */}
        {currentFile ? (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Fichier actuel : <strong>{currentFile.name}</strong>{" "}
                ({formatSize(currentFile.size)})
                {currentFile.updatedAt && (
                  <span className="text-muted-foreground ml-2">
                    — mis à jour le {new Date(currentFile.updatedAt).toLocaleDateString("fr-FR")}
                  </span>
                )}
              </span>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <AlertDescription className="text-muted-foreground">
              Aucun mode d'emploi n'a encore été déposé. Générez le mode d'emploi par défaut ou déposez votre propre fichier PDF.
            </AlertDescription>
          </Alert>
        )}

        {/* Generate default button */}
        <Button
          variant="outline"
          onClick={handleGenerateDefault}
          disabled={isGenerating || isUploading}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {isGenerating ? "Génération en cours…" : "Générer le mode d'emploi par défaut"}
        </Button>

        {/* Drag & Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Téléversement en cours…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">Glissez-déposez un fichier PDF ici</p>
              <p className="text-xs text-muted-foreground">ou cliquez pour sélectionner un fichier (max. 20 Mo)</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
