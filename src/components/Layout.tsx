import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderKanban, Settings, Menu, LogOut, HelpCircle, Download, MessageCircle, Info, Weight } from "lucide-react";
import spiraleLogo from "@/assets/spirale_rose.png";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateUserManualPdf } from "@/utils/generateUserManual";
import { useToast } from "@/hooks/use-toast";
import { AboutDialog } from "@/components/AboutDialog";
import { useIsAdmin } from "@/hooks/useUserRole";
import { PasswordChangeDialog } from "@/components/PasswordChangeDialog";
import { ExpiredProjectsAlert } from "@/components/ExpiredProjectsAlert";
import { User, KeyRound } from "lucide-react";

const navigation = [
  { name: "Tableau de bord", href: "/", icon: LayoutDashboard },
  { name: "Projets", href: "/projects", icon: FolderKanban },
];

const adminNavigation = [
  { name: "Pondérations", href: "/ponderations", icon: Weight },
  { name: "Thèmes", href: "/themes", icon: FolderKanban },
];

const settingsNavigation = [
  { name: "Paramètres", href: "/settings", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const { signOut, user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleDownloadManual = async () => {
    try {
      // Try to download from storage first
      const { data } = await supabase.storage
        .from("user-manual")
        .download("mode-emploi-plancha.pdf");

      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mode-emploi-plancha.pdf";
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // No stored manual, generate default
    }

    // Fallback: generate PDF on the fly
    const blob = generateUserManualPdf();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mode-emploi-plancha.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build complete navigation based on user role
  const completeNavigation = [
    ...navigation,
    ...(isAdmin ? [...adminNavigation, ...settingsNavigation] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center gap-4 px-4 sm:px-6">
          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <nav className="flex flex-col gap-2 mt-8">
                {completeNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
                
                {/* Menu Aide pour mobile */}
                <div className="mt-4 pt-4 border-t">
                  <div className="px-3 py-2 text-sm font-semibold text-foreground">Aide</div>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleDownloadManual();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger le mode d'emploi
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/faq");
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <MessageCircle className="h-4 w-4" />
                    FAQ
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setAboutDialogOpen(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Info className="h-4 w-4" />
                    A propos de Plancha
                  </button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <img src={spiraleLogo} alt="PLANCHA" className="h-8 w-8" />
            <span className="hidden sm:inline-block">PLANCHA Projets</span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex lg:gap-1 lg:ml-8 lg:items-center">
            {completeNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
            
            {/* Menu Aide */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  <HelpCircle className="h-4 w-4" />
                  Aide
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownloadManual}>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger le mode d'emploi
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/faq")}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  FAQ
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAboutDialogOpen(true)}>
                  <Info className="mr-2 h-4 w-4" />
                  A propos de Plancha
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 hidden sm:flex">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setPasswordDialogOpen(true)}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Modifier le mot de passe
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={signOut} title="Se déconnecter" className="sm:hidden">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Expired Projects Alert Banner */}
      <ExpiredProjectsAlert />

      {/* Main content */}
      <main className="container px-4 sm:px-6 py-6">{children}</main>
      
      {/* About Dialog */}
      <AboutDialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen} />
      
      {/* Password Change Dialog */}
      <PasswordChangeDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
    </div>
  );
}
