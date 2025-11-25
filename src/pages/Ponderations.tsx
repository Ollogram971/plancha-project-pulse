import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Weight, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CriterionScalesDialog } from "@/components/CriterionScalesDialog";

export default function Ponderations() {
  const { toast } = useToast();
  
  // Fetch criteria from database
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

  // Map criterion codes to IDs
  const criterionMap = useMemo(() => {
    if (!criteria) return {};
    return Object.fromEntries(criteria.map((c) => [c.code, c.id]));
  }, [criteria]);
  
  // State for weight values
  const [weights, setWeights] = useState({
    align: 20,
    strategic: 15,
    emblematic: 10,
    structural: 20,
    progress: 10,
    financing: 15,
    feasibility: 10,
  });

  // Calculate total dynamically
  const totalWeight = useMemo(() => {
    return Object.values(weights).reduce((sum, value) => sum + value, 0);
  }, [weights]);

  // Check if total is valid
  const isValidTotal = totalWeight === 100;

  const handleWeightChange = (key: keyof typeof weights, value: string) => {
    const numValue = parseInt(value) || 0;
    setWeights(prev => ({ ...prev, [key]: numValue }));
  };

  const handleSaveWeights = () => {
    if (!isValidTotal) {
      toast({
        title: "Erreur de validation",
        description: `Le total des pondérations doit être égal à 100%. Actuellement: ${totalWeight}%`,
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Pondérations enregistrées",
      description: "Les pondérations ont été mises à jour avec succès.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pondérations</h1>
        <p className="text-muted-foreground mt-2">
          Configuration des poids des critères d'évaluation PLANCHA
        </p>
      </div>

      {/* Criteria weights */}
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
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="align">Alignement PNG</Label>
                <CriterionScalesDialog
                  criterionCode="alignement_png"
                  criterionLabel="Alignement PNG"
                  criterionId={criterionMap.alignement_png}
                />
              </div>
              <div className="flex gap-2">
                <Input 
                  id="align" 
                  type="number" 
                  value={weights.align}
                  onChange={(e) => handleWeightChange('align', e.target.value)}
                  min={0}
                  max={100}
                />
                <span className="flex items-center text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="strategic">Intérêt stratégique</Label>
                <CriterionScalesDialog
                  criterionCode="interet_strategique"
                  criterionLabel="Intérêt stratégique"
                  criterionId={criterionMap.interet_strategique}
                />
              </div>
              <div className="flex gap-2">
                <Input 
                  id="strategic" 
                  type="number" 
                  value={weights.strategic}
                  onChange={(e) => handleWeightChange('strategic', e.target.value)}
                  min={0}
                  max={100}
                />
                <span className="flex items-center text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="emblematic">Emblématique</Label>
                <CriterionScalesDialog
                  criterionCode="emblematique"
                  criterionLabel="Emblématique"
                  criterionId={criterionMap.emblematique}
                />
              </div>
              <div className="flex gap-2">
                <Input 
                  id="emblematic" 
                  type="number" 
                  value={weights.emblematic}
                  onChange={(e) => handleWeightChange('emblematic', e.target.value)}
                  min={0}
                  max={100}
                />
                <span className="flex items-center text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="structural">Structurant</Label>
                <CriterionScalesDialog
                  criterionCode="structurant"
                  criterionLabel="Structurant"
                  criterionId={criterionMap.structurant}
                />
              </div>
              <div className="flex gap-2">
                <Input 
                  id="structural" 
                  type="number" 
                  value={weights.structural}
                  onChange={(e) => handleWeightChange('structural', e.target.value)}
                  min={0}
                  max={100}
                />
                <span className="flex items-center text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="progress">Avancement</Label>
                <CriterionScalesDialog
                  criterionCode="avancement"
                  criterionLabel="Avancement"
                  criterionId={criterionMap.avancement}
                />
              </div>
              <div className="flex gap-2">
                <Input 
                  id="progress" 
                  type="number" 
                  value={weights.progress}
                  onChange={(e) => handleWeightChange('progress', e.target.value)}
                  min={0}
                  max={100}
                />
                <span className="flex items-center text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="financing">Financement</Label>
                <CriterionScalesDialog
                  criterionCode="financement"
                  criterionLabel="Financement"
                  criterionId={criterionMap.financement}
                />
              </div>
              <div className="flex gap-2">
                <Input 
                  id="financing" 
                  type="number" 
                  value={weights.financing}
                  onChange={(e) => handleWeightChange('financing', e.target.value)}
                  min={0}
                  max={100}
                />
                <span className="flex items-center text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="feasibility">Faisabilité</Label>
                <CriterionScalesDialog
                  criterionCode="faisabilite"
                  criterionLabel="Faisabilité"
                  criterionId={criterionMap.faisabilite}
                />
              </div>
              <div className="flex gap-2">
                <Input 
                  id="feasibility" 
                  type="number" 
                  value={weights.feasibility}
                  onChange={(e) => handleWeightChange('feasibility', e.target.value)}
                  min={0}
                  max={100}
                />
                <span className="flex items-center text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-2 flex items-end">
              <div className={`flex-1 p-3 rounded-md ${isValidTotal ? 'bg-muted' : 'bg-destructive/10 border border-destructive'}`}>
                <p className={`text-sm font-medium ${isValidTotal ? '' : 'text-destructive'}`}>
                  Total: {totalWeight}%
                </p>
                <p className="text-xs text-muted-foreground">Profil: Standard PNG</p>
              </div>
            </div>
          </div>
          <Separator />
          <div className="flex gap-2">
            <Button 
              onClick={handleSaveWeights}
              disabled={!isValidTotal}
            >
              Enregistrer les pondérations
            </Button>
            <Button variant="outline">Créer un nouveau profil</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
