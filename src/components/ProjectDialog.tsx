import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useCreateProject } from "@/hooks/useProjects";
import { usePoles } from "@/hooks/usePoles";

export function ProjectDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    titre: "",
    description: "",
    pole_id: "",
  });

  const createProject = useCreateProject();
  const { data: poles } = usePoles();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createProject.mutateAsync(formData);
    setOpen(false);
    setFormData({ code: "", titre: "", description: "", pole_id: "" });
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
    </Dialog>
  );
}
