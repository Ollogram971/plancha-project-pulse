export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          id: string
          update_year: number
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          update_year?: number
          updated_at?: string
          version?: string
        }
        Update: {
          created_at?: string
          id?: string
          update_year?: number
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      attachments: {
        Row: {
          created_at: string
          id: string
          nom_fichier: string
          project_id: string
          taille: number | null
          type: string | null
          url_stockage: string
        }
        Insert: {
          created_at?: string
          id?: string
          nom_fichier: string
          project_id: string
          taille?: number | null
          type?: string | null
          url_stockage: string
        }
        Update: {
          created_at?: string
          id?: string
          nom_fichier?: string
          project_id?: string
          taille?: number | null
          type?: string | null
          url_stockage?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          author_id: string | null
          created_at: string
          diff_json: Json | null
          entite: string
          entite_id: string
          id: string
        }
        Insert: {
          action: string
          author_id?: string | null
          created_at?: string
          diff_json?: Json | null
          entite: string
          entite_id: string
          id?: string
        }
        Update: {
          action?: string
          author_id?: string | null
          created_at?: string
          diff_json?: Json | null
          entite?: string
          entite_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          created_at: string
          id: string
          message: string
          project_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          message: string
          project_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          message?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      criteria: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          libelle: string
          ordre: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          libelle: string
          ordre: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          libelle?: string
          ordre?: number
        }
        Relationships: []
      }
      criterion_scales: {
        Row: {
          created_at: string
          criterion_id: string
          description: string
          id: string
          score_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          criterion_id: string
          description: string
          id?: string
          score_value: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          criterion_id?: string
          description?: string
          id?: string
          score_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "criterion_scales_criterion_id_fkey"
            columns: ["criterion_id"]
            isOneToOne: false
            referencedRelation: "criteria"
            referencedColumns: ["id"]
          },
        ]
      }
      poles: {
        Row: {
          code: string
          created_at: string
          id: string
          libelle: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          libelle: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          libelle?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_themes: {
        Row: {
          created_at: string
          id: string
          project_id: string
          theme_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          theme_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_themes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_themes_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          avancement: number | null
          budget_acquis: number | null
          budget_total: number | null
          chef_projet_id: string | null
          code: string
          created_at: string
          created_by: string | null
          date_demarrage: string | null
          date_fin: string | null
          date_previsionnelle_debut: string | null
          date_saisie: string
          description: string | null
          faisabilite: Database["public"]["Enums"]["feasibility_level"] | null
          financement_statut:
            | Database["public"]["Enums"]["financing_status"]
            | null
          id: string
          liens: string[] | null
          partenaires: string[] | null
          pole_id: string
          rang: number | null
          risques: string | null
          score_total: number | null
          statut: Database["public"]["Enums"]["project_status"]
          titre: string
          updated_at: string
        }
        Insert: {
          avancement?: number | null
          budget_acquis?: number | null
          budget_total?: number | null
          chef_projet_id?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          date_demarrage?: string | null
          date_fin?: string | null
          date_previsionnelle_debut?: string | null
          date_saisie?: string
          description?: string | null
          faisabilite?: Database["public"]["Enums"]["feasibility_level"] | null
          financement_statut?:
            | Database["public"]["Enums"]["financing_status"]
            | null
          id?: string
          liens?: string[] | null
          partenaires?: string[] | null
          pole_id: string
          rang?: number | null
          risques?: string | null
          score_total?: number | null
          statut?: Database["public"]["Enums"]["project_status"]
          titre: string
          updated_at?: string
        }
        Update: {
          avancement?: number | null
          budget_acquis?: number | null
          budget_total?: number | null
          chef_projet_id?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          date_demarrage?: string | null
          date_fin?: string | null
          date_previsionnelle_debut?: string | null
          date_saisie?: string
          description?: string | null
          faisabilite?: Database["public"]["Enums"]["feasibility_level"] | null
          financement_statut?:
            | Database["public"]["Enums"]["financing_status"]
            | null
          id?: string
          liens?: string[] | null
          partenaires?: string[] | null
          pole_id?: string
          rang?: number | null
          risques?: string | null
          score_total?: number | null
          statut?: Database["public"]["Enums"]["project_status"]
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_chef_projet_id_fkey"
            columns: ["chef_projet_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_chef_projet_id_fkey"
            columns: ["chef_projet_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_pole_id_fkey"
            columns: ["pole_id"]
            isOneToOne: false
            referencedRelation: "poles"
            referencedColumns: ["id"]
          },
        ]
      }
      scores_calculated: {
        Row: {
          created_at: string
          details_json: Json | null
          id: string
          profile_id: string
          project_id: string
          rang: number | null
          score_pondere: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          details_json?: Json | null
          id?: string
          profile_id: string
          project_id: string
          rang?: number | null
          score_pondere: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          details_json?: Json | null
          id?: string
          profile_id?: string
          project_id?: string
          rang?: number | null
          score_pondere?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scores_calculated_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "weight_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_calculated_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      scores_raw: {
        Row: {
          commentaire: string | null
          created_at: string
          criterion_id: string
          id: string
          project_id: string
          score_0_4: number
          source: string | null
          updated_at: string
          version: number | null
        }
        Insert: {
          commentaire?: string | null
          created_at?: string
          criterion_id: string
          id?: string
          project_id: string
          score_0_4: number
          source?: string | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          commentaire?: string | null
          created_at?: string
          criterion_id?: string
          id?: string
          project_id?: string
          score_0_4?: number
          source?: string | null
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scores_raw_criterion_id_fkey"
            columns: ["criterion_id"]
            isOneToOne: false
            referencedRelation: "criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_raw_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      themes: {
        Row: {
          code: string
          created_at: string
          famille: string | null
          id: string
          libelle: string
        }
        Insert: {
          code: string
          created_at?: string
          famille?: string | null
          id?: string
          libelle: string
        }
        Update: {
          code?: string
          created_at?: string
          famille?: string | null
          id?: string
          libelle?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weight_profiles: {
        Row: {
          actif: boolean
          created_at: string
          description: string | null
          id: string
          nom: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          description?: string | null
          id?: string
          nom: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
          updated_at?: string
        }
        Relationships: []
      }
      weights: {
        Row: {
          created_at: string
          criterion_id: string
          id: string
          poids_percent: number
          profile_id: string
        }
        Insert: {
          created_at?: string
          criterion_id: string
          id?: string
          poids_percent: number
          profile_id: string
        }
        Update: {
          created_at?: string
          criterion_id?: string
          id?: string
          poids_percent?: number
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weights_criterion_id_fkey"
            columns: ["criterion_id"]
            isOneToOne: false
            referencedRelation: "criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weights_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "weight_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      users_with_roles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          role: Database["public"]["Enums"]["app_role"] | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          role?: never
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          role?: never
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "contributeur" | "lecteur"
      feasibility_level: "bloquant" | "mitige" | "bon" | "optimal"
      financing_status:
        | "aucun"
        | "recherche_financement"
        | "partiel"
        | "complet"
      project_status: "a_valider" | "en_cours" | "archive"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "contributeur", "lecteur"],
      feasibility_level: ["bloquant", "mitige", "bon", "optimal"],
      financing_status: [
        "aucun",
        "recherche_financement",
        "partiel",
        "complet",
      ],
      project_status: ["a_valider", "en_cours", "archive"],
    },
  },
} as const
