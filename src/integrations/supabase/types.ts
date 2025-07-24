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
          locale_id: string | null
          logo_file: string | null
          low_grade: string | null
          NCES_School_ID: string | null
          phone: string | null
          reduced_lunch: number | null
          school_district_id: string | null
          school_name: string
          school_type_id: string | null
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
          locale_id?: string | null
          logo_file?: string | null
          low_grade?: string | null
          NCES_School_ID?: string | null
          phone?: string | null
          reduced_lunch?: number | null
          school_district_id?: string | null
          school_name: string
          school_type_id?: string | null
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
          locale_id?: string | null
          logo_file?: string | null
          low_grade?: string | null
          NCES_School_ID?: string | null
          phone?: string | null
          reduced_lunch?: number | null
          school_district_id?: string | null
          school_name?: string
          school_type_id?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
