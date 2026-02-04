import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";

export function ExpiredProjectsAlert() {
  const [isDismissed, setIsDismissed] = useState(false);
  const { data: role } = useUserRole();

  // Only show to admin and validateur roles
  const canViewAlert = role === "admin" || role === "validateur";

  // Fetch expired projects that are still "en_cours"
  const { data: expiredProjects } = useQuery({
    queryKey: ["expired-projects"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("projects")
        .select("id, code, titre")
        .eq("statut", "en_cours")
        .lt("date_fin", today)
        .not("date_fin", "is", null)
        .order("date_fin", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: canViewAlert && !isDismissed,
  });

  // Reset dismissed state when session changes (new login)
  useEffect(() => {
    const sessionKey = "expiredProjectsAlertDismissed";
    const dismissed = sessionStorage.getItem(sessionKey);
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("expiredProjectsAlertDismissed", "true");
  };

  // Don't render if not authorized, dismissed, or no expired projects
  if (!canViewAlert || isDismissed || !expiredProjects || expiredProjects.length === 0) {
    return null;
  }

  return (
    <div className="bg-destructive text-destructive-foreground border-b border-destructive/20">
      <div className="container px-4 sm:px-6 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm mb-2">
              {expiredProjects.length === 1
                ? "1 projet a dépassé sa date de fin et est toujours en cours :"
                : `${expiredProjects.length} projets ont dépassé leur date de fin et sont toujours en cours :`}
            </p>
            <div className="flex flex-wrap gap-2">
              {expiredProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="inline-flex items-center px-2.5 py-1 rounded-md bg-destructive-foreground/10 hover:bg-destructive-foreground/20 text-sm font-medium transition-colors underline-offset-2 hover:underline"
                  title={project.titre}
                >
                  {project.code}
                </Link>
              ))}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8 text-destructive-foreground hover:bg-destructive-foreground/10"
            onClick={handleDismiss}
            aria-label="Fermer l'alerte"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
