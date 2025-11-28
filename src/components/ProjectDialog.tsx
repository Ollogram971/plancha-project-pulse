import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useCreateProject } from "@/hooks/useProjects";
import { usePoles } from "@/hooks/usePoles";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { PoleDialog } from "./PoleDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const projectSchema = z.object({
  code: z.string()
    .trim()
    .min(1, "Code requis")
    .max(50, "Code trop long (max 50 caractères)")
    .regex(/^PNG-\d{4}-\d{3}$/, "Format attendu: PNG-YYYY-NNN (ex: PNG-2025-001)"),
  titre: z.string()
    .trim()
    .min(3, "Titre trop court (min 3 caractères)")
    .max(200, "Titre trop long (max 200 caractères)"),
  description: z.string()
    .trim()
    .max(5000, "Description trop longue (max 5000 caractères)")
    .optional()
    .or(z.literal("")),
  pole_id: z.string().uuid("Pôle/Service invalide"),
  famille_theme: z.string().optional()
});

export function ProjectDialog() {
  const [open, setOpen] = useState(false);
  const [poleDialogOpen, setPoleDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    titre: "",
    description: "",
    pole_id: "",
    famille_theme: "",
  });

  const createProject = useCreateProject();
  const { data: poles } = usePoles();
  const { toast } = useToast();

  // Fetch theme families
  const { data: themeFamilies } = useQuery({
    queryKey: ["theme-families"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("themes")
        .select("famille")
        .not("famille", "is", null)
        .order("famille");
      if (error) throw error;
      
      // Get unique families
      const uniqueFamilies = Array.from(new Set(data.map(t => t.famille)));
      return uniqueFamilies;
    },
  });

  // Generate next project code when dialog opens
  useEffect(() => {
    if (open) {
      generateNextProjectCode();
    }
  }, [open]);

  const generateNextProjectCode = async () => {
    const currentYear = new Date().getFullYear();
    const yearPrefix = `PNG-${currentYear}-`;

    // Fetch projects for current year
    const { data: projects, error } = await supabase
      .from("projects")
      .select("code")
      .like("code", `${yearPrefix}%`)
      .order("code", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching projects:", error);
      setFormData(prev => ({ ...prev, code: `${yearPrefix}001` }));
      return;
    }

    let nextNumber = 1;
    if (projects && projects.length > 0) {
      const lastCode = projects[0].code;
      const lastNumber = parseInt(lastCode.split("-")[2] || "0");
      nextNumber = lastNumber + 1;
    }

    const nextCode = `${yearPrefix}${nextNumber.toString().padStart(3, "0")}`;
    setFormData(prev => ({ ...prev, code: nextCode }));
  };

  const handlePoleCreated = (poleId: string) => {
    setFormData({ ...formData, pole_id: poleId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = projectSchema.parse(formData);
      
      // Check if project code already exists
      const { data: existingProject } = await supabase
        .from("projects")
        .select("id")
        .eq("code", validated.code)
        .maybeSingle();

      if (existingProject) {
        toast({
          variant: "destructive",
          title: "Code projet déjà utilisé",
          description: `Le code "${validated.code}" existe déjà. Veuillez choisir un autre code.`,
        });
        return;
      }

      await createProject.mutateAsync(validated);
      setOpen(false);
      setFormData({ code: "", titre: "", description: "", pole_id: "", famille_theme: "" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast({
          variant: "destructive",
          title: "Validation échouée",
          description: firstError.message,
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau projet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer un nouveau projet</DialogTitle>
          <DialogDescription>
            Remplissez les informations de base du projet
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Code projet *</Label>
              <Input
                id="code"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="PNG-2025-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pole">Pôle/Service *</Label>
              <div className="flex gap-2">
                <Select
                  required
                  value={formData.pole_id}
                  onValueChange={(value) => setFormData({ ...formData, pole_id: value })}
                >
                  <SelectTrigger id="pole" className="flex-1">
                    <SelectValue placeholder="Sélectionner un Pôle/Service" />
                  </SelectTrigger>
                  <SelectContent>
                    {poles?.map((pole) => (
                      <SelectItem key={pole.id} value={pole.id}>
                        {pole.libelle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPoleDialogOpen(true)}
                  title="Créer un nouveau Pôle/Service"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="titre">Titre du projet *</Label>
            <Input
              id="titre"
              required
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              placeholder="Restauration écologique zone humide"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="famille_theme">Famille de thème</Label>
            <Select
              value={formData.famille_theme}
              onValueChange={(value) => setFormData({ ...formData, famille_theme: value })}
            >
              <SelectTrigger id="famille_theme">
                <SelectValue placeholder="Sélectionner une famille" />
              </SelectTrigger>
              <SelectContent>
                {themeFamilies?.map((famille) => (
                  <SelectItem key={famille} value={famille}>
                    {famille}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description détaillée du projet..."
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? "Création..." : "Créer le projet"}
            </Button>
          </div>
        </form>
      </DialogContent>
      <PoleDialog 
        open={poleDialogOpen} 
        onOpenChange={setPoleDialogOpen}
        onPoleCreated={handlePoleCreated}
      />
    </Dialog>
  );
}
