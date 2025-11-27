import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateProject } from "@/hooks/useProjects";
import { usePoles } from "@/hooks/usePoles";
import { useProjectScores, useUpsertScore } from "@/hooks/useScores";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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
  pole_id: z.string().uuid("Pôle/Service invalide"),
  statut: z.enum(['a_valider', 'en_cours', 'archive']),
  budget_total: z.string().optional(),
  budget_acquis: z.string().optional(),
  financement_statut: z.enum(['aucun', 'recherche_financement', 'partiel', 'complet']).optional(),
  avancement: z.string().optional(),
  risques: z.string().trim().max(2000, "Risques trop long (max 2000 caractères)").optional().or(z.literal("")),
  date_previsionnelle_debut: z.string().optional(),
  date_demarrage: z.string().optional(),
  date_fin: z.string().optional(),
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
}).refine((data) => {
  if (data.date_demarrage && data.date_fin) {
    const dateDemarrage = new Date(data.date_demarrage);
    const dateFin = new Date(data.date_fin);
    
    if (dateDemarrage > dateFin) {
      return false;
    }
  }
  return true;
}, {
  message: "La date de démarrage doit être inférieure ou égale à la date de fin",
  path: ["date_demarrage"],
});

type ProjectStatus = 'a_valider' | 'en_cours' | 'archive';
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
    date_previsionnelle_debut: string;
    date_demarrage: string;
    date_fin: string;
  }>({
    titre: "",
    description: "",
    pole_id: "",
    statut: "a_valider",
    budget_total: "",
    budget_acquis: "",
    financement_statut: "aucun",
    avancement: "",
    risques: "",
    date_previsionnelle_debut: "",
    date_demarrage: "",
    date_fin: "",
  });

  const [scores, setScores] = useState<Record<string, number>>({});

  const updateProject = useUpdateProject();
  const { data: poles } = usePoles();
  const { toast } = useToast();
  const upsertScore = useUpsertScore();

  // Fetch criteria and weights
  const { data: criteria } = useQuery({
    queryKey: ["criteria"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("criteria")
        .select("*")
        .order("ordre");
      if (error) throw error;
      return data;
    },
  });

  const { data: weights } = useQuery({
    queryKey: ["weights"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weights")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing scores for this project
  const { data: existingScores } = useProjectScores(project?.id);

  // Calculate weighted score
  const calculatedScore = useMemo(() => {
    if (!criteria || !weights || Object.keys(scores).length === 0) return 0;

    let total = 0;
    criteria.forEach((criterion) => {
      const score = scores[criterion.id] || 0;
      const weight = weights.find((w) => w.criterion_id === criterion.id);
      if (weight) {
        total += (score / 4) * weight.poids_percent;
      }
    });

    return total;
  }, [criteria, weights, scores]);

  // Calcul automatique de l'avancement
  const calculateAvancement = (dateDebutStr: string, dateFinStr: string): string => {
    if (!dateDebutStr || !dateFinStr) return "";
    
    const dateDebut = new Date(dateDebutStr);
    const dateFin = new Date(dateFinStr);
    const dateActuelle = new Date();
    
    const dureeTotal = dateFin.getTime() - dateDebut.getTime();
    const dureeEcoulee = dateActuelle.getTime() - dateDebut.getTime();
    
    if (dureeTotal <= 0) return "0";
    
    const avancement = Math.round((dureeEcoulee / dureeTotal) * 100);
    
    // Borner entre 0 et 100
    return Math.min(Math.max(avancement, 0), 100).toString();
  };

  useEffect(() => {
    if (project) {
      const dateDebut = project.date_demarrage || "";
      const dateFin = project.date_fin || "";
      const avancementCalcule = dateDebut && dateFin ? calculateAvancement(dateDebut, dateFin) : project.avancement?.toString() || "";
      
      setFormData({
        titre: project.titre || "",
        description: project.description || "",
        pole_id: project.pole_id || "",
        statut: project.statut || "a_valider",
        budget_total: project.budget_total?.toString() || "",
        budget_acquis: project.budget_acquis?.toString() || "",
        financement_statut: project.financement_statut || "aucun",
        avancement: avancementCalcule,
        risques: project.risques || "",
        date_previsionnelle_debut: project.date_previsionnelle_debut || "",
        date_demarrage: dateDebut,
        date_fin: dateFin,
      });
    }
  }, [project]);

  // Initialize scores from existing data
  useEffect(() => {
    if (existingScores && existingScores.length > 0) {
      const scoresMap: Record<string, number> = {};
      existingScores.forEach((s) => {
        scoresMap[s.criterion_id] = s.score_0_4;
      });
      setScores(scoresMap);
    }
  }, [existingScores]);

  // Recalculer l'avancement quand les dates changent
  useEffect(() => {
    if (formData.date_demarrage && formData.date_fin) {
      const avancementCalcule = calculateAvancement(formData.date_demarrage, formData.date_fin);
      if (avancementCalcule !== formData.avancement) {
        setFormData(prev => ({ ...prev, avancement: avancementCalcule }));
      }
    }
  }, [formData.date_demarrage, formData.date_fin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = projectUpdateSchema.parse(formData);
      const updateData = {
        ...validated,
        budget_total: validated.budget_total ? parseFloat(validated.budget_total) : null,
        budget_acquis: validated.budget_acquis ? parseFloat(validated.budget_acquis) : null,
        avancement: validated.avancement ? parseInt(validated.avancement) : null,
        date_previsionnelle_debut: validated.date_previsionnelle_debut || null,
        date_demarrage: validated.date_demarrage || null,
        date_fin: validated.date_fin || null,
        score_total: calculatedScore,
      };
      
      await updateProject.mutateAsync({ id: project.id, data: updateData });

      // Save all scores
      const scorePromises = Object.entries(scores).map(([criterionId, score]) =>
        upsertScore.mutateAsync({
          projectId: project.id,
          criterionId,
          score,
        })
      );

      await Promise.all(scorePromises);

      toast({
        title: "Projet mis à jour",
        description: "Le projet et ses scores ont été enregistrés avec succès.",
      });
      
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
              <Label htmlFor="pole">Pôle/Service *</Label>
              <Select
                required
                value={formData.pole_id}
                onValueChange={(value) => setFormData({ ...formData, pole_id: value })}
              >
                <SelectTrigger id="pole">
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
                  <SelectItem value="a_valider">À valider</SelectItem>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date_previsionnelle_debut">Date prévisionnelle de début</Label>
              <Input
                id="date_previsionnelle_debut"
                type="date"
                value={formData.date_previsionnelle_debut}
                onChange={(e) => setFormData({ ...formData, date_previsionnelle_debut: e.target.value })}
              />
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date_fin">Date de fin</Label>
              <Input
                id="date_fin"
                type="date"
                value={formData.date_fin}
                onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
              />
            </div>
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
              <Label htmlFor="avancement">
                Avancement (%)
                {formData.date_demarrage && formData.date_fin && (
                  <span className="text-xs text-muted-foreground ml-2">(calculé automatiquement)</span>
                )}
              </Label>
              <Input
                id="avancement"
                type="number"
                min="0"
                max="100"
                value={formData.avancement}
                onChange={(e) => setFormData({ ...formData, avancement: e.target.value })}
                disabled={!!(formData.date_demarrage && formData.date_fin)}
                className={formData.date_demarrage && formData.date_fin ? "bg-muted" : ""}
              />
              {formData.date_demarrage && formData.date_fin && (
                <p className="text-xs text-muted-foreground">
                  L'avancement est calculé automatiquement en fonction des dates
                </p>
              )}
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

          <Separator className="my-6" />

          {/* Evaluation Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Évaluation du projet</h3>
                <p className="text-sm text-muted-foreground">
                  Chaque critère est noté de 0 à 4
                </p>
              </div>
              <Badge variant="outline" className="text-lg px-4 py-2">
                Score total: {calculatedScore.toFixed(2)} / 100
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {criteria?.map((criterion) => {
                const weight = weights?.find((w) => w.criterion_id === criterion.id);
                return (
                  <div key={criterion.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`score-${criterion.id}`}>
                        {criterion.libelle}
                        {weight && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (Poids: {weight.poids_percent}%)
                          </span>
                        )}
                      </Label>
                      {scores[criterion.id] !== undefined && weight && (
                        <span className="text-xs text-muted-foreground">
                          = {((scores[criterion.id] / 4) * weight.poids_percent).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <Select
                      value={scores[criterion.id]?.toString() || ""}
                      onValueChange={(value) =>
                        setScores((prev) => ({ ...prev, [criterion.id]: parseInt(value) }))
                      }
                    >
                      <SelectTrigger id={`score-${criterion.id}`}>
                        <SelectValue placeholder="Sélectionner un score" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 - Non défini</SelectItem>
                        <SelectItem value="1">1 - Faible</SelectItem>
                        <SelectItem value="2">2 - Moyen</SelectItem>
                        <SelectItem value="3">3 - Bon</SelectItem>
                        <SelectItem value="4">4 - Excellent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
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
