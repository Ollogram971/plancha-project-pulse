import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function usePoles() {
  return useQuery({
    queryKey: ["poles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("poles")
        .select("*")
        .order("libelle");

      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (poleData: { code: string; libelle: string }) => {
      const { data, error } = await supabase
        .from("poles")
        .insert([poleData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["poles"] });
      toast({
        title: "Pôle créé",
        description: "Le nouveau pôle a été ajouté avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de créer le pôle",
      });
    },
  });
}
