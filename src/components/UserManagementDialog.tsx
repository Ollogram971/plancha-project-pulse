import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, UserPlus, Pencil, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "admin" | "validateur" | "contributeur" | "lecteur";

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole | null;
}

export function UserManagementDialog() {
  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("lecteur");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: users, isLoading } = useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users_with_roles")
        .select("*")
        .order("email");
      if (error) throw error;
      return data as UserWithRole[];
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      toast({ title: "Rôle mis à jour", description: "Le rôle de l'utilisateur a été modifié avec succès." });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le rôle.", variant: "destructive" });
      console.error("Error updating role:", error);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, fullName, email }: { userId: string; fullName: string; email: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, email })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      setEditingUserId(null);
      toast({ title: "Profil mis à jour", description: "Le nom et l'email ont été modifiés avec succès." });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le profil.", variant: "destructive" });
      console.error("Error updating profile:", error);
    },
  });

  const handleDeleteUser = (userId: string, userRole: AppRole | null) => {
    if (user?.id === userId) {
      toast({ title: "Action non autorisée", description: "Vous ne pouvez pas supprimer votre propre compte.", variant: "destructive" });
      return;
    }
    if (userRole === "admin") {
      const adminCount = users?.filter(u => u.role === "admin").length || 0;
      if (adminCount <= 1) {
        toast({ title: "Action non autorisée", description: "Il doit rester au moins un compte administrateur dans le système.", variant: "destructive" });
        return;
      }
    }
    deleteUserMutation.mutate(userId);
  };

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("delete-user", { body: { userId } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      toast({ title: "Utilisateur supprimé", description: "L'utilisateur a été retiré avec succès." });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: "Impossible de supprimer l'utilisateur.", variant: "destructive" });
      console.error("Error deleting user:", error);
    },
  });

  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role, full_name }: { email: string; role: AppRole; full_name: string }) => {
      const { data, error } = await supabase.functions.invoke("invite-user", {
        body: { email, role, full_name },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-with-roles"] });
      setInviteEmail("");
      setInviteName("");
      setInviteRole("lecteur");
      toast({ title: "Invitation envoyée", description: "L'utilisateur recevra un email pour créer son compte." });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: "Impossible d'inviter l'utilisateur. Vérifiez les informations et réessayez.", variant: "destructive" });
      console.error("Error inviting user:", error);
    },
  });

  const handleInviteUser = () => {
    if (!inviteName.trim()) {
      toast({ title: "Nom requis", description: "Veuillez entrer le nom de l'utilisateur.", variant: "destructive" });
      return;
    }
    if (!inviteEmail) {
      toast({ title: "Email requis", description: "Veuillez entrer une adresse email valide.", variant: "destructive" });
      return;
    }
    inviteUserMutation.mutate({ email: inviteEmail, role: inviteRole, full_name: inviteName });
  };

  const startEditing = (u: UserWithRole) => {
    setEditingUserId(u.id);
    setEditName(u.full_name || "");
    setEditEmail(u.email || "");
  };

  const cancelEditing = () => {
    setEditingUserId(null);
  };

  const saveEditing = (userId: string) => {
    if (!editName.trim()) {
      toast({ title: "Nom requis", description: "Le nom ne peut pas être vide.", variant: "destructive" });
      return;
    }
    if (!editEmail.trim()) {
      toast({ title: "Email requis", description: "L'email ne peut pas être vide.", variant: "destructive" });
      return;
    }
    updateProfileMutation.mutate({ userId, fullName: editName.trim(), email: editEmail.trim() });
  };

  const getRoleBadgeVariant = (role: AppRole | null) => {
    switch (role) {
      case "admin": return "default";
      case "validateur": return "default";
      case "contributeur": return "secondary";
      case "lecteur": return "outline";
      default: return "outline";
    }
  };

  const getRoleLabel = (role: AppRole | null) => {
    switch (role) {
      case "admin": return "Administrateur";
      case "validateur": return "Validateur";
      case "contributeur": return "Contributeur";
      case "lecteur": return "Lecteur";
      default: return "Aucun rôle";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Configurer les utilisateurs</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestion des utilisateurs</DialogTitle>
          <DialogDescription>
            Gérez les accès et les rôles des utilisateurs de l'application PLANCHA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invite new user section */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Inviter un nouvel utilisateur
            </h3>
            <div className="grid gap-4 sm:grid-cols-[1fr,1fr,auto,auto]">
              <div className="space-y-2">
                <Label htmlFor="invite-name">Nom <span className="text-destructive">*</span></Label>
                <Input
                  id="invite-name"
                  type="text"
                  placeholder="Prénom NOM"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email <span className="text-destructive">*</span></Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="utilisateur@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Rôle</Label>
                <Select value={inviteRole} onValueChange={(value: AppRole) => setInviteRole(value)}>
                  <SelectTrigger id="invite-role" className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lecteur">Lecteur</SelectItem>
                    <SelectItem value="contributeur">Contributeur</SelectItem>
                    <SelectItem value="validateur">Validateur</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleInviteUser}
                  disabled={inviteUserMutation.isPending}
                >
                  {inviteUserMutation.isPending ? "Envoi..." : "Inviter"}
                </Button>
              </div>
            </div>
          </div>

          {/* Users table */}
          <div>
            <h3 className="text-sm font-medium mb-4">Utilisateurs actuels</h3>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {editingUserId === u.id ? (
                            <Input
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            u.email
                          )}
                        </TableCell>
                        <TableCell>
                          {editingUserId === u.id ? (
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            u.full_name || "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={u.role || "lecteur"}
                            onValueChange={(value: AppRole) =>
                              updateRoleMutation.mutate({ userId: u.id, newRole: value })
                            }
                          >
                            <SelectTrigger className="w-[160px]">
                              <Badge variant={getRoleBadgeVariant(u.role)}>
                                {getRoleLabel(u.role)}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="lecteur">Lecteur</SelectItem>
                              <SelectItem value="contributeur">Contributeur</SelectItem>
                              <SelectItem value="validateur">Validateur</SelectItem>
                              <SelectItem value="admin">Administrateur</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {editingUserId === u.id ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => saveEditing(u.id)}
                                  disabled={updateProfileMutation.isPending}
                                >
                                  <Check className="h-4 w-4 text-primary" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={cancelEditing}
                                >
                                  <X className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => startEditing(u)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteUser(u.id, u.role)}
                                  disabled={deleteUserMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {users?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Aucun utilisateur trouvé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Administrateur:</strong> Contrôle total sur tous les modules, paramètres, utilisateurs, pondérations, imports/exports</p>
            <p><strong>Validateur:</strong> Mêmes droits que Contributeur + validation des projets (statut "En cours")</p>
            <p><strong>Contributeur:</strong> Création/édition de projets, métadonnées, scores, pièces jointes</p>
            <p><strong>Lecteur:</strong> Accès en lecture seule aux classements, tableaux de bord, rapports</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
