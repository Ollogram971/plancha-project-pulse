import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Settings2, Users, Weight, Database } from "lucide-react";
import { UserManagementDialog } from "@/components/UserManagementDialog";

export default function Settings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground mt-2">
          Configuration de l'application PLANCHA
        </p>
      </div>

      {/* Settings sections */}
      <div className="grid gap-6">
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="align">Alignement PNG</Label>
                <div className="flex gap-2">
                  <Input id="align" type="number" defaultValue={20} />
                  <span className="flex items-center text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="strategic">Intérêt stratégique</Label>
                <div className="flex gap-2">
                  <Input id="strategic" type="number" defaultValue={15} />
                  <span className="flex items-center text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emblematic">Emblématique</Label>
                <div className="flex gap-2">
                  <Input id="emblematic" type="number" defaultValue={10} />
                  <span className="flex items-center text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="structural">Structurant</Label>
                <div className="flex gap-2">
                  <Input id="structural" type="number" defaultValue={20} />
                  <span className="flex items-center text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="progress">Avancement</Label>
                <div className="flex gap-2">
                  <Input id="progress" type="number" defaultValue={10} />
                  <span className="flex items-center text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="financing">Financement</Label>
                <div className="flex gap-2">
                  <Input id="financing" type="number" defaultValue={15} />
                  <span className="flex items-center text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feasibility">Faisabilité</Label>
                <div className="flex gap-2">
                  <Input id="feasibility" type="number" defaultValue={10} />
                  <span className="flex items-center text-muted-foreground">%</span>
                </div>
              </div>
              <div className="space-y-2 flex items-end">
                <div className="flex-1 p-3 rounded-md bg-muted">
                  <p className="text-sm font-medium">Total: 100%</p>
                  <p className="text-xs text-muted-foreground">Profil: Standard PNG</p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button>Enregistrer les pondérations</Button>
              <Button variant="outline">Créer un nouveau profil</Button>
            </div>
          </CardContent>
        </Card>

        {/* Users management */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Gestion des utilisateurs</CardTitle>
            </div>
            <CardDescription>
              Gérer les accès et les rôles (Administrateur, Contributeur, Lecteur)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Invitez des utilisateurs et gérez leurs rôles d'accès à l'application.
            </p>
            <UserManagementDialog />
          </CardContent>
        </Card>

        {/* Import/Export */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Import / Export</CardTitle>
            </div>
            <CardDescription>
              Importer et exporter les données de projets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline">Importer ODS/Excel</Button>
                <Button variant="outline">Exporter vers Excel</Button>
                <Button variant="outline">Exporter PDF</Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Formats supportés: ODS, XLSX, CSV, PDF
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
