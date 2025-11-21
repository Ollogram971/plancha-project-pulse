import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useProjectScores(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-scores", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("scores_raw")
        .select(`
          *,
          criteria:criterion_id (
            id,
            code,
            libelle,
            ordre
          )
        `)
        .eq("project_id", projectId);

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useUpsertScore() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      projectId,
      criterionId,
      score,
      commentaire = null,
    }: {
      projectId: string;
      criterionId: string;
      score: number;
      commentaire?: string | null;
    }) => {
      // Check if score exists
      const { data: existing } = await supabase
        .from("scores_raw")
        .select("id")
        .eq("project_id", projectId)
        .eq("criterion_id", criterionId)
        .maybeSingle();

      if (existing) {
        // Update existing score
        const { data, error } = await supabase
          .from("scores_raw")
          .update({
            score_0_4: score,
            commentaire,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new score
        const { data, error } = await supabase
          .from("scores_raw")
          .insert({
            project_id: projectId,
            criterion_id: criterionId,
            score_0_4: score,
            commentaire,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-scores"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer le score",
      });
    },
  });
}
