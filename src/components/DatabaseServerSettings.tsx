import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Database, CheckCircle2, XCircle, Loader2, Server, Info, Eye, EyeOff, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DB_CONFIG_KEY = "plancha_db_config";

export interface SavedDbConfig {
  activeServer: ServerType;
  externalConfig?: ExternalServerConfig;
}

export function getSavedDbConfig(): SavedDbConfig {
  try {
    const raw = localStorage.getItem(DB_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { activeServer: "supabase" };
}
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ServerType = "supabase" | "external";

interface ExternalServerConfig {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
}

export function DatabaseServerSettings() {
  const { toast } = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error" | "schema_error">("idle");
  const [missingTables, setMissingTables] = useState<string[]>([]);
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);
  const [serverType, setServerType] = useState<ServerType>("supabase");
  const [showPassword, setShowPassword] = useState(false);
  const [externalConfig, setExternalConfig] = useState<ExternalServerConfig>({
    host: "",
    port: "5432",
    database: "",
    username: "",
    password: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load saved config from localStorage on mount
  useEffect(() => {
    const saved = getSavedDbConfig();
    setServerType(saved.activeServer);
    if (saved.externalConfig) {
      setExternalConfig(saved.externalConfig);
    }
  }, []);

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

  const updateExternalConfig = (field: keyof ExternalServerConfig, value: string) => {
    setExternalConfig(prev => ({ ...prev, [field]: value }));
    setConnectionStatus("idle");
  };

  const testConnection = async () => {
    setIsTesting(true);
    setConnectionStatus("idle");

    try {
      if (serverType === "supabase") {
        // Test Supabase connection
        const { error } = await supabase
          .from("app_settings")
          .select("id")
          .limit(1);

        if (error) {
          throw error;
        }
      } else {
        // For external server, validate form fields first
        if (!externalConfig.host || !externalConfig.port || !externalConfig.database || !externalConfig.username) {
          throw new Error("Veuillez remplir tous les champs obligatoires.");
        }
        
        // Call edge function to test real PostgreSQL connection
        const { data, error: fnError } = await supabase.functions.invoke("test-db-connection", {
          body: {
            host: externalConfig.host,
            port: externalConfig.port,
            database: externalConfig.database,
            username: externalConfig.username,
            password: externalConfig.password,
          },
        });

        if (fnError) {
          throw new Error("Erreur lors de l'appel au service de test: " + fnError.message);
        }

        if (!data?.success) {
          throw new Error(data?.error || "Connexion échouée.");
        }

        // Check schema validity
        if (data.schema_valid === false && data.missing_tables?.length > 0) {
          setConnectionStatus("schema_error");
          setMissingTables(data.missing_tables);
          setLastTestTime(new Date());
          toast({
            title: "Serveur OK, BD non conforme",
            description: `Tables manquantes : ${data.missing_tables.join(", ")}`,
            variant: "destructive",
          });
          setIsTesting(false);
          return;
        }

        // Full success
        setMissingTables([]);
        setConnectionStatus("success");
        setLastTestTime(new Date());
        toast({
          title: "Connexion réussie",
          description: `Connecté à ${data.version || "PostgreSQL"}. Toutes les tables requises sont présentes.`,
        });
        setIsTesting(false);
        return;
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

  const handleServerTypeChange = (value: ServerType) => {
    setServerType(value);
    setConnectionStatus("idle");
  };

  const isExternalConfigValid = () => {
    return externalConfig.host && externalConfig.port && externalConfig.database && externalConfig.username;
  };

  const canSave = () => {
    if (serverType === "supabase") return connectionStatus === "success";
    return connectionStatus === "success";
  };

  const saveConfig = () => {
    setIsSaving(true);
    const configToSave: SavedDbConfig = {
      activeServer: serverType,
      externalConfig: serverType === "external" ? {
        host: externalConfig.host,
        port: externalConfig.port,
        database: externalConfig.database,
        username: externalConfig.username,
        // password is intentionally omitted for security
      } as ExternalServerConfig : undefined,
    };
    localStorage.setItem(DB_CONFIG_KEY, JSON.stringify(configToSave));
    
    const serverLabel = serverType === "supabase" 
      ? "Supabase (Lovable Cloud)" 
      : `serveur externe ${externalConfig.host}:${externalConfig.port}/${externalConfig.database}`;
    
    toast({
      title: "Configuration enregistrée",
      description: `L'application est désormais liée au ${serverLabel}.`,
    });
    setIsSaving(false);
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
      case "schema_error":
        return (
          <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-white">
            <Info className="h-3 w-3 mr-1" />
            Serveur OK, BD non conforme
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

        {/* Server Type Selection */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server-type">Type de serveur</Label>
            <Select value={serverType} onValueChange={(value: ServerType) => handleServerTypeChange(value)}>
              <SelectTrigger id="server-type" className="w-full sm:w-[300px]">
                <SelectValue placeholder="Sélectionner le type de serveur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="supabase">Supabase (Lovable Cloud)</SelectItem>
                <SelectItem value="external">Serveur externe (PostgreSQL)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Configuration based on server type */}
        {serverType === "supabase" ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Configuration Supabase</h4>
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
                  La configuration est automatique et sécurisée.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Configuration serveur externe</h4>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Configurez les paramètres de connexion à votre serveur PostgreSQL externe.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ext-host">Hôte du serveur *</Label>
                <Input
                  id="ext-host"
                  type="text"
                  placeholder="exemple.com ou 192.168.1.100"
                  value={externalConfig.host}
                  onChange={(e) => updateExternalConfig("host", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ext-port">Port *</Label>
                <Input
                  id="ext-port"
                  type="text"
                  placeholder="5432"
                  value={externalConfig.port}
                  onChange={(e) => updateExternalConfig("port", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ext-database">Nom de la base de données *</Label>
              <Input
                id="ext-database"
                type="text"
                placeholder="nom_de_la_base"
                value={externalConfig.database}
                onChange={(e) => updateExternalConfig("database", e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ext-username">Nom d'utilisateur *</Label>
                <Input
                  id="ext-username"
                  type="text"
                  placeholder="utilisateur"
                  value={externalConfig.username}
                  onChange={(e) => updateExternalConfig("username", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ext-password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="ext-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={externalConfig.password}
                    onChange={(e) => updateExternalConfig("password", e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
              <div className="flex gap-2">
                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  La connexion à un serveur externe nécessite que le serveur soit accessible depuis Internet 
                  et que les règles de pare-feu autorisent les connexions entrantes.
                </p>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Missing tables alert */}
        {connectionStatus === "schema_error" && missingTables.length > 0 && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Base de données non conforme — {missingTables.length} table{missingTables.length > 1 ? "s" : ""} manquante{missingTables.length > 1 ? "s" : ""}
              </p>
            </div>
            <ul className="ml-7 list-disc text-sm text-amber-700 dark:text-amber-300 space-y-0.5">
              {missingTables.map((t) => (
                <li key={t} className="font-mono">{t}</li>
              ))}
            </ul>
          </div>
        )}

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
            disabled={isTesting || (serverType === "external" && !isExternalConfigValid())}
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
        <Separator />

        {/* Save Button */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Enregistrer la configuration</p>
            <p className="text-sm text-muted-foreground">
              Bascule l'application vers le serveur sélectionné
            </p>
          </div>
          <Button 
            onClick={saveConfig} 
            disabled={!canSave() || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
