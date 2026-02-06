import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Database, CheckCircle2, XCircle, Loader2, Server, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function DatabaseServerSettings() {
  const { toast } = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);

  // Get current configuration from environment
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "";

  // Extract host from URL for display
  const getHostFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setConnectionStatus("idle");

    try {
      // Test connection by making a simple query
      const { error } = await supabase
        .from("app_settings")
        .select("id")
        .limit(1);

      if (error) {
        throw error;
      }

      setConnectionStatus("success");
      setLastTestTime(new Date());
      toast({
        title: "Connexion réussie",
        description: "La connexion au serveur de base de données est établie.",
      });
    } catch (error) {
      setConnectionStatus("error");
      setLastTestTime(new Date());
      toast({
        title: "Échec de la connexion",
        description: "Impossible de se connecter au serveur de base de données. " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "success":
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Connecté
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Erreur
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            Non testé
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <CardTitle>Serveur de base de données</CardTitle>
        </div>
        <CardDescription>
          Configuration et état de la connexion au serveur de base de données
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Server className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">État de la connexion</p>
              <p className="text-sm text-muted-foreground">
                {lastTestTime 
                  ? `Dernier test: ${lastTestTime.toLocaleString("fr-FR")}`
                  : "Aucun test effectué"
                }
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <Separator />

        {/* Current Configuration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">Configuration actuelle</h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>La configuration du serveur est gérée par Lovable Cloud et ne peut pas être modifiée manuellement.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="db-host">Hôte du serveur</Label>
              <Input
                id="db-host"
                type="text"
                value={getHostFromUrl(supabaseUrl)}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="db-project">Identifiant du projet</Label>
              <Input
                id="db-project"
                type="text"
                value={projectId}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="db-url">URL de connexion</Label>
            <Input
              id="db-url"
              type="text"
              value={supabaseUrl}
              readOnly
              className="bg-muted font-mono text-xs"
            />
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Cette application utilise un serveur de base de données géré par Lovable Cloud. 
                La configuration est automatique et sécurisée. Pour modifier le serveur, 
                veuillez contacter l'administrateur de la plateforme.
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Test Connection */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Tester la connexion</p>
            <p className="text-sm text-muted-foreground">
              Vérifiez que la connexion au serveur fonctionne correctement
            </p>
          </div>
          <Button 
            onClick={testConnection} 
            disabled={isTesting}
            variant="outline"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Tester la connexion
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
