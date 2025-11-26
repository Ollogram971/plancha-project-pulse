import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Trash2, Edit2, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Theme {
  id: string;
  code: string;
  libelle: string;
  famille: string | null;
  created_at: string;
}

export default function Themes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddThemeOpen, setIsAddThemeOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [newTheme, setNewTheme] = useState({ code: "", libelle: "", famille: "" });
  const [showFamilleSuggestions, setShowFamilleSuggestions] = useState(false);

  // Fetch all themes
  const { data: themes = [], isLoading } = useQuery({
    queryKey: ["themes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("themes")
        .select("*")
        .order("famille", { ascending: true })
        .order("code", { ascending: true });

      if (error) throw error;
      return data as Theme[];
    },
  });

  // Group themes by family
  const themesByFamily = themes.reduce((acc, theme) => {
    const famille = theme.famille || "Sans famille";
    if (!acc[famille]) {
      acc[famille] = [];
    }
    acc[famille].push(theme);
    return acc;
  }, {} as Record<string, Theme[]>);

  // Get unique families for the select dropdown
  const uniqueFamilies = Array.from(new Set(themes.map(t => t.famille).filter(Boolean))) as string[];

  // Generate code based on selected family
  const generateCode = (famille: string) => {
    if (!famille) return "";
    
    // Extract prefix from famille (first 3 letters uppercase)
    const prefix = famille.substring(0, 3).toUpperCase();
    
    // Find all themes in this family
    const familyThemes = themes.filter(t => t.famille === famille);
    
    // Extract numbers from existing codes and find max
    const existingNumbers = familyThemes
      .map(t => {
        const match = t.code.match(/-(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => n > 0);
    
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    
    return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
  };

  // Add or update theme mutation
  const saveMutation = useMutation({
    mutationFn: async (theme: { id?: string; code: string; libelle: string; famille: string }) => {
      if (theme.id) {
        const { error } = await supabase
          .from("themes")
          .update({ code: theme.code, libelle: theme.libelle, famille: theme.famille })
          .eq("id", theme.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("themes")
          .insert({ code: theme.code, libelle: theme.libelle, famille: theme.famille });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
      toast({
        title: "Succès",
        description: editingTheme ? "Thème modifié avec succès" : "Thème ajouté avec succès",
      });
      setIsAddThemeOpen(false);
      setEditingTheme(null);
      setNewTheme({ code: "", libelle: "", famille: "" });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de sauvegarder le thème: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete theme mutation
  const deleteMutation = useMutation({
    mutationFn: async (themeId: string) => {
      const { error } = await supabase.from("themes").delete().eq("id", themeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["themes"] });
      toast({
        title: "Succès",
        description: "Thème supprimé avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: `Impossible de supprimer le thème: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!newTheme.code || !newTheme.libelle || !newTheme.famille) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont obligatoires",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      id: editingTheme?.id,
      code: newTheme.code,
      libelle: newTheme.libelle,
      famille: newTheme.famille,
    });
  };

  const handleEdit = (theme: Theme) => {
    setEditingTheme(theme);
    setNewTheme({
      code: theme.code,
      libelle: theme.libelle,
      famille: theme.famille || "",
    });
    setIsAddThemeOpen(true);
  };

  const handleFamilleChange = (value: string) => {
    const isExistingFamily = uniqueFamilies.includes(value);
    setNewTheme({
      ...newTheme,
      famille: value,
      // Only auto-generate code if it's an existing family and not editing
      code: editingTheme ? newTheme.code : (isExistingFamily ? generateCode(value) : ""),
    });
  };

  const handleFamilleSelect = (famille: string) => {
    handleFamilleChange(famille);
    setShowFamilleSuggestions(false);
  };

  const isFormValid = newTheme.code && newTheme.libelle && newTheme.famille;

  const handleDelete = (themeId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce thème ?")) {
      deleteMutation.mutate(themeId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Thèmes Structurants</h1>
          <p className="text-muted-foreground mt-2">
            Gestion des thèmes structurants organisés par famille
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTheme(null);
            setNewTheme({ code: "", libelle: "", famille: "" });
            setIsAddThemeOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un thème
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thèmes par famille</CardTitle>
          <CardDescription>
            {themes.length} thème{themes.length > 1 ? "s" : ""} réparti{themes.length > 1 ? "s" : ""} en {Object.keys(themesByFamily).length} famille{Object.keys(themesByFamily).length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {Object.entries(themesByFamily).map(([famille, familleThemes]) => (
              <AccordionItem key={famille} value={famille}>
                <AccordionTrigger className="text-lg font-semibold">
                  {famille} ({familleThemes.length})
                </AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {familleThemes.map((theme) => (
                        <TableRow key={theme.id}>
                          <TableCell className="font-medium">{theme.code}</TableCell>
                          <TableCell>{theme.libelle}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(theme)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(theme.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Dialog open={isAddThemeOpen} onOpenChange={setIsAddThemeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTheme ? "Modifier le thème" : "Ajouter un thème"}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations du thème structurant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Label htmlFor="famille">Famille *</Label>
              <Popover open={showFamilleSuggestions} onOpenChange={setShowFamilleSuggestions}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      id="famille"
                      value={newTheme.famille}
                      onChange={(e) => handleFamilleChange(e.target.value)}
                      onFocus={() => setShowFamilleSuggestions(true)}
                      placeholder="Saisissez ou sélectionnez une famille"
                      className="pr-8"
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <div className="max-h-[200px] overflow-y-auto">
                    {uniqueFamilies.length > 0 ? (
                      <div className="py-1">
                        {uniqueFamilies
                          .filter(f => f.toLowerCase().includes(newTheme.famille.toLowerCase()))
                          .map((famille) => (
                            <button
                              key={famille}
                              type="button"
                              onClick={() => handleFamilleSelect(famille)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                            >
                              {famille}
                            </button>
                          ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-sm text-muted-foreground">
                        Aucune famille existante
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground mt-1">
                Saisissez une nouvelle famille ou sélectionnez-en une existante
              </p>
            </div>
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={newTheme.code}
                onChange={(e) => setNewTheme({ ...newTheme, code: e.target.value })}
                placeholder="Ex: BIO-001"
              />
            </div>
            <div>
              <Label htmlFor="libelle">Libellé *</Label>
              <Input
                id="libelle"
                value={newTheme.libelle}
                onChange={(e) => setNewTheme({ ...newTheme, libelle: e.target.value })}
                placeholder="Ex: Conservation des espèces endémiques"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddThemeOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending || !isFormValid}>
              {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
