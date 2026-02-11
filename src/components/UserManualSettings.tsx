import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Upload, Download, FileText, CheckCircle2, Loader2, X, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { generateUserManualPdf } from "@/utils/generateUserManual";

const MANUAL_BUCKET = "user-manual";
const MANUAL_FILE = "mode-emploi-plancha.pdf";

export function UserManualSettings() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if a custom manual exists in storage
  const { data: manualInfo } = useQuery({
    queryKey: ["user-manual-info"],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(MANUAL_BUCKET)
        .list("", { limit: 1, search: MANUAL_FILE });

      if (error) throw error;
      const file = data?.find((f) => f.name === MANUAL_FILE);
      return file || null;
    },
  });

  const handleUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Format non supporté",
        description: "Veuillez sélectionner un fichier PDF.",
      });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Fichier trop volumineux",
        description: "La taille maximale est de 20 Mo.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const { error } = await supabase.storage
        .from(MANUAL_BUCKET)
        .upload(MANUAL_FILE, file, { upsert: true, contentType: "application/pdf" });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["user-manual-info"] });
      toast({
        title: "Mode d'emploi mis à jour",
        description: "Le nouveau fichier PDF a été téléversé avec succès.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur de téléversement",
        description: error.message || "Une erreur est survenue.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateDefault = async () => {
    setIsGenerating(true);
    try {
      const blob = generateUserManualPdf();
      const file = new File([blob], MANUAL_FILE, { type: "application/pdf" });

      const { error } = await supabase.storage
        .from(MANUAL_BUCKET)
        .upload(MANUAL_FILE, file, { upsert: true, contentType: "application/pdf" });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["user-manual-info"] });
      toast({
        title: "Mode d'emploi généré",
        description: "Le mode d'emploi par défaut a été généré et publié.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la génération.",
      });
    } finally {
      setIsGenerating(false);
    }
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
    if (file) handleUpload(file);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <CardTitle>Mode d'emploi</CardTitle>
        </div>
        <CardDescription>
          Gérez le fichier PDF du mode d'emploi téléchargeable par les utilisateurs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        {manualInfo ? (
          <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              Un mode d'emploi est actuellement disponible au téléchargement.
              {manualInfo.updated_at && (
                <span className="block text-xs mt-1">
                  Dernière mise à jour : {new Date(manualInfo.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Aucun mode d'emploi n'est encore publié. Générez le mode d'emploi par défaut ou téléversez votre propre fichier PDF.
            </AlertDescription>
          </Alert>
        )}

        {/* Generate default manual */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <RefreshCw className="h-6 w-6 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-sm">Générer le mode d'emploi par défaut</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Génère automatiquement un PDF complet à partir du contenu intégré à l'application.
              </p>
            </div>
          </div>
          <Button onClick={handleGenerateDefault} variant="outline" disabled={isGenerating} className="w-full sm:w-auto">
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {manualInfo ? "Regénérer le mode d'emploi" : "Générer le mode d'emploi"}
              </>
            )}
          </Button>
        </div>

        {/* Upload custom manual */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`rounded-lg p-4 space-y-3 border-2 border-dashed transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 bg-muted/30"
          }`}
        >
          <div className="flex items-start gap-3">
            <Upload className={`h-6 w-6 mt-0.5 shrink-0 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
            <div className="flex-1">
              <h4 className="font-medium text-sm">Remplacer par un fichier personnalisé</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Glissez-déposez un fichier PDF ici, ou cliquez sur le bouton pour le sélectionner.
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Téléversement...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Sélectionner un fichier PDF
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
