import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import spiraleLogo from "@/assets/spirale_rose.png";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  // Fetch app settings
  const { data: appSettings } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>A propos de Plancha</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-4">
          <img src={spiraleLogo} alt="PLANCHA Logo" className="h-24 w-24" />
          
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">
              PLANCHA Projets
            </h2>
            
            <p className="text-sm text-muted-foreground">
              Version {appSettings?.version || 'v1.0'} - Année {appSettings?.update_year || 2025}
            </p>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-foreground">
                Parc National de la Guadeloupe (PNG)
              </p>
              <p className="text-sm text-foreground">
                Service Informatique (SI)
              </p>
              <p className="text-sm font-medium text-foreground">
                Rudy MUSQUET
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
