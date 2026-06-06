// Generated from migrations 001–011. Regenerate with `bun run db:types` after schema changes.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address1: string | null
          address2: string | null
          city: string | null
          country: string | null
          customer_id: string
          external_id: string
          first_name: string | null
          id: string
          last_name: string | null
          organization_id: string
          postcode: string | null
          province: string | null
        }
        Insert: {
          address1?: string | null
          address2?: string | null
          city?: string | null
          country?: string | null
          customer_id: string
          external_id: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_id: string
          postcode?: string | null
          province?: string | null
        }
        Update: {
          address1?: string | null
          address2?: string | null
          city?: string | null
          country?: string | null
          customer_id?: string
          external_id?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string
          postcode?: string | null
          province?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_customer_org_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "addresses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_findings: {
        Row: {
          agent_icon: string | null
          agent_name: string
          created_at: string
          detail: Json | null
          id: string
          incident_id: string
          organization_id: string
          summary: string
        }
        Insert: {
          agent_icon?: string | null
          agent_name: string
          created_at?: string
          detail?: Json | null
          id?: string
          incident_id: string
          organization_id: string
          summary: string
        }
        Update: {
          agent_icon?: string | null
          agent_name?: string
          created_at?: string
          detail?: Json | null
          id?: string
          incident_id?: string
          organization_id?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_findings_incident_org_fkey"
            columns: ["organization_id", "incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "agent_findings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount_gbp: number | null
          balance_gbp: number | null
          category: string | null
          counterparty: string | null
          date: string
          description: string | null
          external_id: string
          id: string
          organization_id: string
          raw_category: string | null
        }
        Insert: {
          amount_gbp?: number | null
          balance_gbp?: number | null
          category?: string | null
          counterparty?: string | null
          date: string
          description?: string | null
          external_id: string
          id?: string
          organization_id: string
          raw_category?: string | null
        }
        Update: {
          amount_gbp?: number | null
          balance_gbp?: number | null
          category?: string | null
          counterparty?: string | null
          date?: string
          description?: string | null
          external_id?: string
          id?: string
          organization_id?: string
          raw_category?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_reports: {
        Row: {
          created_at: string
          id: string
          narrative: string | null
          organization_id: string
          summary: Json
        }
        Insert: {
          created_at?: string
          id?: string
          narrative?: string | null
          organization_id: string
          summary: Json
        }
        Update: {
          created_at?: string
          id?: string
          narrative?: string | null
          organization_id?: string
          summary?: Json
        }
        Relationships: [
          {
            foreignKeyName: "business_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profile: {
        Row: {
          hero_product_ids: string[]
          organization_id: string
          platform: string
          primary_goal: string
          store_name: string
          updated_at: string
        }
        Insert: {
          hero_product_ids?: string[]
          organization_id: string
          platform?: string
          primary_goal?: string
          store_name?: string
          updated_at?: string
        }
        Update: {
          hero_product_ids?: string[]
          organization_id?: string
          platform?: string
          primary_goal?: string
          store_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_profile_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_settings: {
        Row: {
          key: string
          label: string | null
          organization_id: string
          value: number
        }
        Insert: {
          key: string
          label?: string | null
          organization_id: string
          value: number
        }
        Update: {
          key?: string
          label?: string | null
          organization_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          external_id: string
          id: string
          organization_id: string
          title: string | null
        }
        Insert: {
          created_at?: string
          external_id: string
          id?: string
          organization_id: string
          title?: string | null
        }
        Update: {
          created_at?: string
          external_id?: string
          id?: string
          organization_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          accepts_marketing: boolean | null
          acquisition_date: string | null
          acquisition_source: string | null
          created_at: string
          default_country: string | null
          email: string | null
          external_id: string
          first_name: string | null
          gender_segment_affinity: string | null
          id: string
          last_name: string | null
          orders_count: number | null
          organization_id: string
          total_spent: number | null
        }
        Insert: {
          accepts_marketing?: boolean | null
          acquisition_date?: string | null
          acquisition_source?: string | null
          created_at?: string
          default_country?: string | null
          email?: string | null
          external_id: string
          first_name?: string | null
          gender_segment_affinity?: string | null
          id?: string
          last_name?: string | null
          orders_count?: number | null
          organization_id: string
          total_spent?: number | null
        }
        Update: {
          accepts_marketing?: boolean | null
          acquisition_date?: string | null
          acquisition_source?: string | null
          created_at?: string
          default_country?: string | null
          email?: string | null
          external_id?: string
          first_name?: string | null
          gender_segment_affinity?: string | null
          id?: string
          last_name?: string | null
          orders_count?: number | null
          organization_id?: string
          total_spent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          code: string
          ends_at: string | null
          external_id: string
          id: string
          organization_id: string
          starts_at: string | null
          type: string | null
          usage_count: number | null
          value: number | null
        }
        Insert: {
          code: string
          ends_at?: string | null
          external_id: string
          id?: string
          organization_id: string
          starts_at?: string | null
          type?: string | null
          usage_count?: number | null
          value?: number | null
        }
        Update: {
          code?: string
          ends_at?: string | null
          external_id?: string
          id?: string
          organization_id?: string
          starts_at?: string | null
          type?: string | null
          usage_count?: number | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          attributed_orders: number | null
          attributed_revenue_gbp: number | null
          clicks: number | null
          external_id: string
          id: string
          name: string | null
          opens: number | null
          organization_id: string
          recipients: number | null
          sent_at: string | null
          type: string | null
          unsubscribes: number | null
        }
        Insert: {
          attributed_orders?: number | null
          attributed_revenue_gbp?: number | null
          clicks?: number | null
          external_id: string
          id?: string
          name?: string | null
          opens?: number | null
          organization_id: string
          recipients?: number | null
          sent_at?: string | null
          type?: string | null
          unsubscribes?: number | null
        }
        Update: {
          attributed_orders?: number | null
          attributed_revenue_gbp?: number | null
          clicks?: number | null
          external_id?: string
          id?: string
          name?: string | null
          opens?: number | null
          organization_id?: string
          recipients?: number | null
          sent_at?: string | null
          type?: string | null
          unsubscribes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          campaign_id: string | null
          customer_id: string | null
          event_type: string | null
          external_id: string
          id: string
          organization_id: string
          timestamp: string | null
        }
        Insert: {
          campaign_id?: string | null
          customer_id?: string | null
          event_type?: string | null
          external_id: string
          id?: string
          organization_id: string
          timestamp?: string | null
        }
        Update: {
          campaign_id?: string | null
          customer_id?: string | null
          event_type?: string | null
          external_id?: string
          id?: string
          organization_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_campaign_org_fkey"
            columns: ["organization_id", "campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "email_events_customer_org_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "email_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      forecast_rules: {
        Row: {
          created_at: string
          enabled: boolean
          horizon_days: number
          id: string
          kind: Database["public"]["Enums"]["forecast_rule_kind"]
          organization_id: string
          rule_key: string
          severity: Database["public"]["Enums"]["metric_severity"]
          threshold: number
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          horizon_days?: number
          id?: string
          kind: Database["public"]["Enums"]["forecast_rule_kind"]
          organization_id: string
          rule_key: string
          severity?: Database["public"]["Enums"]["metric_severity"]
          threshold: number
        }
        Update: {
          created_at?: string
          enabled?: boolean
          horizon_days?: number
          id?: string
          kind?: Database["public"]["Enums"]["forecast_rule_kind"]
          organization_id?: string
          rule_key?: string
          severity?: Database["public"]["Enums"]["metric_severity"]
          threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "forecast_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      google_ads_daily: {
        Row: {
          ad_group: string
          campaign_name: string
          campaign_type: string | null
          clicks: number | null
          conversion_value_gbp: number | null
          conversions: number | null
          date: string
          id: string
          impressions: number | null
          organization_id: string
          spend_gbp: number | null
        }
        Insert: {
          ad_group?: string
          campaign_name: string
          campaign_type?: string | null
          clicks?: number | null
          conversion_value_gbp?: number | null
          conversions?: number | null
          date: string
          id?: string
          impressions?: number | null
          organization_id: string
          spend_gbp?: number | null
        }
        Update: {
          ad_group?: string
          campaign_name?: string
          campaign_type?: string | null
          clicks?: number | null
          conversion_value_gbp?: number | null
          conversions?: number | null
          date?: string
          id?: string
          impressions?: number | null
          organization_id?: string
          spend_gbp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "google_ads_daily_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_actions: {
        Row: {
          approved_at: string | null
          approved_by_user_id: string | null
          auto_deploy: boolean
          created_at: string
          deployed_at: string | null
          description: string | null
          id: string
          impact_level: Database["public"]["Enums"]["impact_level"] | null
          incident_id: string
          organization_id: string
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          status: Database["public"]["Enums"]["incident_action_status"]
          title: string
        }
        Insert: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          auto_deploy?: boolean
          created_at?: string
          deployed_at?: string | null
          description?: string | null
          id?: string
          impact_level?: Database["public"]["Enums"]["impact_level"] | null
          incident_id: string
          organization_id: string
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          status?: Database["public"]["Enums"]["incident_action_status"]
          title: string
        }
        Update: {
          approved_at?: string | null
          approved_by_user_id?: string | null
          auto_deploy?: boolean
          created_at?: string
          deployed_at?: string | null
          description?: string | null
          id?: string
          impact_level?: Database["public"]["Enums"]["impact_level"] | null
          incident_id?: string
          organization_id?: string
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          status?: Database["public"]["Enums"]["incident_action_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_actions_incident_org_fkey"
            columns: ["organization_id", "incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "incident_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_timeline: {
        Row: {
          created_at: string
          description: string
          event_type: Database["public"]["Enums"]["timeline_event_type"]
          id: string
          incident_id: string
          metadata: Json | null
          organization_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_type: Database["public"]["Enums"]["timeline_event_type"]
          id?: string
          incident_id: string
          metadata?: Json | null
          organization_id: string
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: Database["public"]["Enums"]["timeline_event_type"]
          id?: string
          incident_id?: string
          metadata?: Json | null
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_timeline_incident_org_fkey"
            columns: ["organization_id", "incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "incident_timeline_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      investigation_steps: {
        Row: {
          agent_name: string
          created_at: string
          id: string
          incident_id: string
          label: string
          metadata: Json | null
          organization_id: string
          run_id: string
          status: Database["public"]["Enums"]["investigation_step_status"]
          step_key: string
          updated_at: string
        }
        Insert: {
          agent_name: string
          created_at?: string
          id?: string
          incident_id: string
          label: string
          metadata?: Json | null
          organization_id: string
          run_id: string
          status?: Database["public"]["Enums"]["investigation_step_status"]
          step_key: string
          updated_at?: string
        }
        Update: {
          agent_name?: string
          created_at?: string
          id?: string
          incident_id?: string
          label?: string
          metadata?: Json | null
          organization_id?: string
          run_id?: string
          status?: Database["public"]["Enums"]["investigation_step_status"]
          step_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investigation_steps_incident_org_fkey"
            columns: ["organization_id", "incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "investigation_steps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          affected_kpi_keys: string[]
          baseline_value: number | null
          created_at: string
          fix_proposed_at: string | null
          id: string
          impact_amount: number | null
          impact_label: string | null
          investigation_started_at: string | null
          monitoring_kpi: string | null
          monitoring_started_at: string | null
          organization_id: string
          product_id: string | null
          recovery_pct: number
          resolved_at: string | null
          root_cause: string | null
          root_cause_confidence: number | null
          severity: Database["public"]["Enums"]["incident_severity"]
          status: Database["public"]["Enums"]["incident_status"]
          target_value: number | null
          title: string
          updated_at: string
        }
        Insert: {
          affected_kpi_keys?: string[]
          baseline_value?: number | null
          created_at?: string
          fix_proposed_at?: string | null
          id?: string
          impact_amount?: number | null
          impact_label?: string | null
          investigation_started_at?: string | null
          monitoring_kpi?: string | null
          monitoring_started_at?: string | null
          organization_id: string
          product_id?: string | null
          recovery_pct?: number
          resolved_at?: string | null
          root_cause?: string | null
          root_cause_confidence?: number | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          target_value?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          affected_kpi_keys?: string[]
          baseline_value?: number | null
          created_at?: string
          fix_proposed_at?: string | null
          id?: string
          impact_amount?: number | null
          impact_label?: string | null
          investigation_started_at?: string | null
          monitoring_kpi?: string | null
          monitoring_started_at?: string | null
          organization_id?: string
          product_id?: string | null
          recovery_pct?: number
          resolved_at?: string | null
          root_cause?: string | null
          root_cause_confidence?: number | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          target_value?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_product_org_fkey"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          date: string
          external_id: string
          id: string
          organization_id: string
          quantity_delta: number | null
          reference_id: string | null
          running_balance: number | null
          type: string | null
          variant_id: string
        }
        Insert: {
          date: string
          external_id: string
          id?: string
          organization_id: string
          quantity_delta?: number | null
          reference_id?: string | null
          running_balance?: number | null
          type?: string | null
          variant_id: string
        }
        Update: {
          date?: string
          external_id?: string
          id?: string
          organization_id?: string
          quantity_delta?: number | null
          reference_id?: string | null
          running_balance?: number | null
          type?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variant_org_fkey"
            columns: ["organization_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      line_items: {
        Row: {
          external_id: string
          id: string
          order_id: string
          organization_id: string
          price: number | null
          product_id: string
          quantity: number | null
          title: string | null
          total_discount: number | null
          variant_id: string | null
        }
        Insert: {
          external_id: string
          id?: string
          order_id: string
          organization_id: string
          price?: number | null
          product_id: string
          quantity?: number | null
          title?: string | null
          total_discount?: number | null
          variant_id?: string | null
        }
        Update: {
          external_id?: string
          id?: string
          order_id?: string
          organization_id?: string
          price?: number | null
          product_id?: string
          quantity?: number | null
          title?: string | null
          total_discount?: number | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "line_items_order_org_fkey"
            columns: ["organization_id", "order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "line_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_product_org_fkey"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "line_items_variant_org_fkey"
            columns: ["organization_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      meta_ads_daily: {
        Row: {
          ad_name: string
          ad_set: string | null
          campaign_name: string
          campaign_objective: string | null
          clicks: number | null
          conversion_value_gbp: number | null
          conversions: number | null
          date: string
          id: string
          impressions: number | null
          organization_id: string
          placement: string
          spend_gbp: number | null
        }
        Insert: {
          ad_name?: string
          ad_set?: string | null
          campaign_name: string
          campaign_objective?: string | null
          clicks?: number | null
          conversion_value_gbp?: number | null
          conversions?: number | null
          date: string
          id?: string
          impressions?: number | null
          organization_id: string
          placement?: string
          spend_gbp?: number | null
        }
        Update: {
          ad_name?: string
          ad_set?: string | null
          campaign_name?: string
          campaign_objective?: string | null
          clicks?: number | null
          conversion_value_gbp?: number | null
          conversions?: number | null
          date?: string
          id?: string
          impressions?: number | null
          organization_id?: string
          placement?: string
          spend_gbp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meta_ads_daily_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_definitions: {
        Row: {
          created_at: string
          default_threshold: number
          denominator_field: string | null
          denominator_source: string | null
          description: string | null
          direction: Database["public"]["Enums"]["metric_direction"]
          display_name: string
          enabled: boolean
          id: string
          impact_field: string | null
          impact_label: string | null
          impact_source: string | null
          metric_key: string
          numerator_field: string
          numerator_source: string
          operation: Database["public"]["Enums"]["metric_operation"]
          organization_id: string
          severity: Database["public"]["Enums"]["metric_severity"]
          sort_order: number
          unit: Database["public"]["Enums"]["metric_unit"]
          window_days: number
        }
        Insert: {
          created_at?: string
          default_threshold: number
          denominator_field?: string | null
          denominator_source?: string | null
          description?: string | null
          direction: Database["public"]["Enums"]["metric_direction"]
          display_name: string
          enabled?: boolean
          id?: string
          impact_field?: string | null
          impact_label?: string | null
          impact_source?: string | null
          metric_key: string
          numerator_field: string
          numerator_source: string
          operation?: Database["public"]["Enums"]["metric_operation"]
          organization_id: string
          severity?: Database["public"]["Enums"]["metric_severity"]
          sort_order?: number
          unit?: Database["public"]["Enums"]["metric_unit"]
          window_days?: number
        }
        Update: {
          created_at?: string
          default_threshold?: number
          denominator_field?: string | null
          denominator_source?: string | null
          description?: string | null
          direction?: Database["public"]["Enums"]["metric_direction"]
          display_name?: string
          enabled?: boolean
          id?: string
          impact_field?: string | null
          impact_label?: string | null
          impact_source?: string | null
          metric_key?: string
          numerator_field?: string
          numerator_source?: string
          operation?: Database["public"]["Enums"]["metric_operation"]
          organization_id?: string
          severity?: Database["public"]["Enums"]["metric_severity"]
          sort_order?: number
          unit?: Database["public"]["Enums"]["metric_unit"]
          window_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "metric_definitions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string | null
          customer_id: string | null
          discount_code: string | null
          external_id: string
          financial_status: string | null
          fulfillment_status: string | null
          id: string
          landing_site: string | null
          order_number: string | null
          organization_id: string
          referring_site: string | null
          subtotal: number | null
          tags: string | null
          total_discounts: number | null
          total_price: number | null
          total_shipping: number | null
          total_tax: number | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          discount_code?: string | null
          external_id: string
          financial_status?: string | null
          fulfillment_status?: string | null
          id?: string
          landing_site?: string | null
          order_number?: string | null
          organization_id: string
          referring_site?: string | null
          subtotal?: number | null
          tags?: string | null
          total_discounts?: number | null
          total_price?: number | null
          total_shipping?: number | null
          total_tax?: number | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          discount_code?: string | null
          external_id?: string
          financial_status?: string | null
          fulfillment_status?: string | null
          id?: string
          landing_site?: string | null
          order_number?: string | null
          organization_id?: string
          referring_site?: string | null
          subtotal?: number | null
          tags?: string | null
          total_discounts?: number | null
          total_price?: number | null
          total_shipping?: number | null
          total_tax?: number | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_org_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slack_channel_id: string | null
          slack_team_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slack_channel_id?: string | null
          slack_team_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slack_channel_id?: string | null
          slack_team_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      po_line_items: {
        Row: {
          external_id: string
          id: string
          landed_cost_per_unit_gbp: number | null
          organization_id: string
          po_id: string
          quantity_ordered: number | null
          quantity_received: number | null
          unit_cost_supplier_ccy: number | null
          variant_id: string
        }
        Insert: {
          external_id: string
          id?: string
          landed_cost_per_unit_gbp?: number | null
          organization_id: string
          po_id: string
          quantity_ordered?: number | null
          quantity_received?: number | null
          unit_cost_supplier_ccy?: number | null
          variant_id: string
        }
        Update: {
          external_id?: string
          id?: string
          landed_cost_per_unit_gbp?: number | null
          organization_id?: string
          po_id?: string
          quantity_ordered?: number | null
          quantity_received?: number | null
          unit_cost_supplier_ccy?: number | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "po_line_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_line_items_po_org_fkey"
            columns: ["organization_id", "po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "po_line_items_variant_org_fkey"
            columns: ["organization_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      product_baselines: {
        Row: {
          computed_at: string
          mean: number
          metric_definition_id: string
          organization_id: string
          product_id: string
          sample_n: number
          stddev: number
        }
        Insert: {
          computed_at?: string
          mean: number
          metric_definition_id: string
          organization_id: string
          product_id: string
          sample_n: number
          stddev: number
        }
        Update: {
          computed_at?: string
          mean?: number
          metric_definition_id?: string
          organization_id?: string
          product_id?: string
          sample_n?: number
          stddev?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_baselines_metric_org_fkey"
            columns: ["organization_id", "metric_definition_id"]
            isOneToOne: false
            referencedRelation: "metric_definitions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "product_baselines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_baselines_product_org_fkey"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      product_collections: {
        Row: {
          collection_id: string
          id: string
          organization_id: string
          product_id: string
        }
        Insert: {
          collection_id: string
          id?: string
          organization_id: string
          product_id: string
        }
        Update: {
          collection_id?: string
          id?: string
          organization_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_collections_collection_org_fkey"
            columns: ["organization_id", "collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "product_collections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_collections_product_org_fkey"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      product_cost_overrides: {
        Row: {
          cost_per_unit: number
          organization_id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          cost_per_unit: number
          organization_id: string
          product_id: string
          updated_at?: string
        }
        Update: {
          cost_per_unit?: number
          organization_id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_cost_overrides_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_cost_overrides_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_kpi_thresholds: {
        Row: {
          active: boolean
          created_at: string
          direction: Database["public"]["Enums"]["metric_direction"] | null
          id: string
          metric_definition_id: string
          organization_id: string
          product_id: string
          threshold: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          direction?: Database["public"]["Enums"]["metric_direction"] | null
          id?: string
          metric_definition_id: string
          organization_id: string
          product_id: string
          threshold: number
        }
        Update: {
          active?: boolean
          created_at?: string
          direction?: Database["public"]["Enums"]["metric_direction"] | null
          id?: string
          metric_definition_id?: string
          organization_id?: string
          product_id?: string
          threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_kpi_thresholds_metric_org_fkey"
            columns: ["organization_id", "metric_definition_id"]
            isOneToOne: false
            referencedRelation: "metric_definitions"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "product_kpi_thresholds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_kpi_thresholds_product_org_fkey"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      products: {
        Row: {
          collection_id: string | null
          created_at: string
          description: string | null
          external_id: string
          gender_segment: string | null
          handle: string | null
          id: string
          organization_id: string
          product_type: string | null
          status: string | null
          tags: string | null
          title: string | null
          vendor: string | null
        }
        Insert: {
          collection_id?: string | null
          created_at?: string
          description?: string | null
          external_id: string
          gender_segment?: string | null
          handle?: string | null
          id?: string
          organization_id: string
          product_type?: string | null
          status?: string | null
          tags?: string | null
          title?: string | null
          vendor?: string | null
        }
        Update: {
          collection_id?: string | null
          created_at?: string
          description?: string | null
          external_id?: string
          gender_segment?: string | null
          handle?: string | null
          id?: string
          organization_id?: string
          product_type?: string | null
          status?: string | null
          tags?: string | null
          title?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_collection_org_fkey"
            columns: ["organization_id", "collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          actual_delivery: string | null
          balance_paid_at: string | null
          created_at: string
          deposit_paid_at: string | null
          expected_delivery: string | null
          external_id: string
          id: string
          organization_id: string
          status: string | null
          supplier_id: string | null
          total_cost_gbp: number | null
          total_cost_supplier_ccy: number | null
        }
        Insert: {
          actual_delivery?: string | null
          balance_paid_at?: string | null
          created_at?: string
          deposit_paid_at?: string | null
          expected_delivery?: string | null
          external_id: string
          id?: string
          organization_id: string
          status?: string | null
          supplier_id?: string | null
          total_cost_gbp?: number | null
          total_cost_supplier_ccy?: number | null
        }
        Update: {
          actual_delivery?: string | null
          balance_paid_at?: string | null
          created_at?: string
          deposit_paid_at?: string | null
          expected_delivery?: string | null
          external_id?: string
          id?: string
          organization_id?: string
          status?: string | null
          supplier_id?: string | null
          total_cost_gbp?: number | null
          total_cost_supplier_ccy?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          external_id: string
          id: string
          order_id: string
          organization_id: string
          reason: string | null
          refund_line_items: Json
        }
        Insert: {
          amount: number
          created_at?: string
          external_id: string
          id?: string
          order_id: string
          organization_id: string
          reason?: string | null
          refund_line_items?: Json
        }
        Update: {
          amount?: number
          created_at?: string
          external_id?: string
          id?: string
          order_id?: string
          organization_id?: string
          reason?: string | null
          refund_line_items?: Json
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_org_fkey"
            columns: ["organization_id", "order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "refunds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      store_connections: {
        Row: {
          connected_at: string | null
          created_at: string
          external_shop_id: string | null
          last_synced_at: string | null
          metadata: Json
          organization_id: string
          platform: Database["public"]["Enums"]["store_platform"]
          replay_cursor: string | null
          status: Database["public"]["Enums"]["store_connection_status"]
          sync_mode: Database["public"]["Enums"]["store_sync_mode"]
          updated_at: string
        }
        Insert: {
          connected_at?: string | null
          created_at?: string
          external_shop_id?: string | null
          last_synced_at?: string | null
          metadata?: Json
          organization_id: string
          platform?: Database["public"]["Enums"]["store_platform"]
          replay_cursor?: string | null
          status?: Database["public"]["Enums"]["store_connection_status"]
          sync_mode?: Database["public"]["Enums"]["store_sync_mode"]
          updated_at?: string
        }
        Update: {
          connected_at?: string | null
          created_at?: string
          external_shop_id?: string | null
          last_synced_at?: string | null
          metadata?: Json
          organization_id?: string
          platform?: Database["public"]["Enums"]["store_platform"]
          replay_cursor?: string | null
          status?: Database["public"]["Enums"]["store_connection_status"]
          sync_mode?: Database["public"]["Enums"]["store_sync_mode"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          country: string | null
          currency: string | null
          external_id: string
          id: string
          lead_time_days: number | null
          name: string | null
          organization_id: string
          payment_terms: string | null
        }
        Insert: {
          country?: string | null
          currency?: string | null
          external_id: string
          id?: string
          lead_time_days?: number | null
          name?: string | null
          organization_id: string
          payment_terms?: string | null
        }
        Update: {
          country?: string | null
          currency?: string | null
          external_id?: string
          id?: string
          lead_time_days?: number | null
          name?: string | null
          organization_id?: string
          payment_terms?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          external_id: string
          id: string
          messages: Json
          organization_id: string
          ticket_id: string
        }
        Insert: {
          external_id: string
          id?: string
          messages?: Json
          organization_id: string
          ticket_id: string
        }
        Update: {
          external_id?: string
          id?: string
          messages?: Json
          organization_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_ticket_org_fkey"
            columns: ["organization_id", "ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string | null
          channel: string | null
          created_at: string
          customer_id: string | null
          external_id: string
          first_response_at: string | null
          id: string
          organization_id: string
          priority: string | null
          related_order_id: string | null
          related_product_id: string | null
          resolution_time_minutes: number | null
          resolved_at: string | null
          resolved_by: string | null
          satisfaction_rating: number | null
          status: string | null
          subject: string | null
        }
        Insert: {
          category?: string | null
          channel?: string | null
          created_at?: string
          customer_id?: string | null
          external_id: string
          first_response_at?: string | null
          id?: string
          organization_id: string
          priority?: string | null
          related_order_id?: string | null
          related_product_id?: string | null
          resolution_time_minutes?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          satisfaction_rating?: number | null
          status?: string | null
          subject?: string | null
        }
        Update: {
          category?: string | null
          channel?: string | null
          created_at?: string
          customer_id?: string | null
          external_id?: string
          first_response_at?: string | null
          id?: string
          organization_id?: string
          priority?: string | null
          related_order_id?: string | null
          related_product_id?: string | null
          resolution_time_minutes?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          satisfaction_rating?: number | null
          status?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_customer_org_fkey"
            columns: ["organization_id", "customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "support_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_related_order_org_fkey"
            columns: ["organization_id", "related_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "support_tickets_related_product_org_fkey"
            columns: ["organization_id", "related_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      waitlist_signups: {
        Row: {
          agreed_price_cents: number | null
          confirmation_token: string
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          negotiation_completed_at: string | null
          negotiation_status: Database["public"]["Enums"]["negotiation_status"]
          offered_price_cents: number | null
          selected_tier: Database["public"]["Enums"]["pricing_tier"] | null
          welcome_sent_at: string | null
        }
        Insert: {
          agreed_price_cents?: number | null
          confirmation_token?: string
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          negotiation_completed_at?: string | null
          negotiation_status?: Database["public"]["Enums"]["negotiation_status"]
          offered_price_cents?: number | null
          selected_tier?: Database["public"]["Enums"]["pricing_tier"] | null
          welcome_sent_at?: string | null
        }
        Update: {
          agreed_price_cents?: number | null
          confirmation_token?: string
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          negotiation_completed_at?: string | null
          negotiation_status?: Database["public"]["Enums"]["negotiation_status"]
          offered_price_cents?: number | null
          selected_tier?: Database["public"]["Enums"]["pricing_tier"] | null
          welcome_sent_at?: string | null
        }
        Relationships: []
      }
      waitlist_pricing_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["pricing_message_role"]
          waitlist_signup_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["pricing_message_role"]
          waitlist_signup_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["pricing_message_role"]
          waitlist_signup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_pricing_messages_waitlist_signup_id_fkey"
            columns: ["waitlist_signup_id"]
            isOneToOne: false
            referencedRelation: "waitlist_signups"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_pricing_state: {
        Row: {
          company_signals: Json
          current_offer_cents: number | null
          updated_at: string
          user_budget_cents: number | null
          waitlist_signup_id: string
        }
        Insert: {
          company_signals?: Json
          current_offer_cents?: number | null
          updated_at?: string
          user_budget_cents?: number | null
          waitlist_signup_id: string
        }
        Update: {
          company_signals?: Json
          current_offer_cents?: number | null
          updated_at?: string
          user_budget_cents?: number | null
          waitlist_signup_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_pricing_state_waitlist_signup_id_fkey"
            columns: ["waitlist_signup_id"]
            isOneToOne: true
            referencedRelation: "waitlist_signups"
            referencedColumns: ["id"]
          },
        ]
      }
      variants: {
        Row: {
          barcode: string | null
          compare_at_price: number | null
          external_id: string
          id: string
          inventory_quantity: number | null
          option1_name: string | null
          option1_value: string | null
          option2_name: string | null
          option2_value: string | null
          organization_id: string
          price: number | null
          product_id: string
          sku: string | null
          weight_grams: number | null
        }
        Insert: {
          barcode?: string | null
          compare_at_price?: number | null
          external_id: string
          id?: string
          inventory_quantity?: number | null
          option1_name?: string | null
          option1_value?: string | null
          option2_name?: string | null
          option2_value?: string | null
          organization_id: string
          price?: number | null
          product_id: string
          sku?: string | null
          weight_grams?: number | null
        }
        Update: {
          barcode?: string | null
          compare_at_price?: number | null
          external_id?: string
          id?: string
          inventory_quantity?: number | null
          option1_name?: string | null
          option1_value?: string | null
          option2_name?: string | null
          option2_value?: string | null
          organization_id?: string
          price?: number | null
          product_id?: string
          sku?: string | null
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "variants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variants_product_org_fkey"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      product_daily_outflow: {
        Args: { p_asof?: string; p_days?: number; p_organization_id: string }
        Returns: {
          current_balance: number
          daily_outflow: number
          product_id: string
        }[]
      }
      product_monthly_series: {
        Args: { p_months?: number; p_organization_id: string }
        Returns: {
          ad_revenue: number
          ad_spend: number
          month: string
          product_id: string
          refund_amount: number
          refund_count: number
          revenue: number
          units: number
        }[]
      }
      product_source_facts: {
        Args: {
          p_asof?: string
          p_organization_id: string
          p_window_days?: number
        }
        Returns: {
          ads_revenue: number
          ads_spend: number
          product_id: string
          refunds_amount: number
          refunds_count: number
          sales_revenue: number
          sales_units: number
          support_count: number
        }[]
      }
      reset_organization_data: {
        Args: { p_organization_id: string }
        Returns: undefined
      }
      seed_organization_defaults: {
        Args: { p_organization_id: string }
        Returns: undefined
      }
    }
    Enums: {
      forecast_rule_kind:
        | "stockout"
        | "refund_trend"
        | "roas_decay"
        | "revenue_drop"
      impact_level: "high" | "medium" | "low"
      incident_action_status:
        | "proposed"
        | "approved"
        | "rejected"
        | "deployed"
        | "monitoring"
      incident_severity: "critical" | "high" | "medium" | "low"
      investigation_step_status: "running" | "done" | "error"
      incident_status:
        | "detected"
        | "investigating"
        | "fix_proposed"
        | "awaiting_approval"
        | "deploying"
        | "monitoring"
        | "resolved"
        | "canceled"
      metric_direction: "above" | "below"
      metric_operation: "ratio" | "value"
      metric_severity: "critical" | "high" | "medium" | "low"
      metric_unit: "ratio" | "currency" | "count" | "percentage"
      negotiation_status:
        | "not_started"
        | "in_progress"
        | "accepted"
        | "declined"
        | "expired"
      organization_role: "owner" | "admin" | "member"
      pricing_message_role: "user" | "assistant" | "system"
      pricing_tier: "teams" | "enterprise"
      risk_level: "high" | "medium" | "low"
      store_connection_status:
        | "pending"
        | "importing"
        | "connected"
        | "error"
        | "disconnected"
      store_platform: "mock_csv" | "shopify"
      store_sync_mode: "static" | "pull" | "push"
      timeline_event_type:
        | "anomaly_detected"
        | "incident_created"
        | "agent_assigned"
        | "root_cause_found"
        | "action_proposed"
        | "approved"
        | "deployed"
        | "monitoring"
        | "resolved"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      forecast_rule_kind: [
        "stockout",
        "refund_trend",
        "roas_decay",
        "revenue_drop",
      ],
      impact_level: ["high", "medium", "low"],
      incident_action_status: [
        "proposed",
        "approved",
        "rejected",
        "deployed",
        "monitoring",
      ],
      incident_severity: ["critical", "high", "medium", "low"],
      investigation_step_status: ["running", "done", "error"],
      incident_status: [
        "detected",
        "investigating",
        "fix_proposed",
        "awaiting_approval",
        "deploying",
        "monitoring",
        "resolved",
        "canceled",
      ],
      metric_direction: ["above", "below"],
      metric_operation: ["ratio", "value"],
      metric_severity: ["critical", "high", "medium", "low"],
      metric_unit: ["ratio", "currency", "count", "percentage"],
      negotiation_status: [
        "not_started",
        "in_progress",
        "accepted",
        "declined",
        "expired",
      ],
      organization_role: ["owner", "admin", "member"],
      pricing_message_role: ["user", "assistant", "system"],
      pricing_tier: ["teams", "enterprise"],
      risk_level: ["high", "medium", "low"],
      store_connection_status: [
        "pending",
        "importing",
        "connected",
        "error",
        "disconnected",
      ],
      store_platform: ["mock_csv", "shopify"],
      store_sync_mode: ["static", "pull", "push"],
      timeline_event_type: [
        "anomaly_detected",
        "incident_created",
        "agent_assigned",
        "root_cause_found",
        "action_proposed",
        "approved",
        "deployed",
        "monitoring",
        "resolved",
      ],
    },
  },
} as const

