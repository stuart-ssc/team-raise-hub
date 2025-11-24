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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      business_donors: {
        Row: {
          auto_linked: boolean | null
          blocked_at: string | null
          blocked_by: string | null
          business_id: string
          created_at: string | null
          donor_id: string
          id: string
          is_primary_contact: boolean | null
          linked_at: string | null
          organization_id: string
          role: string | null
        }
        Insert: {
          auto_linked?: boolean | null
          blocked_at?: string | null
          blocked_by?: string | null
          business_id: string
          created_at?: string | null
          donor_id: string
          id?: string
          is_primary_contact?: boolean | null
          linked_at?: string | null
          organization_id: string
          role?: string | null
        }
        Update: {
          auto_linked?: boolean | null
          blocked_at?: string | null
          blocked_by?: string | null
          business_id?: string
          created_at?: string | null
          donor_id?: string
          id?: string
          is_primary_contact?: boolean | null
          linked_at?: string | null
          organization_id?: string
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_donors_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_donors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_update_notifications: {
        Row: {
          business_id: string
          changes: Json
          created_at: string | null
          id: string
          notification_sent: boolean | null
          updated_by: string
        }
        Insert: {
          business_id: string
          changes: Json
          created_at?: string | null
          id?: string
          notification_sent?: boolean | null
          updated_by: string
        }
        Update: {
          business_id?: string
          changes?: Json
          created_at?: string | null
          id?: string
          notification_sent?: boolean | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_update_notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          business_email: string | null
          business_name: string
          business_phone: string | null
          city: string | null
          country: string | null
          created_at: string | null
          ein: string | null
          id: string
          industry: string | null
          logo_url: string | null
          state: string | null
          updated_at: string | null
          verification_status: string | null
          verification_submitted_at: string | null
          verified_at: string | null
          website_url: string | null
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          business_email?: string | null
          business_name: string
          business_phone?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          ein?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          state?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verification_submitted_at?: string | null
          verified_at?: string | null
          website_url?: string | null
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          business_email?: string | null
          business_name?: string
          business_phone?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          ein?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          state?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verification_submitted_at?: string | null
          verified_at?: string | null
          website_url?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      campaign_custom_fields: {
        Row: {
          campaign_id: string
          created_at: string | null
          display_order: number | null
          field_name: string
          field_options: Json | null
          field_type: string
          help_text: string | null
          id: string
          is_required: boolean | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          display_order?: number | null
          field_name: string
          field_options?: Json | null
          field_type: string
          help_text?: string | null
          id?: string
          is_required?: boolean | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          display_order?: number | null
          field_name?: string
          field_options?: Json | null
          field_type?: string
          help_text?: string | null
          id?: string
          is_required?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_custom_fields_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_items: {
        Row: {
          campaign_id: string
          cost: number | null
          created_at: string
          description: string | null
          event_end_date: string | null
          event_start_date: string | null
          id: string
          image: string | null
          max_items_purchased: number | null
          name: string
          quantity_available: number | null
          quantity_offered: number | null
          size: string | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          cost?: number | null
          created_at?: string
          description?: string | null
          event_end_date?: string | null
          event_start_date?: string | null
          id?: string
          image?: string | null
          max_items_purchased?: number | null
          name: string
          quantity_available?: number | null
          quantity_offered?: number | null
          size?: string | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          cost?: number | null
          created_at?: string
          description?: string | null
          event_end_date?: string | null
          event_start_date?: string | null
          id?: string
          image?: string | null
          max_items_purchased?: number | null
          name?: string
          quantity_available?: number | null
          quantity_offered?: number | null
          size?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_campaign_items_campaign_id"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
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
      campaign_views: {
        Row: {
          campaign_id: string
          created_at: string | null
          donor_email: string
          id: string
          referrer: string | null
          user_agent: string | null
          viewed_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          donor_email: string
          id?: string
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          donor_email?: string
          id?: string
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_views_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          amount_raised: number | null
          campaign_type_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          file_upload_deadline_days: number | null
          goal_amount: number | null
          group_id: string | null
          id: string
          image_url: string | null
          name: string
          publication_status: string | null
          requires_business_info: boolean | null
          slug: string | null
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
          file_upload_deadline_days?: number | null
          goal_amount?: number | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          publication_status?: string | null
          requires_business_info?: boolean | null
          slug?: string | null
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
          file_upload_deadline_days?: number | null
          goal_amount?: number | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          publication_status?: string | null
          requires_business_info?: boolean | null
          slug?: string | null
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
      custom_email_layout_versions: {
        Row: {
          blocks: Json
          change_description: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          layout_id: string
          name: string
          preview_color: string | null
          version_number: number
        }
        Insert: {
          blocks?: Json
          change_description?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          layout_id: string
          name: string
          preview_color?: string | null
          version_number: number
        }
        Update: {
          blocks?: Json
          change_description?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          layout_id?: string
          name?: string
          preview_color?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "custom_email_layout_versions_layout_id_fkey"
            columns: ["layout_id"]
            isOneToOne: false
            referencedRelation: "custom_email_layouts"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_email_layouts: {
        Row: {
          blocks: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          preview_color: string | null
          updated_at: string | null
        }
        Insert: {
          blocks?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          preview_color?: string | null
          updated_at?: string | null
        }
        Update: {
          blocks?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          preview_color?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_email_layouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_activity_log: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string | null
          donor_id: string
          id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string | null
          donor_id: string
          id?: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string | null
          donor_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "donor_activity_log_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_insights: {
        Row: {
          created_at: string | null
          donor_id: string
          generated_at: string | null
          id: string
          insights: Json
          optimal_contact_date: string | null
          organization_id: string
          priority_score: number
          retention_risk_level: string | null
          suggested_ask_amount: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          donor_id: string
          generated_at?: string | null
          id?: string
          insights?: Json
          optimal_contact_date?: string | null
          organization_id: string
          priority_score?: number
          retention_risk_level?: string | null
          suggested_ask_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          donor_id?: string
          generated_at?: string | null
          id?: string
          insights?: Json
          optimal_contact_date?: string | null
          organization_id?: string
          priority_score?: number
          retention_risk_level?: string | null
          suggested_ask_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donor_insights_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: true
            referencedRelation: "donor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_insights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_profiles: {
        Row: {
          created_at: string | null
          donation_count: number | null
          email: string
          engagement_score: number | null
          first_donation_date: string | null
          first_name: string | null
          id: string
          last_donation_date: string | null
          last_name: string | null
          lifetime_value: number | null
          notes: string | null
          organization_id: string
          phone: string | null
          preferred_communication: string | null
          rfm_frequency_score: number | null
          rfm_monetary_score: number | null
          rfm_recency_score: number | null
          rfm_segment: string | null
          segment_updated_at: string | null
          tags: string[] | null
          total_donations: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          donation_count?: number | null
          email: string
          engagement_score?: number | null
          first_donation_date?: string | null
          first_name?: string | null
          id?: string
          last_donation_date?: string | null
          last_name?: string | null
          lifetime_value?: number | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          preferred_communication?: string | null
          rfm_frequency_score?: number | null
          rfm_monetary_score?: number | null
          rfm_recency_score?: number | null
          rfm_segment?: string | null
          segment_updated_at?: string | null
          tags?: string[] | null
          total_donations?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          donation_count?: number | null
          email?: string
          engagement_score?: number | null
          first_donation_date?: string | null
          first_name?: string | null
          id?: string
          last_donation_date?: string | null
          last_name?: string | null
          lifetime_value?: number | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          preferred_communication?: string | null
          rfm_frequency_score?: number | null
          rfm_monetary_score?: number | null
          rfm_recency_score?: number | null
          rfm_segment?: string | null
          segment_updated_at?: string | null
          tags?: string[] | null
          total_donations?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donor_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_segment_campaigns: {
        Row: {
          campaign_name: string
          clicked_count: number | null
          created_at: string | null
          created_by: string | null
          email_content: string
          id: string
          opened_count: number | null
          segment_id: string | null
          sent_at: string | null
          sent_count: number | null
          subject_line: string
        }
        Insert: {
          campaign_name: string
          clicked_count?: number | null
          created_at?: string | null
          created_by?: string | null
          email_content: string
          id?: string
          opened_count?: number | null
          segment_id?: string | null
          sent_at?: string | null
          sent_count?: number | null
          subject_line: string
        }
        Update: {
          campaign_name?: string
          clicked_count?: number | null
          created_at?: string | null
          created_by?: string | null
          email_content?: string
          id?: string
          opened_count?: number | null
          segment_id?: string | null
          sent_at?: string | null
          sent_count?: number | null
          subject_line?: string
        }
        Relationships: [
          {
            foreignKeyName: "donor_segment_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_segment_campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "donor_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_segments: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          filters: Json
          id: string
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          filters?: Json
          id?: string
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          filters?: Json
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donor_segments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_segments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_ab_results: {
        Row: {
          created_at: string | null
          email_log_id: string
          id: string
          test_id: string
          variant_id: string
        }
        Insert: {
          created_at?: string | null
          email_log_id: string
          id?: string
          test_id: string
          variant_id: string
        }
        Update: {
          created_at?: string | null
          email_log_id?: string
          id?: string
          test_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_ab_results_email_log_id_fkey"
            columns: ["email_log_id"]
            isOneToOne: true
            referencedRelation: "email_delivery_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_ab_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "email_ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_ab_results_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "email_ab_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_ab_tests: {
        Row: {
          created_at: string | null
          description: string | null
          email_type: string
          end_date: string | null
          id: string
          minimum_sample_size: number
          name: string
          start_date: string | null
          status: string
          updated_at: string | null
          winner_variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          email_type?: string
          end_date?: string | null
          id?: string
          minimum_sample_size?: number
          name: string
          start_date?: string | null
          status?: string
          updated_at?: string | null
          winner_variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          email_type?: string
          end_date?: string | null
          id?: string
          minimum_sample_size?: number
          name?: string
          start_date?: string | null
          status?: string
          updated_at?: string | null
          winner_variant_id?: string | null
        }
        Relationships: []
      }
      email_ab_variants: {
        Row: {
          created_at: string | null
          id: string
          is_control: boolean | null
          name: string
          split_percentage: number | null
          subject_line: string
          template_data: Json | null
          test_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_control?: boolean | null
          name: string
          split_percentage?: number | null
          subject_line: string
          template_data?: Json | null
          test_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_control?: boolean | null
          name?: string
          split_percentage?: number | null
          subject_line?: string
          template_data?: Json | null
          test_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_ab_variants_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "email_ab_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      email_delivery_log: {
        Row: {
          bounced_at: string | null
          clicked_at: string | null
          created_at: string | null
          email_type: string
          error_message: string | null
          id: string
          last_retry_at: string | null
          max_retries: number | null
          metadata: Json | null
          next_retry_at: string | null
          opened_at: string | null
          recipient_email: string
          recipient_name: string | null
          resend_email_id: string | null
          retry_count: number | null
          retry_eligible: boolean | null
          sent_at: string | null
          status: string
          updated_at: string | null
          year: number | null
        }
        Insert: {
          bounced_at?: string | null
          clicked_at?: string | null
          created_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          max_retries?: number | null
          metadata?: Json | null
          next_retry_at?: string | null
          opened_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          resend_email_id?: string | null
          retry_count?: number | null
          retry_eligible?: boolean | null
          sent_at?: string | null
          status?: string
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          bounced_at?: string | null
          clicked_at?: string | null
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          max_retries?: number | null
          metadata?: Json | null
          next_retry_at?: string | null
          opened_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          resend_email_id?: string | null
          retry_count?: number | null
          retry_eligible?: boolean | null
          sent_at?: string | null
          status?: string
          updated_at?: string | null
          year?: number | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          campaign_type: string
          created_at: string | null
          description: string | null
          email_content: string
          id: string
          name: string
          recommended_delay_hours: number
          sequence_order: number
          subject_line: string
          updated_at: string | null
        }
        Insert: {
          campaign_type: string
          created_at?: string | null
          description?: string | null
          email_content: string
          id?: string
          name: string
          recommended_delay_hours?: number
          sequence_order?: number
          subject_line: string
          updated_at?: string | null
        }
        Update: {
          campaign_type?: string
          created_at?: string | null
          description?: string | null
          email_content?: string
          id?: string
          name?: string
          recommended_delay_hours?: number
          sequence_order?: number
          subject_line?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      file_upload_reminders: {
        Row: {
          created_at: string | null
          deadline_date: string
          files_completed: boolean | null
          id: string
          last_reminder_sent_at: string | null
          order_id: string
          reminder_count: number | null
        }
        Insert: {
          created_at?: string | null
          deadline_date: string
          files_completed?: boolean | null
          id?: string
          last_reminder_sent_at?: string | null
          order_id: string
          reminder_count?: number | null
        }
        Update: {
          created_at?: string | null
          deadline_date?: string
          files_completed?: boolean | null
          id?: string
          last_reminder_sent_at?: string | null
          order_id?: string
          reminder_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "file_upload_reminders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string | null
          payment_processor_config: Json | null
          school_id: string | null
          status: boolean | null
          updated_at: string
          use_org_payment_account: boolean | null
          website_url: string | null
        }
        Insert: {
          created_at?: string
          group_name: string
          group_type_id?: string | null
          id?: string
          logo_url?: string | null
          organization_id?: string | null
          payment_processor_config?: Json | null
          school_id?: string | null
          status?: boolean | null
          updated_at?: string
          use_org_payment_account?: boolean | null
          website_url?: string | null
        }
        Update: {
          created_at?: string
          group_name?: string
          group_type_id?: string | null
          id?: string
          logo_url?: string | null
          organization_id?: string | null
          payment_processor_config?: Json | null
          school_id?: string | null
          status?: boolean | null
          updated_at?: string
          use_org_payment_account?: boolean | null
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
            foreignKeyName: "groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      launch_interest: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          school_info: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          school_info: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          school_info?: string
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
      nonprofits: {
        Row: {
          c3_status_document_url: string | null
          created_at: string | null
          ein: string | null
          id: string
          mission_statement: string | null
          organization_id: string
          updated_at: string | null
          verification_notes: string | null
        }
        Insert: {
          c3_status_document_url?: string | null
          created_at?: string | null
          ein?: string | null
          id?: string
          mission_statement?: string | null
          organization_id: string
          updated_at?: string | null
          verification_notes?: string | null
        }
        Update: {
          c3_status_document_url?: string | null
          created_at?: string | null
          ein?: string | null
          id?: string
          mission_statement?: string | null
          organization_id?: string
          updated_at?: string | null
          verification_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nonprofits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          business_id: string | null
          created_at: string
          id: string
          link: string | null
          message: string
          order_id: string | null
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          message: string
          order_id?: string | null
          read?: boolean
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          order_id?: string | null
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      nurture_campaigns: {
        Row: {
          campaign_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          status: string
          trigger_config: Json
          updated_at: string | null
        }
        Insert: {
          campaign_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          status?: string
          trigger_config?: Json
          updated_at?: string | null
        }
        Update: {
          campaign_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          status?: string
          trigger_config?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nurture_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurture_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      nurture_enrollments: {
        Row: {
          campaign_id: string
          completed_at: string | null
          current_sequence: number | null
          donor_id: string
          enrolled_at: string | null
          id: string
          next_send_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          current_sequence?: number | null
          donor_id: string
          enrolled_at?: string | null
          id?: string
          next_send_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          current_sequence?: number | null
          donor_id?: string
          enrolled_at?: string | null
          id?: string
          next_send_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "nurture_enrollments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "nurture_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurture_enrollments_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nurture_sequences: {
        Row: {
          campaign_id: string
          created_at: string | null
          delay_hours: number
          email_content: string
          id: string
          sequence_order: number
          subject_line: string
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          delay_hours?: number
          email_content: string
          id?: string
          sequence_order: number
          subject_line: string
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          delay_hours?: number
          email_content?: string
          id?: string
          sequence_order?: number
          subject_line?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nurture_sequences_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "nurture_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      order_custom_field_values: {
        Row: {
          created_at: string | null
          field_id: string
          field_value: string | null
          id: string
          order_id: string
        }
        Insert: {
          created_at?: string | null
          field_id: string
          field_value?: string | null
          id?: string
          order_id: string
        }
        Update: {
          created_at?: string | null
          field_id?: string
          field_value?: string | null
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_custom_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "campaign_custom_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_custom_field_values_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          application_fee_amount: number | null
          business_id: string | null
          business_purchase: boolean | null
          campaign_id: string
          created_at: string
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          files_complete: boolean | null
          id: string
          items: Json
          payment_processor: string | null
          processor_session_id: string | null
          processor_transaction_id: string | null
          shipping_address: Json | null
          status: string | null
          tax_receipt_issued: boolean | null
          tax_receipt_sent_at: string | null
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          application_fee_amount?: number | null
          business_id?: string | null
          business_purchase?: boolean | null
          campaign_id: string
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          files_complete?: boolean | null
          id?: string
          items: Json
          payment_processor?: string | null
          processor_session_id?: string | null
          processor_transaction_id?: string | null
          shipping_address?: Json | null
          status?: string | null
          tax_receipt_issued?: boolean | null
          tax_receipt_sent_at?: string | null
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          application_fee_amount?: number | null
          business_id?: string | null
          business_purchase?: boolean | null
          campaign_id?: string
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          files_complete?: boolean | null
          id?: string
          items?: Json
          payment_processor?: string | null
          processor_session_id?: string | null
          processor_transaction_id?: string | null
          shipping_address?: Json | null
          status?: string | null
          tax_receipt_issued?: boolean | null
          tax_receipt_sent_at?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_businesses: {
        Row: {
          business_id: string
          created_at: string | null
          custom_data: Json | null
          id: string
          notes: string | null
          organization_id: string
          relationship_status: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          custom_data?: Json | null
          id?: string
          notes?: string | null
          organization_id: string
          relationship_status?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          custom_data?: Json | null
          id?: string
          notes?: string | null
          organization_id?: string
          relationship_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_businesses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_businesses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_user: {
        Row: {
          active_user: boolean | null
          created_at: string | null
          group_id: string | null
          id: string
          organization_id: string
          roster_id: number | null
          updated_at: string | null
          user_id: string
          user_type_id: string
        }
        Insert: {
          active_user?: boolean | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          organization_id: string
          roster_id?: number | null
          updated_at?: string | null
          user_id: string
          user_type_id: string
        }
        Update: {
          active_user?: boolean | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          organization_id?: string
          roster_id?: number | null
          updated_at?: string | null
          user_id?: string
          user_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_user_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_user_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_user_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "rosters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_user_user_type_id_fkey"
            columns: ["user_type_id"]
            isOneToOne: false
            referencedRelation: "user_type"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          organization_type: Database["public"]["Enums"]["organization_type"]
          payment_processor_config: Json | null
          phone: string | null
          primary_color: string | null
          requires_verification: boolean | null
          secondary_color: string | null
          state: string | null
          updated_at: string | null
          verification_approved_at: string | null
          verification_documents: Json | null
          verification_status: string | null
          verification_submitted_at: string | null
          website_url: string | null
          zip: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          organization_type: Database["public"]["Enums"]["organization_type"]
          payment_processor_config?: Json | null
          phone?: string | null
          primary_color?: string | null
          requires_verification?: boolean | null
          secondary_color?: string | null
          state?: string | null
          updated_at?: string | null
          verification_approved_at?: string | null
          verification_documents?: Json | null
          verification_status?: string | null
          verification_submitted_at?: string | null
          website_url?: string | null
          zip?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          organization_type?: Database["public"]["Enums"]["organization_type"]
          payment_processor_config?: Json | null
          phone?: string | null
          primary_color?: string | null
          requires_verification?: boolean | null
          secondary_color?: string | null
          state?: string | null
          updated_at?: string | null
          verification_approved_at?: string | null
          verification_documents?: Json | null
          verification_status?: string | null
          verification_submitted_at?: string | null
          website_url?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email_digest_frequency: string | null
          first_name: string | null
          id: string
          last_digest_sent_at: string | null
          last_name: string | null
          notify_assignments: boolean | null
          notify_campaigns: boolean | null
          notify_donations: boolean | null
          school_id: string | null
          system_admin: boolean | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email_digest_frequency?: string | null
          first_name?: string | null
          id: string
          last_digest_sent_at?: string | null
          last_name?: string | null
          notify_assignments?: boolean | null
          notify_campaigns?: boolean | null
          notify_donations?: boolean | null
          school_id?: string | null
          system_admin?: boolean | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email_digest_frequency?: string | null
          first_name?: string | null
          id?: string
          last_digest_sent_at?: string | null
          last_name?: string | null
          notify_assignments?: boolean | null
          notify_campaigns?: boolean | null
          notify_donations?: boolean | null
          school_id?: string | null
          system_admin?: boolean | null
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
          organization_id: string | null
          phone: string | null
          "Primary Color": string | null
          reduced_lunch: number | null
          school_district_id: string | null
          school_name: string
          school_subtype: Database["public"]["Enums"]["school_subtype"] | null
          school_type: string | null
          school_type_id: string | null
          "Secondary Color": string | null
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
          organization_id?: string | null
          phone?: string | null
          "Primary Color"?: string | null
          reduced_lunch?: number | null
          school_district_id?: string | null
          school_name: string
          school_subtype?: Database["public"]["Enums"]["school_subtype"] | null
          school_type?: string | null
          school_type_id?: string | null
          "Secondary Color"?: string | null
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
          organization_id?: string | null
          phone?: string | null
          "Primary Color"?: string | null
          reduced_lunch?: number | null
          school_district_id?: string | null
          school_name?: string
          school_subtype?: Database["public"]["Enums"]["school_subtype"] | null
          school_type?: string | null
          school_type_id?: string | null
          "Secondary Color"?: string | null
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
            foreignKeyName: "schools_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      sponsorship_files: {
        Row: {
          created_at: string | null
          custom_field_id: string | null
          file_name: string
          file_path: string
          file_size_bytes: number | null
          file_type: string
          file_url: string | null
          id: string
          mime_type: string | null
          order_id: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          custom_field_id?: string | null
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          file_type: string
          file_url?: string | null
          id?: string
          mime_type?: string | null
          order_id: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          custom_field_id?: string | null
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          file_type?: string
          file_url?: string | null
          id?: string
          mime_type?: string | null
          order_id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsorship_files_custom_field_id_fkey"
            columns: ["custom_field_id"]
            isOneToOne: false
            referencedRelation: "campaign_custom_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sponsorship_files_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
      thank_you_templates: {
        Row: {
          body: string
          created_at: string | null
          created_by: string | null
          id: string
          is_default: boolean | null
          name: string
          organization_id: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          organization_id: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          organization_id?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thank_you_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_type: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          permission_level: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          permission_level?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          permission_level?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_rfm_scores: { Args: { org_id: string }; Returns: undefined }
      can_update_organization_user: {
        Args: { target_org_user_id: string }
        Returns: boolean
      }
      can_update_school_user: {
        Args: { target_school_user_id: string }
        Returns: boolean
      }
      generate_campaign_slug: {
        Args: { campaign_id?: string; campaign_name: string }
        Returns: string
      }
      get_ab_test_results: {
        Args: { test_uuid: string }
        Returns: {
          click_rate: number
          click_through_rate: number
          emails_clicked: number
          emails_opened: number
          emails_sent: number
          is_control: boolean
          open_rate: number
          subject_line: string
          variant_id: string
          variant_name: string
        }[]
      }
      is_system_admin: { Args: { user_id: string }; Returns: boolean }
      restore_email_layout_version: {
        Args: { p_layout_id: string; p_version_number: number }
        Returns: undefined
      }
      user_belongs_to_organization: {
        Args: { org_id: string; user_id: string }
        Returns: boolean
      }
      user_belongs_to_school: {
        Args: { school_id: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      organization_type: "school" | "nonprofit"
      school_subtype: "public" | "charter" | "private"
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
      organization_type: ["school", "nonprofit"],
      school_subtype: ["public", "charter", "private"],
    },
  },
} as const
