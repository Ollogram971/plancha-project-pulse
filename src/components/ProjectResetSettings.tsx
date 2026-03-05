import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const CONFIRMATION_WORD = "SUPPRIMER";

export function ProjectResetSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmText, setConfirmText] = useState("");
  const [open, setOpen] = useState(false);

  const resetMutation = useMutation({
    mutationFn: async () => {
      // Delete in order: children first, then parents
      // 1. scores_calculated (references projects)
      const { error: e1 } = await supabase
        .from("scores_calculated")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (e1) throw new Error("Erreur suppression scores calculés: " + e1.message);

      // 2. scores_raw (references projects + criteria)
      const { error: e2 } = await supabase
        .from("scores_raw")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (e2) throw new Error("Erreur suppression scores bruts: " + e2.message);

      // 3. comments (references projects)
      const { error: e3 } = await supabase
        .from("comments")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (e3) throw new Error("Erreur suppression commentaires: " + e3.message);

      // 4. attachments (references projects)
      const { error: e4 } = await supabase
        .from("attachments")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (e4) throw new Error("Erreur suppression pièces jointes: " + e4.message);

      // 5. project_themes (references projects + themes)
      const { error: e5 } = await supabase
        .from("project_themes")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (e5) throw new Error("Erreur suppression thèmes de projets: " + e5.message);

      // 6. audit_log entries related to projects
      const { error: e6 } = await supabase
        .from("audit_log")
        .delete()
        .eq("entite", "projects");
      if (e6) throw new Error("Erreur suppression audit projets: " + e6.message);

      // Also delete score-related audit entries
      const { error: e6b } = await supabase
        .from("audit_log")
        .delete()
        .eq("entite", "scores_raw");
      if (e6b) throw new Error("Erreur suppression audit scores: " + e6b.message);

      // 7. Finally delete all projects
      const { error: e7 } = await supabase
        .from("projects")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (e7) throw new Error("Erreur suppression projets: " + e7.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-scores"] });
      queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
      toast({
        title: "Réinitialisation effectuée",
        description: "Tous les projets et leurs données associées ont été supprimés.",
      });
      setOpen(false);
      setConfirmText("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    },
  });

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) setConfirmText("");
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">Réinitialisation des projets</CardTitle>
        </div>
        <CardDescription>
          Supprimer définitivement tous les projets et leurs données associées (scores, commentaires, pièces jointes, thèmes liés)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Cette action supprimera <strong>tous les projets</strong> ainsi que toutes les données liées :
            scores bruts, scores calculés, commentaires, pièces jointes et associations de thèmes.
            Les tables de référence (critères, pôles, thèmes, pondérations) ne seront pas affectées.
          </p>
          <AlertDialog open={open} onOpenChange={handleOpenChange}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Réinitialiser tous les projets
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Confirmation de réinitialisation
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <span className="block">
                    Cette action est <strong className="text-destructive">irréversible</strong>. Tous les projets et leurs données associées seront définitivement supprimés.
                  </span>
                  <span className="block font-medium">
                    Données supprimées : projets, scores bruts, scores calculés, commentaires, pièces jointes, thèmes de projets et entrées d'audit associées.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2 py-2">
                <Label htmlFor="confirm-reset">
                  Tapez <strong className="text-destructive">{CONFIRMATION_WORD}</strong> pour confirmer
                </Label>
                <Input
                  id="confirm-reset"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={CONFIRMATION_WORD}
                  autoComplete="off"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => resetMutation.mutate()}
                  disabled={confirmText !== CONFIRMATION_WORD || resetMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {resetMutation.isPending ? "Suppression en cours..." : "Confirmer la suppression"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
