import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings2 } from "lucide-react";
import { useCriterionScales, useUpdateCriterionScale, useCreateCriterionScales } from "@/hooks/useCriterionScales";

interface CriterionScalesDialogProps {
  criterionCode: string;
  criterionLabel: string;
  criterionId?: string;
}

export function CriterionScalesDialog({
  criterionCode,
  criterionLabel,
  criterionId,
}: CriterionScalesDialogProps) {
  const [open, setOpen] = useState(false);
  const { data: scales, isLoading, refetch } = useCriterionScales(criterionId);
  const updateScale = useUpdateCriterionScale();
  const createScales = useCreateCriterionScales();
  const [editedDescriptions, setEditedDescriptions] = useState<Record<string, string>>({});

  // Créer automatiquement les échelles par défaut si elles n'existent pas
  useEffect(() => {
    if (open && !isLoading && criterionId && (!scales || scales.length === 0)) {
      const defaultScales = [
        { score_value: 0, description: "Non défini" },
        { score_value: 1, description: "Non défini" },
        { score_value: 2, description: "Non défini" },
        { score_value: 3, description: "Non défini" },
        { score_value: 4, description: "Non défini" },
      ];
      createScales.mutateAsync({ criterionId, scales: defaultScales }).then(() => {
        refetch();
      });
    }
  }, [open, isLoading, criterionId, scales, createScales, refetch]);

  const handleSave = async (scaleId: string) => {
    const description = editedDescriptions[scaleId];
    if (description) {
      await updateScale.mutateAsync({ id: scaleId, description });
      setEditedDescriptions((prev) => {
        const updated = { ...prev };
        delete updated[scaleId];
        return updated;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Settings2 className="h-4 w-4 mr-1" />
          Critères et Poids
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Échelles d'évaluation - {criterionLabel}</DialogTitle>
          <DialogDescription>
            Définissez les descriptions pour chaque niveau de notation (0 à 4)
          </DialogDescription>
        </DialogHeader>

        {isLoading || createScales.isPending ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : scales && scales.length > 0 ? (
          <div className="space-y-6">
            {scales.map((scale) => (
              <div key={scale.id} className="space-y-2">
                <Label htmlFor={`scale-${scale.id}`}>
                  <span className="font-semibold">Score {scale.score_value}</span>
                </Label>
                <Textarea
                  id={`scale-${scale.id}`}
                  value={
                    editedDescriptions[scale.id] !== undefined
                      ? editedDescriptions[scale.id]
                      : scale.description
                  }
                  onChange={(e) =>
                    setEditedDescriptions((prev) => ({
                      ...prev,
                      [scale.id]: e.target.value,
                    }))
                  }
                  rows={2}
                  className="resize-none"
                />
                {editedDescriptions[scale.id] !== undefined &&
                  editedDescriptions[scale.id] !== scale.description && (
                    <Button
                      size="sm"
                      onClick={() => handleSave(scale.id)}
                      disabled={updateScale.isPending}
                    >
                      Enregistrer
                    </Button>
                  )}
              </div>
            ))}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
