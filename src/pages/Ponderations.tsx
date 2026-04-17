import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Weight, AlertCircle, Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CriterionScalesDialog } from "@/components/CriterionScalesDialog";

type CriterionRow = {
  id: string; // criterion id (or temp id for new ones)
  isNew?: boolean;
  code: string;
  libelle: string;
  ordre: number;
  poids: number;
};

export default function Ponderations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch active weight profile + criteria + weights
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["weight-profile-active"],
    queryFn: async () => {
      // Get active profile (or first one)
      const { data: profiles, error: pErr } = await supabase
        .from("weight_profiles")
        .select("*")
        .order("actif", { ascending: false })
        .limit(1);
      if (pErr) throw pErr;
      const profile = profiles?.[0];
      if (!profile) return { profile: null, rows: [] as CriterionRow[] };

      const { data: criteria, error: cErr } = await supabase
        .from("criteria")
        .select("*")
        .order("ordre");
      if (cErr) throw cErr;

      const { data: weights, error: wErr } = await supabase
        .from("weights")
        .select("*")
        .eq("profile_id", profile.id);
      if (wErr) throw wErr;

      const weightMap = new Map(weights?.map((w) => [w.criterion_id, Number(w.poids_percent)]));
      const rows: CriterionRow[] = (criteria ?? []).map((c) => ({
        id: c.id,
        code: c.code,
        libelle: c.libelle,
        ordre: c.ordre,
        poids: weightMap.get(c.id) ?? 0,
      }));

      return { profile, rows };
    },
  });

  const [rows, setRows] = useState<CriterionRow[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  // Sync server data → local state
  useEffect(() => {
    if (profileData?.rows) {
      setRows(profileData.rows);
      setDeletedIds([]);
    }
  }, [profileData]);

  const totalWeight = useMemo(
    () => rows.reduce((sum, r) => sum + (Number(r.poids) || 0), 0),
    [rows]
  );
  const isValidTotal = totalWeight === 100;

  const updateRow = (id: string, patch: Partial<CriterionRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleAddCriterion = () => {
    const tempId = `new-${Date.now()}`;
    const nextOrdre = rows.length > 0 ? Math.max(...rows.map((r) => r.ordre)) + 1 : 1;
    setRows((prev) => [
      ...prev,
      {
        id: tempId,
        isNew: true,
        code: `critere_${nextOrdre}`,
        libelle: "Nouveau critère",
        ordre: nextOrdre,
        poids: 0,
      },
    ]);
  };

  const handleDeleteRow = (id: string, isNew?: boolean) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    if (!isNew) setDeletedIds((prev) => [...prev, id]);
  };

  const handleSave = async () => {
    if (!profileData?.profile) {
      toast({ variant: "destructive", title: "Erreur", description: "Aucun profil de pondération trouvé." });
      return;
    }
    if (!isValidTotal) {
      toast({
        variant: "destructive",
        title: "Erreur de validation",
        description: `Le total des pondérations doit être égal à 100%. Actuellement: ${totalWeight}%`,
      });
      return;
    }
    // Validate libellés
    if (rows.some((r) => !r.libelle.trim())) {
      toast({ variant: "destructive", title: "Erreur", description: "Tous les critères doivent avoir un libellé." });
      return;
    }

    setIsSaving(true);
    try {
      const profileId = profileData.profile.id;

      // 1. Delete removed criteria (cascade to weights/scales via app logic)
      if (deletedIds.length > 0) {
        // Delete weights first
        await supabase.from("weights").delete().in("criterion_id", deletedIds);
        // Delete scales
        await supabase.from("criterion_scales").delete().in("criterion_id", deletedIds);
        // Delete scores_raw
        await supabase.from("scores_raw").delete().in("criterion_id", deletedIds);
        // Then criteria
        const { error } = await supabase.from("criteria").delete().in("id", deletedIds);
        if (error) throw error;
      }

      // 2. Process each row
      for (const row of rows) {
        if (row.isNew) {
          // Insert new criterion
          const { data: newCrit, error: cErr } = await supabase
            .from("criteria")
            .insert({
              code: row.code,
              libelle: row.libelle.trim(),
              ordre: row.ordre,
            })
            .select()
            .single();
          if (cErr) throw cErr;
          // Insert weight
          const { error: wErr } = await supabase.from("weights").insert({
            profile_id: profileId,
            criterion_id: newCrit.id,
            poids_percent: row.poids,
          });
          if (wErr) throw wErr;
        } else {
          // Update libelle + ordre on criteria
          const { error: cErr } = await supabase
            .from("criteria")
            .update({ libelle: row.libelle.trim(), ordre: row.ordre })
            .eq("id", row.id);
          if (cErr) throw cErr;

          // Upsert weight for this criterion+profile
          const { data: existing } = await supabase
            .from("weights")
            .select("id")
            .eq("profile_id", profileId)
            .eq("criterion_id", row.id)
            .maybeSingle();

          if (existing) {
            const { error } = await supabase
              .from("weights")
              .update({ poids_percent: row.poids })
              .eq("id", existing.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from("weights").insert({
              profile_id: profileId,
              criterion_id: row.id,
              poids_percent: row.poids,
            });
            if (error) throw error;
          }
        }
      }

      toast({
        title: "Pondérations enregistrées",
        description: "Les modifications ont été sauvegardées avec succès.",
      });

      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ["weight-profile-active"] });
      await queryClient.invalidateQueries({ queryKey: ["criteria"] });
      await queryClient.invalidateQueries({ queryKey: ["audit-logs"] });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e.message ?? "Échec de l'enregistrement" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pondérations</h1>
        <p className="text-muted-foreground mt-2">
          Configuration des poids des critères d'évaluation PLANCHA
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Weight className="h-5 w-5 text-primary" />
            <CardTitle>Pondérations PLANCHA</CardTitle>
          </div>
          <CardDescription>
            Configuration des poids des critères d'évaluation (total doit être 100%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {!isValidTotal && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Le total des pondérations doit être égal à 100% pour pouvoir enregistrer.
                    Actuellement: {totalWeight}%
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {rows.map((row) => (
                  <div key={row.id} className="space-y-2 p-3 rounded-md border">
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        value={row.libelle}
                        onChange={(e) => updateRow(row.id, { libelle: e.target.value })}
                        placeholder="Libellé du critère"
                        className="font-medium"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {!row.isNew && (
                        <CriterionScalesDialog
                          criterionCode={row.code}
                          criterionLabel={row.libelle}
                          criterionId={row.id}
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRow(row.id, row.isNew)}
                        className="text-destructive hover:text-destructive ml-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={row.poids}
                        onChange={(e) => updateRow(row.id, { poids: parseFloat(e.target.value) || 0 })}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <span className="flex items-center text-muted-foreground">%</span>
                    </div>
                  </div>
                ))}

                <div className="space-y-2 flex items-end">
                  <div
                    className={`flex-1 p-3 rounded-md ${
                      isValidTotal ? "bg-muted" : "bg-destructive/10 border border-destructive"
                    }`}
                  >
                    <p className={`text-sm font-medium ${isValidTotal ? "" : "text-destructive"}`}>
                      Total: {totalWeight}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Profil: {profileData?.profile?.nom ?? "—"}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSave} disabled={!isValidTotal || isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enregistrer les pondérations
                </Button>
                <Button variant="outline" onClick={handleAddCriterion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une nouvelle pondération
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
