import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreatePole } from "@/hooks/usePoles";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const poleSchema = z.object({
  code: z.string()
    .trim()
    .min(1, "Code requis")
    .max(20, "Code trop long (max 20 caractères)")
    .regex(/^[A-Z0-9_-]+$/, "Format: majuscules, chiffres, tirets et underscores uniquement"),
  libelle: z.string()
    .trim()
    .min(2, "Libellé trop court (min 2 caractères)")
    .max(100, "Libellé trop long (max 100 caractères)")
});

interface PoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPoleCreated?: (poleId: string) => void;
}

export function PoleDialog({ open, onOpenChange, onPoleCreated }: PoleDialogProps) {
  const [formData, setFormData] = useState({
    code: "",
    libelle: "",
  });

  const createPole = useCreatePole();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = poleSchema.parse(formData);
      const newPole = await createPole.mutateAsync({
        code: validated.code,
        libelle: validated.libelle
      });
      onOpenChange(false);
      setFormData({ code: "", libelle: "" });
      if (onPoleCreated && newPole) {
        onPoleCreated(newPole.id);
      }
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un nouveau pôle</DialogTitle>
          <DialogDescription>
            Ajoutez un pôle pour organiser vos projets
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code *</Label>
            <Input
              id="code"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="Ex: BIODIV"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">
              Majuscules, chiffres, tirets et underscores uniquement
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="libelle">Libellé *</Label>
            <Input
              id="libelle"
              required
              value={formData.libelle}
              onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
              placeholder="Ex: Biodiversité"
              maxLength={100}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createPole.isPending}>
              {createPole.isPending ? "Création..." : "Créer le pôle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
