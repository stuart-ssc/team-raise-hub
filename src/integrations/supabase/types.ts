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
      business_activity_log: {
        Row: {
          activity_data: Json | null
          activity_type: string
          business_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          business_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          business_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_activity_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_assets: {
        Row: {
          asset_name: string
          asset_type: string
          business_id: string
          created_at: string
          created_by: string | null
          file_name: string
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          asset_name: string
          asset_type?: string
          business_id: string
          created_at?: string
          created_by?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          asset_name?: string
          asset_type?: string
          business_id?: string
          created_at?: string
          created_by?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_assets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_campaign_assets: {
        Row: {
          additional_files: Json | null
          business_id: string
          campaign_id: string
          campaign_logo_url: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          organization_id: string
          updated_at: string | null
          use_default_logo: boolean | null
        }
        Insert: {
          additional_files?: Json | null
          business_id: string
          campaign_id: string
          campaign_logo_url?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          updated_at?: string | null
          use_default_logo?: boolean | null
        }
        Update: {
          additional_files?: Json | null
          business_id?: string
          campaign_id?: string
          campaign_logo_url?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          updated_at?: string | null
          use_default_logo?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "business_campaign_assets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_campaign_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_campaign_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "roster_member_fundraising_stats"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "business_campaign_assets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_campaign_assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_campaign_assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
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
          {
            foreignKeyName: "business_donors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      business_insights: {
        Row: {
          business_id: string
          created_at: string | null
          expansion_potential: string | null
          generated_at: string | null
          id: string
          insights: Json
          optimal_outreach_date: string | null
          organization_id: string
          partnership_health_score: number | null
          priority_score: number | null
          risk_level: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          expansion_potential?: string | null
          generated_at?: string | null
          id?: string
          insights?: Json
          optimal_outreach_date?: string | null
          organization_id: string
          partnership_health_score?: number | null
          priority_score?: number | null
          risk_level?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          expansion_potential?: string | null
          generated_at?: string | null
          id?: string
          insights?: Json
          optimal_outreach_date?: string | null
          organization_id?: string
          partnership_health_score?: number | null
          priority_score?: number | null
          risk_level?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_insights_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_insights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_insights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      business_nurture_campaigns: {
        Row: {
          campaign_type: string
          created_at: string | null
          created_by: string | null
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
          id?: string
          name?: string
          organization_id?: string
          status?: string
          trigger_config?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_nurture_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_nurture_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      business_nurture_enrollments: {
        Row: {
          business_id: string
          campaign_id: string
          completed_at: string | null
          created_at: string | null
          current_sequence_id: string | null
          enrolled_at: string | null
          id: string
          next_send_at: string | null
          queue_item_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          campaign_id: string
          completed_at?: string | null
          created_at?: string | null
          current_sequence_id?: string | null
          enrolled_at?: string | null
          id?: string
          next_send_at?: string | null
          queue_item_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          campaign_id?: string
          completed_at?: string | null
          created_at?: string | null
          current_sequence_id?: string | null
          enrolled_at?: string | null
          id?: string
          next_send_at?: string | null
          queue_item_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_nurture_enrollments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_nurture_enrollments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "business_nurture_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_nurture_enrollments_current_sequence_id_fkey"
            columns: ["current_sequence_id"]
            isOneToOne: false
            referencedRelation: "business_nurture_sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_nurture_enrollments_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "business_outreach_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      business_nurture_sequences: {
        Row: {
          campaign_id: string
          created_at: string | null
          email_body: string
          email_template_key: string
          id: string
          send_delay_days: number
          sequence_order: number
          subject_line: string
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          email_body: string
          email_template_key: string
          id?: string
          send_delay_days?: number
          sequence_order: number
          subject_line: string
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          email_body?: string
          email_template_key?: string
          id?: string
          send_delay_days?: number
          sequence_order?: number
          subject_line?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_nurture_sequences_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "business_nurture_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      business_outreach_queue: {
        Row: {
          actioned_at: string | null
          actioned_by: string | null
          business_id: string
          created_at: string | null
          expansion_potential_level: string
          generated_at: string | null
          id: string
          organization_id: string
          partnership_health_status: string
          priority_score: number
          queue_insights: Json
          recommended_outreach_date: string
          recommended_outreach_target: string
          specific_contact_id: string | null
          updated_at: string | null
        }
        Insert: {
          actioned_at?: string | null
          actioned_by?: string | null
          business_id: string
          created_at?: string | null
          expansion_potential_level?: string
          generated_at?: string | null
          id?: string
          organization_id: string
          partnership_health_status?: string
          priority_score?: number
          queue_insights?: Json
          recommended_outreach_date: string
          recommended_outreach_target: string
          specific_contact_id?: string | null
          updated_at?: string | null
        }
        Update: {
          actioned_at?: string | null
          actioned_by?: string | null
          business_id?: string
          created_at?: string | null
          expansion_potential_level?: string
          generated_at?: string | null
          id?: string
          organization_id?: string
          partnership_health_status?: string
          priority_score?: number
          queue_insights?: Json
          recommended_outreach_date?: string
          recommended_outreach_target?: string
          specific_contact_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_outreach_queue_actioned_by_fkey"
            columns: ["actioned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_outreach_queue_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_outreach_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_outreach_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_outreach_queue_specific_contact_id_fkey"
            columns: ["specific_contact_id"]
            isOneToOne: false
            referencedRelation: "donor_profiles"
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
          archived_at: string | null
          archived_by: string | null
          business_email: string | null
          business_name: string
          business_phone: string | null
          city: string | null
          country: string | null
          created_at: string | null
          ein: string | null
          engagement_breadth_score: number | null
          engagement_performance_score: number | null
          engagement_score: number | null
          engagement_segment: string | null
          engagement_vitality_score: number | null
          id: string
          industry: string | null
          last_donor_activity_date: string | null
          linked_donors_count: number | null
          logo_url: string | null
          segment_updated_at: string | null
          state: string | null
          tags: string[] | null
          total_partnership_value: number | null
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
          archived_at?: string | null
          archived_by?: string | null
          business_email?: string | null
          business_name: string
          business_phone?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          ein?: string | null
          engagement_breadth_score?: number | null
          engagement_performance_score?: number | null
          engagement_score?: number | null
          engagement_segment?: string | null
          engagement_vitality_score?: number | null
          id?: string
          industry?: string | null
          last_donor_activity_date?: string | null
          linked_donors_count?: number | null
          logo_url?: string | null
          segment_updated_at?: string | null
          state?: string | null
          tags?: string[] | null
          total_partnership_value?: number | null
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
          archived_at?: string | null
          archived_by?: string | null
          business_email?: string | null
          business_name?: string
          business_phone?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          ein?: string | null
          engagement_breadth_score?: number | null
          engagement_performance_score?: number | null
          engagement_score?: number | null
          engagement_segment?: string | null
          engagement_vitality_score?: number | null
          id?: string
          industry?: string | null
          last_donor_activity_date?: string | null
          linked_donors_count?: number | null
          logo_url?: string | null
          segment_updated_at?: string | null
          state?: string | null
          tags?: string[] | null
          total_partnership_value?: number | null
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
          {
            foreignKeyName: "campaign_custom_fields_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "roster_member_fundraising_stats"
            referencedColumns: ["campaign_id"]
          },
        ]
      }
      campaign_item_variants: {
        Row: {
          campaign_item_id: string
          created_at: string | null
          display_order: number | null
          id: string
          quantity_available: number
          quantity_offered: number
          size: string
          updated_at: string | null
        }
        Insert: {
          campaign_item_id: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          quantity_available?: number
          quantity_offered?: number
          size: string
          updated_at?: string | null
        }
        Update: {
          campaign_item_id?: string
          created_at?: string | null
          display_order?: number | null
          id?: string
          quantity_available?: number
          quantity_offered?: number
          size?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_item_variants_campaign_item_id_fkey"
            columns: ["campaign_item_id"]
            isOneToOne: false
            referencedRelation: "campaign_items"
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
          has_variants: boolean | null
          id: string
          image: string | null
          is_recurring: boolean | null
          max_items_purchased: number | null
          name: string
          quantity_available: number | null
          quantity_offered: number | null
          recurring_interval: string | null
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
          has_variants?: boolean | null
          id?: string
          image?: string | null
          is_recurring?: boolean | null
          max_items_purchased?: number | null
          name: string
          quantity_available?: number | null
          quantity_offered?: number | null
          recurring_interval?: string | null
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
          has_variants?: boolean | null
          id?: string
          image?: string | null
          is_recurring?: boolean | null
          max_items_purchased?: number | null
          name?: string
          quantity_available?: number | null
          quantity_offered?: number | null
          recurring_interval?: string | null
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
          {
            foreignKeyName: "fk_campaign_items_campaign_id"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "roster_member_fundraising_stats"
            referencedColumns: ["campaign_id"]
          },
        ]
      }
      campaign_required_assets: {
        Row: {
          asset_description: string | null
          asset_name: string
          campaign_id: string
          created_at: string | null
          dimensions_hint: string | null
          display_order: number | null
          file_types: string[] | null
          id: string
          is_required: boolean | null
          max_file_size_mb: number | null
          updated_at: string | null
        }
        Insert: {
          asset_description?: string | null
          asset_name: string
          campaign_id: string
          created_at?: string | null
          dimensions_hint?: string | null
          display_order?: number | null
          file_types?: string[] | null
          id?: string
          is_required?: boolean | null
          max_file_size_mb?: number | null
          updated_at?: string | null
        }
        Update: {
          asset_description?: string | null
          asset_name?: string
          campaign_id?: string
          created_at?: string | null
          dimensions_hint?: string | null
          display_order?: number | null
          file_types?: string[] | null
          id?: string
          is_required?: boolean | null
          max_file_size_mb?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_required_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_required_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "roster_member_fundraising_stats"
            referencedColumns: ["campaign_id"]
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
          {
            foreignKeyName: "campaign_views_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "roster_member_fundraising_stats"
            referencedColumns: ["campaign_id"]
          },
        ]
      }
      campaigns: {
        Row: {
          amount_raised: number | null
          asset_upload_deadline: string | null
          campaign_type_id: string | null
          created_at: string
          description: string | null
          enable_roster_attribution: boolean | null
          end_date: string | null
          file_upload_deadline_days: number | null
          goal_amount: number | null
          group_directions: string | null
          group_id: string | null
          id: string
          image_url: string | null
          name: string
          pitch_image_url: string | null
          pitch_message: string | null
          pitch_recorded_video_url: string | null
          pitch_video_url: string | null
          publication_status: string | null
          requires_business_info: boolean | null
          roster_id: number | null
          slug: string | null
          start_date: string | null
          status: boolean | null
          thank_you_message: string | null
          updated_at: string
        }
        Insert: {
          amount_raised?: number | null
          asset_upload_deadline?: string | null
          campaign_type_id?: string | null
          created_at?: string
          description?: string | null
          enable_roster_attribution?: boolean | null
          end_date?: string | null
          file_upload_deadline_days?: number | null
          goal_amount?: number | null
          group_directions?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          pitch_image_url?: string | null
          pitch_message?: string | null
          pitch_recorded_video_url?: string | null
          pitch_video_url?: string | null
          publication_status?: string | null
          requires_business_info?: boolean | null
          roster_id?: number | null
          slug?: string | null
          start_date?: string | null
          status?: boolean | null
          thank_you_message?: string | null
          updated_at?: string
        }
        Update: {
          amount_raised?: number | null
          asset_upload_deadline?: string | null
          campaign_type_id?: string | null
          created_at?: string
          description?: string | null
          enable_roster_attribution?: boolean | null
          end_date?: string | null
          file_upload_deadline_days?: number | null
          goal_amount?: number | null
          group_directions?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          pitch_image_url?: string | null
          pitch_message?: string | null
          pitch_recorded_video_url?: string | null
          pitch_video_url?: string | null
          publication_status?: string | null
          requires_business_info?: boolean | null
          roster_id?: number | null
          slug?: string | null
          start_date?: string | null
          status?: boolean | null
          thank_you_message?: string | null
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
          {
            foreignKeyName: "campaigns_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "rosters"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          replied_at: string | null
          replied_by: string | null
          status: string
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_replied_by_fkey"
            columns: ["replied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          donor_profile_id: string | null
          id: string
          is_archived: boolean | null
          joined_at: string | null
          last_read_at: string | null
          left_at: string | null
          muted_until: string | null
          participant_type: string
          role: string | null
          user_id: string | null
        }
        Insert: {
          conversation_id: string
          donor_profile_id?: string | null
          id?: string
          is_archived?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          left_at?: string | null
          muted_until?: string | null
          participant_type: string
          role?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string
          donor_profile_id?: string | null
          id?: string
          is_archived?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          left_at?: string | null
          muted_until?: string | null
          participant_type?: string
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_donor_profile_id_fkey"
            columns: ["donor_profile_id"]
            isOneToOne: false
            referencedRelation: "donor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          context_id: string | null
          context_type: string | null
          conversation_type: string
          created_at: string | null
          created_by: string | null
          id: string
          organization_id: string
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          context_id?: string | null
          context_type?: string | null
          conversation_type: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          organization_id: string
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          context_id?: string | null
          context_type?: string | null
          conversation_type?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          organization_id?: string
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
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
          {
            foreignKeyName: "custom_email_layouts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
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
          {
            foreignKeyName: "donor_insights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
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
          message_notification_email: boolean | null
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
          user_id: string | null
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
          message_notification_email?: boolean | null
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
          user_id?: string | null
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
          message_notification_email?: boolean | null
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
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donor_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          {
            foreignKeyName: "donor_segments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
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
            foreignKeyName: "groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
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
      landing_page_configs: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          is_published: boolean | null
          og_image_url: string | null
          published_at: string | null
          published_by: string | null
          seo_description: string | null
          seo_title: string | null
          template_id: string
          updated_at: string | null
          variable_overrides: Json | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_published?: boolean | null
          og_image_url?: string | null
          published_at?: string | null
          published_by?: string | null
          seo_description?: string | null
          seo_title?: string | null
          template_id: string
          updated_at?: string | null
          variable_overrides?: Json | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_published?: boolean | null
          og_image_url?: string | null
          published_at?: string | null
          published_by?: string | null
          seo_description?: string | null
          seo_title?: string | null
          template_id?: string
          updated_at?: string | null
          variable_overrides?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_configs_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_page_configs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "landing_page_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_templates: {
        Row: {
          blocks: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          preview_image_url: string | null
          template_type: string
          updated_at: string | null
        }
        Insert: {
          blocks?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          preview_image_url?: string | null
          template_type: string
          updated_at?: string | null
        }
        Update: {
          blocks?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          preview_image_url?: string | null
          template_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_page_views: {
        Row: {
          created_at: string | null
          district_id: string | null
          id: string
          page_path: string
          page_type: string
          referrer: string | null
          school_id: string | null
          session_id: string | null
          state: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          district_id?: string | null
          id?: string
          page_path: string
          page_type: string
          referrer?: string | null
          school_id?: string | null
          session_id?: string | null
          state?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          district_id?: string | null
          id?: string
          page_path?: string
          page_type?: string
          referrer?: string | null
          school_id?: string | null
          session_id?: string | null
          state?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "landing_page_views_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "school_districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "landing_page_views_school_id_fkey"
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
      membership_requests: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          organization_id: string
          requester_message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          status: string
          updated_at: string
          user_id: string
          user_type_id: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          organization_id: string
          requester_message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
          user_type_id: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          organization_id?: string
          requester_message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          user_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_requests_user_type_id_fkey"
            columns: ["user_type_id"]
            isOneToOne: false
            referencedRelation: "user_type"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          donor_profile_id: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          donor_profile_id?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          donor_profile_id?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_donor_profile_id_fkey"
            columns: ["donor_profile_id"]
            isOneToOne: false
            referencedRelation: "donor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_shared: boolean | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_shared?: boolean | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_shared?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          content_type: string | null
          conversation_id: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          metadata: Json | null
          pinned_at: string | null
          pinned_by: string | null
          reply_to_id: string | null
          scheduled_for: string | null
          sender_donor_profile_id: string | null
          sender_type: string
          sender_user_id: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          content_type?: string | null
          conversation_id: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          metadata?: Json | null
          pinned_at?: string | null
          pinned_by?: string | null
          reply_to_id?: string | null
          scheduled_for?: string | null
          sender_donor_profile_id?: string | null
          sender_type: string
          sender_user_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          content_type?: string | null
          conversation_id?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          metadata?: Json | null
          pinned_at?: string | null
          pinned_by?: string | null
          reply_to_id?: string | null
          scheduled_for?: string | null
          sender_donor_profile_id?: string | null
          sender_type?: string
          sender_user_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_pinned_by_fkey"
            columns: ["pinned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_donor_profile_id_fkey"
            columns: ["sender_donor_profile_id"]
            isOneToOne: false
            referencedRelation: "donor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "nonprofits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations_public"
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
          {
            foreignKeyName: "nurture_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
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
      order_asset_uploads: {
        Row: {
          business_asset_id: string | null
          created_at: string | null
          file_name: string
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          order_id: string
          required_asset_id: string
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          business_asset_id?: string | null
          created_at?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          order_id: string
          required_asset_id: string
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          business_asset_id?: string | null
          created_at?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          order_id?: string
          required_asset_id?: string
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_asset_uploads_business_asset_id_fkey"
            columns: ["business_asset_id"]
            isOneToOne: false
            referencedRelation: "business_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_asset_uploads_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_asset_uploads_required_asset_id_fkey"
            columns: ["required_asset_id"]
            isOneToOne: false
            referencedRelation: "campaign_required_assets"
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
      order_export_history: {
        Row: {
          campaign_id: string | null
          campaign_ids: string[] | null
          columns: string[]
          created_at: string | null
          export_format: string
          filename: string
          filters: Json | null
          id: string
          order_count: number
          organization_id: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          campaign_ids?: string[] | null
          columns: string[]
          created_at?: string | null
          export_format: string
          filename: string
          filters?: Json | null
          id?: string
          order_count: number
          organization_id: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          campaign_ids?: string[] | null
          columns?: string[]
          created_at?: string | null
          export_format?: string
          filename?: string
          filters?: Json | null
          id?: string
          order_count?: number
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_export_history_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_export_history_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "roster_member_fundraising_stats"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "order_export_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_export_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          access_token: string | null
          application_fee_amount: number | null
          attributed_roster_member_id: string | null
          business_id: string | null
          business_purchase: boolean | null
          campaign_id: string
          created_at: string
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          files_complete: boolean | null
          id: string
          items: Json
          items_total: number | null
          payment_processor: string | null
          platform_fee_amount: number | null
          processor_session_id: string | null
          processor_transaction_id: string | null
          shipping_address: Json | null
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          tax_receipt_issued: boolean | null
          tax_receipt_sent_at: string | null
          token_expires_at: string | null
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          application_fee_amount?: number | null
          attributed_roster_member_id?: string | null
          business_id?: string | null
          business_purchase?: boolean | null
          campaign_id: string
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          files_complete?: boolean | null
          id?: string
          items: Json
          items_total?: number | null
          payment_processor?: string | null
          platform_fee_amount?: number | null
          processor_session_id?: string | null
          processor_transaction_id?: string | null
          shipping_address?: Json | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          tax_receipt_issued?: boolean | null
          tax_receipt_sent_at?: string | null
          token_expires_at?: string | null
          total_amount: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          application_fee_amount?: number | null
          attributed_roster_member_id?: string | null
          business_id?: string | null
          business_purchase?: boolean | null
          campaign_id?: string
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          files_complete?: boolean | null
          id?: string
          items?: Json
          items_total?: number | null
          payment_processor?: string | null
          platform_fee_amount?: number | null
          processor_session_id?: string | null
          processor_transaction_id?: string | null
          shipping_address?: Json | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          tax_receipt_issued?: boolean | null
          tax_receipt_sent_at?: string | null
          token_expires_at?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_attributed_roster_member_id_fkey"
            columns: ["attributed_roster_member_id"]
            isOneToOne: false
            referencedRelation: "organization_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_attributed_roster_member_id_fkey"
            columns: ["attributed_roster_member_id"]
            isOneToOne: false
            referencedRelation: "roster_member_fundraising_stats"
            referencedColumns: ["roster_member_id"]
          },
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
          {
            foreignKeyName: "orders_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "roster_member_fundraising_stats"
            referencedColumns: ["campaign_id"]
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
          {
            foreignKeyName: "organization_businesses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
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
          linked_organization_user_id: string | null
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
          linked_organization_user_id?: string | null
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
          linked_organization_user_id?: string | null
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
            foreignKeyName: "organization_user_linked_organization_user_id_fkey"
            columns: ["linked_organization_user_id"]
            isOneToOne: false
            referencedRelation: "organization_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_user_linked_organization_user_id_fkey"
            columns: ["linked_organization_user_id"]
            isOneToOne: false
            referencedRelation: "roster_member_fundraising_stats"
            referencedColumns: ["roster_member_id"]
          },
          {
            foreignKeyName: "organization_user_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_user_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
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
            foreignKeyName: "organization_user_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          active_user_count: number | null
          address_line1: string | null
          address_line2: string | null
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
          active_user_count?: number | null
          address_line1?: string | null
          address_line2?: string | null
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
          active_user_count?: number | null
          address_line1?: string | null
          address_line2?: string | null
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
      parent_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          first_name: string | null
          group_id: string | null
          id: string
          inviter_organization_user_id: string
          last_name: string | null
          organization_id: string
          relationship: string | null
          roster_id: number | null
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          first_name?: string | null
          group_id?: string | null
          id?: string
          inviter_organization_user_id: string
          last_name?: string | null
          organization_id: string
          relationship?: string | null
          roster_id?: number | null
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          first_name?: string | null
          group_id?: string | null
          id?: string
          inviter_organization_user_id?: string
          last_name?: string | null
          organization_id?: string
          relationship?: string | null
          roster_id?: number | null
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_invitations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_invitations_inviter_organization_user_id_fkey"
            columns: ["inviter_organization_user_id"]
            isOneToOne: false
            referencedRelation: "organization_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_invitations_inviter_organization_user_id_fkey"
            columns: ["inviter_organization_user_id"]
            isOneToOne: false
            referencedRelation: "roster_member_fundraising_stats"
            referencedColumns: ["roster_member_id"]
          },
          {
            foreignKeyName: "parent_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_invitations_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "rosters"
            referencedColumns: ["id"]
          },
        ]
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
          notify_messages: boolean | null
          push_notify_messages: boolean | null
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
          notify_messages?: boolean | null
          push_notify_messages?: boolean | null
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
          notify_messages?: boolean | null
          push_notify_messages?: boolean | null
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
      push_notification_log: {
        Row: {
          body: string | null
          created_at: string | null
          data: Json | null
          failure_count: number | null
          fcm_response: Json | null
          id: string
          success_count: number | null
          title: string
          tokens_sent: number | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          failure_count?: number | null
          fcm_response?: Json | null
          id?: string
          success_count?: number | null
          title: string
          tokens_sent?: number | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          failure_count?: number | null
          fcm_response?: Json | null
          id?: string
          success_count?: number | null
          title?: string
          tokens_sent?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      push_notification_tokens: {
        Row: {
          active: boolean | null
          created_at: string | null
          device_info: Json | null
          device_token: string
          id: string
          platform: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          device_info?: Json | null
          device_token: string
          id?: string
          platform: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          device_info?: Json | null
          device_token?: string
          id?: string
          platform?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      roster_member_campaign_links: {
        Row: {
          campaign_id: string
          created_at: string | null
          id: string
          pitch_image_url: string | null
          pitch_message: string | null
          pitch_recorded_video_url: string | null
          pitch_video_url: string | null
          roster_member_id: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          id?: string
          pitch_image_url?: string | null
          pitch_message?: string | null
          pitch_recorded_video_url?: string | null
          pitch_video_url?: string | null
          roster_member_id: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          id?: string
          pitch_image_url?: string | null
          pitch_message?: string | null
          pitch_recorded_video_url?: string | null
          pitch_video_url?: string | null
          roster_member_id?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roster_member_campaign_links_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_member_campaign_links_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "roster_member_fundraising_stats"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "roster_member_campaign_links_roster_member_id_fkey"
            columns: ["roster_member_id"]
            isOneToOne: false
            referencedRelation: "organization_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_member_campaign_links_roster_member_id_fkey"
            columns: ["roster_member_id"]
            isOneToOne: false
            referencedRelation: "roster_member_fundraising_stats"
            referencedColumns: ["roster_member_id"]
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
          slug: string | null
          state: string | null
          state_district_id: string | null
          state_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          nces_district_id?: string | null
          slug?: string | null
          state?: string | null
          state_district_id?: string | null
          state_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          nces_district_id?: string | null
          slug?: string | null
          state?: string | null
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
          slug: string | null
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
          slug?: string | null
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
          slug?: string | null
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
            foreignKeyName: "schools_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
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
      stripe_connect_accounts: {
        Row: {
          business_type: string | null
          charges_enabled: boolean | null
          created_at: string | null
          details_submitted: boolean | null
          group_id: string | null
          id: string
          minimum_payout_amount: number | null
          onboarding_complete: boolean | null
          organization_id: string | null
          payout_schedule: string | null
          payouts_enabled: boolean | null
          stripe_account_id: string
          updated_at: string | null
        }
        Insert: {
          business_type?: string | null
          charges_enabled?: boolean | null
          created_at?: string | null
          details_submitted?: boolean | null
          group_id?: string | null
          id?: string
          minimum_payout_amount?: number | null
          onboarding_complete?: boolean | null
          organization_id?: string | null
          payout_schedule?: string | null
          payouts_enabled?: boolean | null
          stripe_account_id: string
          updated_at?: string | null
        }
        Update: {
          business_type?: string | null
          charges_enabled?: boolean | null
          created_at?: string | null
          details_submitted?: boolean | null
          group_id?: string | null
          id?: string
          minimum_payout_amount?: number | null
          onboarding_complete?: boolean | null
          organization_id?: string | null
          payout_schedule?: string | null
          payouts_enabled?: boolean | null
          stripe_account_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_connect_accounts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_connect_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_connect_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_payouts: {
        Row: {
          amount: number
          arrival_date: string | null
          created_at: string | null
          currency: string | null
          id: string
          status: string
          stripe_connect_account_id: string | null
          stripe_payout_id: string
        }
        Insert: {
          amount: number
          arrival_date?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          status: string
          stripe_connect_account_id?: string | null
          stripe_payout_id: string
        }
        Update: {
          amount?: number
          arrival_date?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          status?: string
          stripe_connect_account_id?: string | null
          stripe_payout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_payouts_stripe_connect_account_id_fkey"
            columns: ["stripe_connect_account_id"]
            isOneToOne: false
            referencedRelation: "stripe_connect_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          campaign_id: string | null
          campaign_item_id: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          donor_profile_id: string | null
          id: string
          interval: string
          order_id: string | null
          status: string
          stripe_customer_id: string
          stripe_price_id: string | null
          stripe_subscription_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          campaign_item_id?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          donor_profile_id?: string | null
          id?: string
          interval: string
          order_id?: string | null
          status?: string
          stripe_customer_id: string
          stripe_price_id?: string | null
          stripe_subscription_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          campaign_item_id?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          donor_profile_id?: string | null
          id?: string
          interval?: string
          order_id?: string | null
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string | null
          stripe_subscription_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "roster_member_fundraising_stats"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "subscriptions_campaign_item_id_fkey"
            columns: ["campaign_item_id"]
            isOneToOne: false
            referencedRelation: "campaign_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_donor_profile_id_fkey"
            columns: ["donor_profile_id"]
            isOneToOne: false
            referencedRelation: "donor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "thank_you_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations_public"
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
      organizations_public: {
        Row: {
          city: string | null
          id: string | null
          logo_url: string | null
          name: string | null
          organization_type:
            | Database["public"]["Enums"]["organization_type"]
            | null
          state: string | null
          website_url: string | null
        }
        Insert: {
          city?: string | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          organization_type?:
            | Database["public"]["Enums"]["organization_type"]
            | null
          state?: string | null
          website_url?: string | null
        }
        Update: {
          city?: string | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          organization_type?:
            | Database["public"]["Enums"]["organization_type"]
            | null
          state?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      roster_member_fundraising_stats: {
        Row: {
          avg_donation: number | null
          campaign_id: string | null
          donation_count: number | null
          group_id: string | null
          last_donation_date: string | null
          roster_id: number | null
          roster_member_id: string | null
          total_raised: number | null
          unique_supporters: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_user_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "rosters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_user_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Rosters_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_business_engagement_scores: {
        Args: { org_id: string }
        Returns: undefined
      }
      calculate_order_items_total: {
        Args: { items_json: Json }
        Returns: number
      }
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
      generate_slug: { Args: { input_text: string }; Returns: string }
      generate_unique_district_slug: {
        Args: {
          district_id: string
          district_name: string
          district_state: string
        }
        Returns: string
      }
      generate_unique_school_slug: {
        Args: {
          school_city: string
          school_id: string
          school_name: string
          school_state: string
        }
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
      has_purchased_from_group: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      increment_campaign_amount: {
        Args: { amount: number; campaign_id: string }
        Returns: undefined
      }
      is_conversation_participant: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: boolean
      }
      is_donor_only_user: { Args: { check_user_id: string }; Returns: boolean }
      is_system_admin: { Args: { user_id: string }; Returns: boolean }
      recalculate_donor_stats: {
        Args: { p_organization_id?: string }
        Returns: {
          email: string
          new_count: number
          new_total: number
          old_count: number
          old_total: number
        }[]
      }
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
      user_can_view_business: {
        Args: { _business_id: string; _user_id: string }
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
