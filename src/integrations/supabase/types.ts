export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      campaign_type: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          amount_raised: number | null
          campaign_type_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          goal_amount: number | null
          group_id: string | null
          id: string
          name: string
          start_date: string | null
          status: boolean | null
          updated_at: string
        }
        Insert: {
          amount_raised?: number | null
          campaign_type_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          goal_amount?: number | null
          group_id?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: boolean | null
          updated_at?: string
        }
        Update: {
          amount_raised?: number | null
          campaign_type_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          goal_amount?: number | null
          group_id?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_campaign_type_id_fkey"
            columns: ["campaign_type_id"]
            isOneToOne: false
            referencedRelation: "campaign_type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      counties: {
        Row: {
          county_name: string
          created_at: string
          id: string
          state: string
          updated_at: string
        }
        Insert: {
          county_name: string
          created_at?: string
          id?: string
          state: string
          updated_at?: string
        }
        Update: {
          county_name?: string
          created_at?: string
          id?: string
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_type: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          created_at: string
          group_name: string
          group_type_id: string | null
          id: string
          logo_url: string | null
          school_id: string | null
          status: boolean | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          group_name: string
          group_type_id?: string | null
          id?: string
          logo_url?: string | null
          school_id?: string | null
          status?: boolean | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          group_name?: string
          group_type_id?: string | null
          id?: string
          logo_url?: string | null
          school_id?: string | null
          status?: boolean | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "groups_group_type_id_fkey"
            columns: ["group_type_id"]
            isOneToOne: false
            referencedRelation: "group_type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      locale: {
        Row: {
          created_at: string
          id: string
          locale_code: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          locale_code: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          locale_code?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          school_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rosters: {
        Row: {
          created_at: string
          current_roster: boolean | null
          group_id: string | null
          id: number
          roster_year: number | null
        }
        Insert: {
          created_at?: string
          current_roster?: boolean | null
          group_id?: string | null
          id?: number
          roster_year?: number | null
        }
        Update: {
          created_at?: string
          current_roster?: boolean | null
          group_id?: string | null
          id?: number
          roster_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Rosters_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      school_districts: {
        Row: {
          created_at: string
          id: string
          name: string
          nces_district_id: string | null
          state_district_id: string | null
          state_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          nces_district_id?: string | null
          state_district_id?: string | null
          state_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          nces_district_id?: string | null
          state_district_id?: string | null
          state_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_districts_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      school_type: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      school_user: {
        Row: {
          active_user: boolean
          created_at: string
          group_id: string | null
          id: string
          roster_id: number | null
          school_id: string
          updated_at: string
          user_id: string
          user_type_id: string
        }
        Insert: {
          active_user?: boolean
          created_at?: string
          group_id?: string | null
          id?: string
          roster_id?: number | null
          school_id: string
          updated_at?: string
          user_id: string
          user_type_id: string
        }
        Update: {
          active_user?: boolean
          created_at?: string
          group_id?: string | null
          id?: string
          roster_id?: number | null
          school_id?: string
          updated_at?: string
          user_id?: string
          user_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_user_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_user_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "rosters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_user_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_user_user_type_id_fkey"
            columns: ["user_type_id"]
            isOneToOne: false
            referencedRelation: "user_type"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          Charter: boolean | null
          city: string
          county_id: string | null
          county_name: string | null
          created_at: string
          directly_certified: number | null
          district_name: string | null
          free_lunch: number | null
          high_grade: string | null
          id: string
          locale: string | null
          locale_id: string | null
          logo_file: string | null
          low_grade: string | null
          NCES_School_ID: string | null
          phone: string | null
          reduced_lunch: number | null
          school_district_id: string | null
          school_name: string
          school_type: string | null
          school_type_id: string | null
          state: string | null
          state_id: number | null
          state_school_ID: string | null
          status: string | null
          street_address: string | null
          student_teacher_ratio: string | null
          students: number | null
          teachers: number | null
          updated_at: string
          zip: string | null
          zip_4_digit: number | null
        }
        Insert: {
          Charter?: boolean | null
          city: string
          county_id?: string | null
          county_name?: string | null
          created_at?: string
          directly_certified?: number | null
          district_name?: string | null
          free_lunch?: number | null
          high_grade?: string | null
          id?: string
          locale?: string | null
          locale_id?: string | null
          logo_file?: string | null
          low_grade?: string | null
          NCES_School_ID?: string | null
          phone?: string | null
          reduced_lunch?: number | null
          school_district_id?: string | null
          school_name: string
          school_type?: string | null
          school_type_id?: string | null
          state?: string | null
          state_id?: number | null
          state_school_ID?: string | null
          status?: string | null
          street_address?: string | null
          student_teacher_ratio?: string | null
          students?: number | null
          teachers?: number | null
          updated_at?: string
          zip?: string | null
          zip_4_digit?: number | null
        }
        Update: {
          Charter?: boolean | null
          city?: string
          county_id?: string | null
          county_name?: string | null
          created_at?: string
          directly_certified?: number | null
          district_name?: string | null
          free_lunch?: number | null
          high_grade?: string | null
          id?: string
          locale?: string | null
          locale_id?: string | null
          logo_file?: string | null
          low_grade?: string | null
          NCES_School_ID?: string | null
          phone?: string | null
          reduced_lunch?: number | null
          school_district_id?: string | null
          school_name?: string
          school_type?: string | null
          school_type_id?: string | null
          state?: string | null
          state_id?: number | null
          state_school_ID?: string | null
          status?: string | null
          street_address?: string | null
          student_teacher_ratio?: string | null
          students?: number | null
          teachers?: number | null
          updated_at?: string
          zip?: string | null
          zip_4_digit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_locale_id_fkey"
            columns: ["locale_id"]
            isOneToOne: false
            referencedRelation: "locale"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_school_district_id_fkey"
            columns: ["school_district_id"]
            isOneToOne: false
            referencedRelation: "school_districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_school_type_id_fkey"
            columns: ["school_type_id"]
            isOneToOne: false
            referencedRelation: "school_type"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      states: {
        Row: {
          abbreviation: string | null
          created_at: string
          id: number
          name: string | null
        }
        Insert: {
          abbreviation?: string | null
          created_at?: string
          id?: number
          name?: string | null
        }
        Update: {
          abbreviation?: string | null
          created_at?: string
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      user_type: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_update_school_user: {
        Args: { target_school_user_id: string }
        Returns: boolean
      }
      user_belongs_to_school: {
        Args: { user_id: string; school_id: string }
        Returns: boolean
      }
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
    Enums: {},
  },
} as const
