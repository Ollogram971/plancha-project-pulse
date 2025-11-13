import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateProject } from "@/hooks/useProjects";
import { usePoles } from "@/hooks/usePoles";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const projectUpdateSchema = z.object({
  titre: z.string()
    .trim()
    .min(3, "Titre trop court (min 3 caractères)")
    .max(200, "Titre trop long (max 200 caractères)"),
  description: z.string()
    .trim()
    .max(5000, "Description trop longue (max 5000 caractères)")
    .optional()
    .or(z.literal("")),
  pole_id: z.string().uuid("Pôle invalide"),
  statut: z.enum(['brouillon', 'a_valider', 'valide', 'en_cours', 'archive']),
  budget_total: z.string().optional(),
  budget_acquis: z.string().optional(),
  financement_statut: z.enum(['aucun', 'recherche_financement', 'partiel', 'complet']).optional(),
  avancement: z.string().optional(),
  risques: z.string().trim().max(2000, "Risques trop long (max 2000 caractères)").optional().or(z.literal("")),
  date_demarrage: z.string().optional(),
}).refine((data) => {
  if (data.statut === 'en_cours' && !data.date_demarrage) {
    return false;
  }
  return true;
}, {
  message: "La date de démarrage est obligatoire pour les projets en cours",
  path: ["date_demarrage"],
}).refine((data) => {
  const budgetTotal = data.budget_total ? parseFloat(data.budget_total) : null;
  const budgetAcquis = data.budget_acquis ? parseFloat(data.budget_acquis) : null;
  
  if (budgetTotal !== null && budgetAcquis !== null && budgetAcquis > budgetTotal) {
    return false;
  }
  return true;
}, {
  message: "Le budget acquis ne peut pas être supérieur au budget total",
  path: ["budget_acquis"],
});

type ProjectStatus = 'brouillon' | 'a_valider' | 'valide' | 'en_cours' | 'archive';
type FinancingStatus = 'aucun' | 'recherche_financement' | 'partiel' | 'complet';

interface ProjectEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
}

export function ProjectEditDialog({ open, onOpenChange, project }: ProjectEditDialogProps) {
  const [formData, setFormData] = useState<{
    titre: string;
    description: string;
    pole_id: string;
    statut: ProjectStatus;
    budget_total: string;
    budget_acquis: string;
    financement_statut: FinancingStatus;
    avancement: string;
    risques: string;
    date_demarrage: string;
  }>({
    titre: "",
    description: "",
    pole_id: "",
    statut: "brouillon",
    budget_total: "",
    budget_acquis: "",
    financement_statut: "aucun",
    avancement: "",
    risques: "",
    date_demarrage: "",
  });

  const updateProject = useUpdateProject();
  const { data: poles } = usePoles();
  const { toast } = useToast();

  useEffect(() => {
    if (project) {
      setFormData({
        titre: project.titre || "",
        description: project.description || "",
        pole_id: project.pole_id || "",
        statut: project.statut || "brouillon",
        budget_total: project.budget_total?.toString() || "",
        budget_acquis: project.budget_acquis?.toString() || "",
        financement_statut: project.financement_statut || "aucun",
        avancement: project.avancement?.toString() || "",
        risques: project.risques || "",
        date_demarrage: project.date_demarrage || "",
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = projectUpdateSchema.parse(formData);
      const updateData = {
        ...validated,
        budget_total: validated.budget_total ? parseFloat(validated.budget_total) : null,
        budget_acquis: validated.budget_acquis ? parseFloat(validated.budget_acquis) : null,
        avancement: validated.avancement ? parseInt(validated.avancement) : null,
        date_demarrage: validated.date_demarrage || null,
      };
      
      await updateProject.mutateAsync({ id: project.id, data: updateData });
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le projet</DialogTitle>
          <DialogDescription>
            Code: {project?.code}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titre">Titre du projet *</Label>
            <Input
              id="titre"
              required
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pole">Pôle *</Label>
              <Select
                required
                value={formData.pole_id}
                onValueChange={(value) => setFormData({ ...formData, pole_id: value })}
              >
                <SelectTrigger id="pole">
                  <SelectValue placeholder="Sélectionner un pôle" />
                </SelectTrigger>
                <SelectContent>
                  {poles?.map((pole) => (
                    <SelectItem key={pole.id} value={pole.id}>
                      {pole.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statut">Statut *</Label>
              <Select
                required
                value={formData.statut}
                onValueChange={(value: any) => setFormData({ ...formData, statut: value })}
              >
                <SelectTrigger id="statut">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="a_valider">À valider</SelectItem>
                  <SelectItem value="valide">Validé</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="archive">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budget_total">Budget total (€)</Label>
              <Input
                id="budget_total"
                type="number"
                step="0.01"
                value={formData.budget_total}
                onChange={(e) => setFormData({ ...formData, budget_total: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget_acquis">Budget acquis (€)</Label>
              <Input
                id="budget_acquis"
                type="number"
                step="0.01"
                value={formData.budget_acquis}
                onChange={(e) => setFormData({ ...formData, budget_acquis: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_demarrage">
              Date de démarrage {formData.statut === 'en_cours' && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="date_demarrage"
              type="date"
              value={formData.date_demarrage}
              onChange={(e) => setFormData({ ...formData, date_demarrage: e.target.value })}
            />
            {formData.statut === 'en_cours' && !formData.date_demarrage && (
              <p className="text-sm text-destructive">La date de démarrage est obligatoire pour les projets en cours</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="financement_statut">Statut financement</Label>
              <Select
                value={formData.financement_statut}
                onValueChange={(value: any) => setFormData({ ...formData, financement_statut: value })}
              >
                <SelectTrigger id="financement_statut">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aucun">Aucun</SelectItem>
                  <SelectItem value="recherche_financement">Recherche</SelectItem>
                  <SelectItem value="partiel">Partiel</SelectItem>
                  <SelectItem value="complet">Complet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="avancement">Avancement (%)</Label>
              <Input
                id="avancement"
                type="number"
                min="0"
                max="100"
                value={formData.avancement}
                onChange={(e) => setFormData({ ...formData, avancement: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="risques">Risques</Label>
            <Textarea
              id="risques"
              value={formData.risques}
              onChange={(e) => setFormData({ ...formData, risques: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={updateProject.isPending}>
              {updateProject.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
