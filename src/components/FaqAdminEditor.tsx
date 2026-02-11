import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getFaqData, saveFaqData, resetFaqData, FAQ_CATEGORIES, type FaqItem } from "@/data/faqData";
import { Plus, Trash2, GripVertical, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface FaqAdminEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function FaqAdminEditor({ open, onOpenChange, onSave }: FaqAdminEditorProps) {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setItems(getFaqData());
      setSelectedId(null);
    }
  }, [open]);

  const selected = items.find((i) => i.id === selectedId) || null;

  const updateItem = (id: string, patch: Partial<FaqItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const addItem = () => {
    const newItem: FaqItem = {
      id: `faq-${Date.now()}`,
      question: "Nouvelle question",
      answer: "",
      category: FAQ_CATEGORIES[0].name,
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleSave = () => {
    const invalid = items.find((i) => !i.question.trim() || !i.answer.trim());
    if (invalid) {
      toast({ title: "Erreur", description: "Chaque question doit avoir un intitulé et une réponse.", variant: "destructive" });
      setSelectedId(invalid.id);
      return;
    }
    saveFaqData(items);
    onSave();
    onOpenChange(false);
    toast({ title: "FAQ enregistrée", description: `${items.length} question(s) sauvegardée(s).` });
  };

  const handleReset = () => {
    resetFaqData();
    setItems(getFaqData());
    setSelectedId(null);
    toast({ title: "FAQ réinitialisée", description: "Le contenu par défaut a été restauré." });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gestion de la FAQ</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Left: list */}
          <div className="w-1/3 flex flex-col gap-2">
            <Button variant="outline" size="sm" className="w-full" onClick={addItem}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une question
            </Button>
            <ScrollArea className="flex-1 border rounded-md">
              <div className="p-2 space-y-1">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full text-left text-xs px-2 py-1.5 rounded flex items-center gap-1 transition-colors ${
                      selectedId === item.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    }`}
                  >
                    <GripVertical className="h-3 w-3 shrink-0 opacity-40" />
                    <span className="truncate">{item.question}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right: editor */}
          <div className="w-2/3">
            {selected ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Catégorie</Label>
                  <Select
                    value={selected.category}
                    onValueChange={(v) => updateItem(selected.id, { category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FAQ_CATEGORIES.map((c) => (
                        <SelectItem key={c.name} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Input
                    value={selected.question}
                    onChange={(e) => updateItem(selected.id, { question: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Réponse (supporte le **gras**)</Label>
                  <Textarea
                    value={selected.answer}
                    onChange={(e) => updateItem(selected.id, { answer: e.target.value })}
                    rows={8}
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteItem(selected.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer cette question
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Sélectionnez une question à modifier ou ajoutez-en une nouvelle.
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Réinitialiser la FAQ ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Toutes vos modifications seront perdues et le contenu par défaut sera restauré.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>Réinitialiser</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
