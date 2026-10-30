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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_date: string
          id: string
          locale_default: string
          updated_date: string
          virtual_lab_enabled: boolean
        }
        Insert: {
          created_date?: string
          id?: string
          locale_default?: string
          updated_date?: string
          virtual_lab_enabled?: boolean
        }
        Update: {
          created_date?: string
          id?: string
          locale_default?: string
          updated_date?: string
          virtual_lab_enabled?: boolean
        }
        Relationships: []
      }
      experiment_runs: {
        Row: {
          challenge: Json | null
          created_by: string
          created_date: string
          experiment_slug: string | null
          id: string
          notes: string | null
          parameters_json: Json
          results_url: string | null
          samples_count: number
          updated_date: string
        }
        Insert: {
          challenge?: Json | null
          created_by?: string
          created_date?: string
          experiment_slug?: string | null
          id?: string
          notes?: string | null
          parameters_json?: Json
          results_url?: string | null
          samples_count?: number
          updated_date?: string
        }
        Update: {
          challenge?: Json | null
          created_by?: string
          created_date?: string
          experiment_slug?: string | null
          id?: string
          notes?: string | null
          parameters_json?: Json
          results_url?: string | null
          samples_count?: number
          updated_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiment_runs_experiment_slug_fkey"
            columns: ["experiment_slug"]
            isOneToOne: false
            referencedRelation: "experiment_templates"
            referencedColumns: ["slug"]
          },
        ]
      }
      experiment_templates: {
        Row: {
          access_level: string
          category: string | null
          created_by: string | null
          created_date: string
          engine: string | null
          i18n_texts: Json
          id: string
          is_active: boolean
          name: string | null
          outputs: Json
          parameters: Json
          presets: Json
          slug: string
          tags: Json
          thumbnail_url: string | null
          type: string | null
          updated_date: string
          visualization_type: string | null
        }
        Insert: {
          access_level?: string
          category?: string | null
          created_by?: string | null
          created_date?: string
          engine?: string | null
          i18n_texts?: Json
          id?: string
          is_active?: boolean
          name?: string | null
          outputs?: Json
          parameters?: Json
          presets?: Json
          slug: string
          tags?: Json
          thumbnail_url?: string | null
          type?: string | null
          updated_date?: string
          visualization_type?: string | null
        }
        Update: {
          access_level?: string
          category?: string | null
          created_by?: string | null
          created_date?: string
          engine?: string | null
          i18n_texts?: Json
          id?: string
          is_active?: boolean
          name?: string | null
          outputs?: Json
          parameters?: Json
          presets?: Json
          slug?: string
          tags?: Json
          thumbnail_url?: string | null
          type?: string | null
          updated_date?: string
          visualization_type?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_date: string
          email: string | null
          full_name: string | null
          id: string
          locale_preference: string
          role: string
          subscription_tier: string
          updated_date: string
        }
        Insert: {
          created_date?: string
          email?: string | null
          full_name?: string | null
          id: string
          locale_preference?: string
          role?: string
          subscription_tier?: string
          updated_date?: string
        }
        Update: {
          created_date?: string
          email?: string | null
          full_name?: string | null
          id?: string
          locale_preference?: string
          role?: string
          subscription_tier?: string
          updated_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
