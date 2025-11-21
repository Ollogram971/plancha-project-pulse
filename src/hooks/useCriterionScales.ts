import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useCriterionScales(criterionId: string | undefined) {
  return useQuery({
    queryKey: ["criterion-scales", criterionId],
    queryFn: async () => {
      if (!criterionId) return [];
      
      const { data, error } = await supabase
        .from("criterion_scales")
        .select("*")
        .eq("criterion_id", criterionId)
        .order("score_value");

      if (error) throw error;
      return data;
    },
    enabled: !!criterionId,
  });
}

export function useUpdateCriterionScale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      description,
    }: {
      id: string;
      description: string;
    }) => {
      const { data, error } = await supabase
        .from("criterion_scales")
        .update({ description })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["criterion-scales"] });
      toast({
        title: "Échelle mise à jour",
        description: "La description a été modifiée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour l'échelle",
      });
    },
  });
}

export function useCreateCriterionScales() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      criterionId,
      scales,
      silent = false,
    }: {
      criterionId: string;
      scales: Array<{ score_value: number; description: string }>;
      silent?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("criterion_scales")
        .insert(
          scales.map((scale) => ({
            criterion_id: criterionId,
            ...scale,
          }))
        )
        .select();

      if (error) throw error;
      return { data, silent };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["criterion-scales"] });
      if (!result.silent) {
        toast({
          title: "Échelles créées",
          description: "Les échelles d'évaluation ont été créées avec succès",
        });
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de créer les échelles",
      });
    },
  });
}
