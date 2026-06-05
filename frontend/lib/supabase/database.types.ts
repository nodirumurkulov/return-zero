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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_findings: {
        Row: {
          agent_icon: string | null
          agent_name: string
          created_at: string
          detail: Json | null
          id: string
          incident_id: string
          summary: string
        }
        Insert: {
          agent_icon?: string | null
          agent_name: string
          created_at?: string
          detail?: Json | null
          id?: string
          incident_id: string
          summary: string
        }
        Update: {
          agent_icon?: string | null
          agent_name?: string
          created_at?: string
          detail?: Json | null
          id?: string
          incident_id?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_findings_incident_id_fkey"
            columns: ["incident_id"]
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profile: {
        Row: {
          hero_product_ids: string[]
          id: boolean
          platform: string
          primary_goal: string
          store_name: string
          updated_at: string
        }
        Insert: {
          hero_product_ids?: string[]
          id?: boolean
          platform?: string
          primary_goal?: string
          store_name?: string
          updated_at?: string
        }
        Update: {
          hero_product_ids?: string[]
          id?: boolean
          platform?: string
          primary_goal?: string
          store_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_reports: {
        Row: {
          created_at: string
          id: string
          narrative: string | null
          summary: Json
        }
        Insert: {
          created_at?: string
          id?: string
          narrative?: string | null
          summary: Json
        }
        Update: {
          created_at?: string
          id?: string
          narrative?: string | null
          summary?: Json
        }
        Relationships: []
      }
      business_settings: {
        Row: {
          key: string
          label: string | null
          value: number
        }
        Insert: {
          key: string
          label?: string | null
          value: number
        }
        Update: {
          key?: string
          label?: string | null
          value?: number
        }
        Relationships: []
      }
      collections: {
        Row: {
          collection_id: string
          created_at: string | null
          title: string | null
        }
        Insert: {
          collection_id: string
          created_at?: string | null
          title?: string | null
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          title?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          accepts_marketing: boolean | null
          acquisition_date: string | null
          acquisition_source: string | null
          created_at: string | null
          customer_id: string
          default_country: string | null
          email: string | null
          first_name: string | null
          gender_segment_affinity: string | null
          last_name: string | null
          orders_count: number | null
          total_spent: number | null
        }
        Insert: {
          accepts_marketing?: boolean | null
          acquisition_date?: string | null
          acquisition_source?: string | null
          created_at?: string | null
          customer_id: string
          default_country?: string | null
          email?: string | null
          first_name?: string | null
          gender_segment_affinity?: string | null
          last_name?: string | null
          orders_count?: number | null
          total_spent?: number | null
        }
        Update: {
          accepts_marketing?: boolean | null
          acquisition_date?: string | null
          acquisition_source?: string | null
          created_at?: string | null
          customer_id?: string
          default_country?: string | null
          email?: string | null
          first_name?: string | null
          gender_segment_affinity?: string | null
          last_name?: string | null
          orders_count?: number | null
          total_spent?: number | null
        }
        Relationships: []
      }
      forecast_rules: {
        Row: {
          created_at: string
          enabled: boolean
          horizon_days: number
          id: string
          kind: string
          rule_key: string
          severity: string
          threshold: number
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          horizon_days?: number
          id?: string
          kind: string
          rule_key: string
          severity?: string
          threshold: number
        }
        Update: {
          created_at?: string
          enabled?: boolean
          horizon_days?: number
          id?: string
          kind?: string
          rule_key?: string
          severity?: string
          threshold?: number
        }
        Relationships: []
      }
      google_ads_daily: {
        Row: {
          ad_group: string | null
          campaign_name: string | null
          campaign_type: string | null
          clicks: number | null
          conversion_value_gbp: number | null
          conversions: number | null
          date: string | null
          id: string
          impressions: number | null
          spend_gbp: number | null
        }
        Insert: {
          ad_group?: string | null
          campaign_name?: string | null
          campaign_type?: string | null
          clicks?: number | null
          conversion_value_gbp?: number | null
          conversions?: number | null
          date?: string | null
          id?: string
          impressions?: number | null
          spend_gbp?: number | null
        }
        Update: {
          ad_group?: string | null
          campaign_name?: string | null
          campaign_type?: string | null
          clicks?: number | null
          conversion_value_gbp?: number | null
          conversions?: number | null
          date?: string | null
          id?: string
          impressions?: number | null
          spend_gbp?: number | null
        }
        Relationships: []
      }
      google_ads_daily_stream: {
        Row: {
          ad_group: string | null
          campaign_name: string | null
          campaign_type: string | null
          clicks: number | null
          conversion_value_gbp: number | null
          conversions: number | null
          date: string | null
          id: string
          impressions: number | null
          spend_gbp: number | null
        }
        Insert: {
          ad_group?: string | null
          campaign_name?: string | null
          campaign_type?: string | null
          clicks?: number | null
          conversion_value_gbp?: number | null
          conversions?: number | null
          date?: string | null
          id?: string
          impressions?: number | null
          spend_gbp?: number | null
        }
        Update: {
          ad_group?: string | null
          campaign_name?: string | null
          campaign_type?: string | null
          clicks?: number | null
          conversion_value_gbp?: number | null
          conversions?: number | null
          date?: string | null
          id?: string
          impressions?: number | null
          spend_gbp?: number | null
        }
        Relationships: []
      }
      incident_actions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          auto_deploy: boolean
          created_at: string
          deployed_at: string | null
          description: string | null
          id: string
          impact_level: string | null
          incident_id: string
          risk_level: string | null
          status: string
          title: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          auto_deploy?: boolean
          created_at?: string
          deployed_at?: string | null
          description?: string | null
          id?: string
          impact_level?: string | null
          incident_id: string
          risk_level?: string | null
          status?: string
          title: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          auto_deploy?: boolean
          created_at?: string
          deployed_at?: string | null
          description?: string | null
          id?: string
          impact_level?: string | null
          incident_id?: string
          risk_level?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_actions_incident_id_fkey"
            columns: ["incident_id"]
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_timeline: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: string
          incident_id: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: string
          incident_id: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          incident_id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_timeline_incident_id_fkey"
            columns: ["incident_id"]
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          affected_kpis: Json | null
          affected_product: string | null
          baseline_value: number | null
          created_at: string
          fix_proposed_at: string | null
          id: string
          impact_amount: number | null
          impact_label: string | null
          investigation_started_at: string | null
          monitoring_kpi: string | null
          monitoring_started_at: string | null
          recovery_pct: number
          resolved_at: string | null
          root_cause: string | null
          root_cause_confidence: number | null
          severity: string
          status: string
          target_value: number | null
          title: string
        }
        Insert: {
          affected_kpis?: Json | null
          affected_product?: string | null
          baseline_value?: number | null
          created_at?: string
          fix_proposed_at?: string | null
          id?: string
          impact_amount?: number | null
          impact_label?: string | null
          investigation_started_at?: string | null
          monitoring_kpi?: string | null
          monitoring_started_at?: string | null
          recovery_pct?: number
          resolved_at?: string | null
          root_cause?: string | null
          root_cause_confidence?: number | null
          severity?: string
          status?: string
          target_value?: number | null
          title: string
        }
        Update: {
          affected_kpis?: Json | null
          affected_product?: string | null
          baseline_value?: number | null
          created_at?: string
          fix_proposed_at?: string | null
          id?: string
          impact_amount?: number | null
          impact_label?: string | null
          investigation_started_at?: string | null
          monitoring_kpi?: string | null
          monitoring_started_at?: string | null
          recovery_pct?: number
          resolved_at?: string | null
          root_cause?: string | null
          root_cause_confidence?: number | null
          severity?: string
          status?: string
          target_value?: number | null
          title?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          date: string | null
          movement_id: string
          quantity_delta: number | null
          reference_id: string | null
          running_balance: number | null
          type: string | null
          variant_id: string | null
        }
        Insert: {
          date?: string | null
          movement_id: string
          quantity_delta?: number | null
          reference_id?: string | null
          running_balance?: number | null
          type?: string | null
          variant_id?: string | null
        }
        Update: {
          date?: string | null
          movement_id?: string
          quantity_delta?: number | null
          reference_id?: string | null
          running_balance?: number | null
          type?: string | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            referencedRelation: "variants"
            referencedColumns: ["variant_id"]
          },
        ]
      }
      inventory_movements_stream: {
        Row: {
          date: string | null
          movement_id: string
          quantity_delta: number | null
          reference_id: string | null
          running_balance: number | null
          type: string | null
          variant_id: string | null
        }
        Insert: {
          date?: string | null
          movement_id: string
          quantity_delta?: number | null
          reference_id?: string | null
          running_balance?: number | null
          type?: string | null
          variant_id?: string | null
        }
        Update: {
          date?: string | null
          movement_id?: string
          quantity_delta?: number | null
          reference_id?: string | null
          running_balance?: number | null
          type?: string | null
          variant_id?: string | null
        }
        Relationships: []
      }
      line_items: {
        Row: {
          line_item_id: string
          order_id: string | null
          price: number | null
          product_id: string | null
          quantity: number | null
          title: string | null
          total_discount: number | null
          variant_id: string | null
        }
        Insert: {
          line_item_id: string
          order_id?: string | null
          price?: number | null
          product_id?: string | null
          quantity?: number | null
          title?: string | null
          total_discount?: number | null
          variant_id?: string | null
        }
        Update: {
          line_item_id?: string
          order_id?: string | null
          price?: number | null
          product_id?: string | null
          quantity?: number | null
          title?: string | null
          total_discount?: number | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "line_items_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "line_items_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "line_items_variant_id_fkey"
            columns: ["variant_id"]
            referencedRelation: "variants"
            referencedColumns: ["variant_id"]
          },
        ]
      }
      line_items_stream: {
        Row: {
          line_item_id: string
          order_id: string | null
          price: number | null
          product_id: string | null
          quantity: number | null
          title: string | null
          total_discount: number | null
          variant_id: string | null
        }
        Insert: {
          line_item_id: string
          order_id?: string | null
          price?: number | null
          product_id?: string | null
          quantity?: number | null
          title?: string | null
          total_discount?: number | null
          variant_id?: string | null
        }
        Update: {
          line_item_id?: string
          order_id?: string | null
          price?: number | null
          product_id?: string | null
          quantity?: number | null
          title?: string | null
          total_discount?: number | null
          variant_id?: string | null
        }
        Relationships: []
      }
      meta_ads_daily: {
        Row: {
          ad_name: string | null
          ad_set: string | null
          campaign_name: string | null
          campaign_objective: string | null
          clicks: number | null
          conversion_value_gbp: number | null
          conversions: number | null
          date: string | null
          id: string
          impressions: number | null
          placement: string | null
          spend_gbp: number | null
        }
        Insert: {
          ad_name?: string | null
          ad_set?: string | null
          campaign_name?: string | null
          campaign_objective?: string | null
          clicks?: number | null
          conversion_value_gbp?: number | null
          conversions?: number | null
          date?: string | null
          id?: string
          impressions?: number | null
          placement?: string | null
          spend_gbp?: number | null
        }
        Update: {
          ad_name?: string | null
          ad_set?: string | null
          campaign_name?: string | null
          campaign_objective?: string | null
          clicks?: number | null
          conversion_value_gbp?: number | null
          conversions?: number | null
          date?: string | null
          id?: string
          impressions?: number | null
          placement?: string | null
          spend_gbp?: number | null
        }
        Relationships: []
      }
      meta_ads_daily_stream: {
        Row: {
          ad_name: string | null
          ad_set: string | null
          campaign_name: string | null
          campaign_objective: string | null
          clicks: number | null
          conversion_value_gbp: number | null
          conversions: number | null
          date: string | null
          id: string
          impressions: number | null
          placement: string | null
          spend_gbp: number | null
        }
        Insert: {
          ad_name?: string | null
          ad_set?: string | null
          campaign_name?: string | null
          campaign_objective?: string | null
          clicks?: number | null
          conversion_value_gbp?: number | null
          conversions?: number | null
          date?: string | null
          id?: string
          impressions?: number | null
          placement?: string | null
          spend_gbp?: number | null
        }
        Update: {
          ad_name?: string | null
          ad_set?: string | null
          campaign_name?: string | null
          campaign_objective?: string | null
          clicks?: number | null
          conversion_value_gbp?: number | null
          conversions?: number | null
          date?: string | null
          id?: string
          impressions?: number | null
          placement?: string | null
          spend_gbp?: number | null
        }
        Relationships: []
      }
      metric_definitions: {
        Row: {
          created_at: string
          default_threshold: number
          denominator_field: string | null
          denominator_source: string | null
          description: string | null
          direction: string
          display_name: string
          enabled: boolean
          id: string
          impact_field: string | null
          impact_label: string | null
          impact_source: string | null
          metric_key: string
          numerator_field: string
          numerator_source: string
          operation: string
          severity: string
          sort_order: number
          unit: string
          window_days: number
        }
        Insert: {
          created_at?: string
          default_threshold: number
          denominator_field?: string | null
          denominator_source?: string | null
          description?: string | null
          direction: string
          display_name: string
          enabled?: boolean
          id?: string
          impact_field?: string | null
          impact_label?: string | null
          impact_source?: string | null
          metric_key: string
          numerator_field: string
          numerator_source: string
          operation?: string
          severity?: string
          sort_order?: number
          unit?: string
          window_days?: number
        }
        Update: {
          created_at?: string
          default_threshold?: number
          denominator_field?: string | null
          denominator_source?: string | null
          description?: string | null
          direction?: string
          display_name?: string
          enabled?: boolean
          id?: string
          impact_field?: string | null
          impact_label?: string | null
          impact_source?: string | null
          metric_key?: string
          numerator_field?: string
          numerator_source?: string
          operation?: string
          severity?: string
          sort_order?: number
          unit?: string
          window_days?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string | null
          currency: string | null
          customer_id: string | null
          discount_code: string | null
          financial_status: string | null
          fulfillment_status: string | null
          landing_site: string | null
          order_id: string
          order_number: string | null
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
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          discount_code?: string | null
          financial_status?: string | null
          fulfillment_status?: string | null
          landing_site?: string | null
          order_id: string
          order_number?: string | null
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
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          discount_code?: string | null
          financial_status?: string | null
          fulfillment_status?: string | null
          landing_site?: string | null
          order_id?: string
          order_number?: string | null
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
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      orders_stream: {
        Row: {
          created_at: string | null
          currency: string | null
          customer_id: string | null
          discount_code: string | null
          financial_status: string | null
          fulfillment_status: string | null
          landing_site: string | null
          order_id: string
          order_number: string | null
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
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          discount_code?: string | null
          financial_status?: string | null
          fulfillment_status?: string | null
          landing_site?: string | null
          order_id: string
          order_number?: string | null
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
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          discount_code?: string | null
          financial_status?: string | null
          fulfillment_status?: string | null
          landing_site?: string | null
          order_id?: string
          order_number?: string | null
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
        Relationships: []
      }
      po_line_items: {
        Row: {
          landed_cost_per_unit_gbp: number | null
          po_id: string | null
          po_line_id: string
          quantity_ordered: number | null
          quantity_received: number | null
          unit_cost_supplier_ccy: number | null
          variant_id: string | null
        }
        Insert: {
          landed_cost_per_unit_gbp?: number | null
          po_id?: string | null
          po_line_id: string
          quantity_ordered?: number | null
          quantity_received?: number | null
          unit_cost_supplier_ccy?: number | null
          variant_id?: string | null
        }
        Update: {
          landed_cost_per_unit_gbp?: number | null
          po_id?: string | null
          po_line_id?: string
          quantity_ordered?: number | null
          quantity_received?: number | null
          unit_cost_supplier_ccy?: number | null
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "po_line_items_po_id_fkey"
            columns: ["po_id"]
            referencedRelation: "purchase_orders"
            referencedColumns: ["po_id"]
          },
          {
            foreignKeyName: "po_line_items_variant_id_fkey"
            columns: ["variant_id"]
            referencedRelation: "variants"
            referencedColumns: ["variant_id"]
          },
        ]
      }
      product_baselines: {
        Row: {
          computed_at: string
          mean: number
          metric_key: string
          product_id: string
          sample_n: number
          stddev: number
        }
        Insert: {
          computed_at?: string
          mean: number
          metric_key: string
          product_id: string
          sample_n: number
          stddev: number
        }
        Update: {
          computed_at?: string
          mean?: number
          metric_key?: string
          product_id?: string
          sample_n?: number
          stddev?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_baselines_metric_key_fkey"
            columns: ["metric_key"]
            referencedRelation: "metric_definitions"
            referencedColumns: ["metric_key"]
          },
          {
            foreignKeyName: "product_baselines_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      product_cost_overrides: {
        Row: {
          cost_per_unit: number
          product_id: string
          updated_at: string
        }
        Insert: {
          cost_per_unit: number
          product_id: string
          updated_at?: string
        }
        Update: {
          cost_per_unit?: number
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_cost_overrides_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      product_kpi_thresholds: {
        Row: {
          active: boolean
          created_at: string
          direction: string | null
          id: string
          metric_key: string
          product_id: string | null
          threshold: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          direction?: string | null
          id?: string
          metric_key: string
          product_id?: string | null
          threshold: number
        }
        Update: {
          active?: boolean
          created_at?: string
          direction?: string | null
          id?: string
          metric_key?: string
          product_id?: string | null
          threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_kpi_thresholds_metric_key_fkey"
            columns: ["metric_key"]
            referencedRelation: "metric_definitions"
            referencedColumns: ["metric_key"]
          },
          {
            foreignKeyName: "product_kpi_thresholds_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
      products: {
        Row: {
          collection: string | null
          created_at: string | null
          description: string | null
          gender_segment: string | null
          handle: string | null
          product_id: string
          product_type: string | null
          status: string | null
          tags: string | null
          title: string | null
          vendor: string | null
        }
        Insert: {
          collection?: string | null
          created_at?: string | null
          description?: string | null
          gender_segment?: string | null
          handle?: string | null
          product_id: string
          product_type?: string | null
          status?: string | null
          tags?: string | null
          title?: string | null
          vendor?: string | null
        }
        Update: {
          collection?: string | null
          created_at?: string | null
          description?: string | null
          gender_segment?: string | null
          handle?: string | null
          product_id?: string
          product_type?: string | null
          status?: string | null
          tags?: string | null
          title?: string | null
          vendor?: string | null
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          actual_delivery: string | null
          balance_paid_at: string | null
          created_at: string | null
          deposit_paid_at: string | null
          expected_delivery: string | null
          po_id: string
          status: string | null
          supplier_id: string | null
          total_cost_gbp: number | null
          total_cost_supplier_ccy: number | null
        }
        Insert: {
          actual_delivery?: string | null
          balance_paid_at?: string | null
          created_at?: string | null
          deposit_paid_at?: string | null
          expected_delivery?: string | null
          po_id: string
          status?: string | null
          supplier_id?: string | null
          total_cost_gbp?: number | null
          total_cost_supplier_ccy?: number | null
        }
        Update: {
          actual_delivery?: string | null
          balance_paid_at?: string | null
          created_at?: string | null
          deposit_paid_at?: string | null
          expected_delivery?: string | null
          po_id?: string
          status?: string | null
          supplier_id?: string | null
          total_cost_gbp?: number | null
          total_cost_supplier_ccy?: number | null
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number | null
          created_at: string | null
          order_id: string | null
          reason: string | null
          refund_id: string
          refund_line_items: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          order_id?: string | null
          reason?: string | null
          refund_id: string
          refund_line_items?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          order_id?: string | null
          reason?: string | null
          refund_id?: string
          refund_line_items?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
        ]
      }
      refunds_stream: {
        Row: {
          amount: number | null
          created_at: string | null
          order_id: string | null
          reason: string | null
          refund_id: string
          refund_line_items: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          order_id?: string | null
          reason?: string | null
          refund_id: string
          refund_line_items?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          order_id?: string | null
          reason?: string | null
          refund_id?: string
          refund_line_items?: string | null
        }
        Relationships: []
      }
      replay_state: {
        Row: {
          cursor: string | null
          id: boolean
          stream_start: string | null
        }
        Insert: {
          cursor?: string | null
          id?: boolean
          stream_start?: string | null
        }
        Update: {
          cursor?: string | null
          id?: boolean
          stream_start?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string | null
          channel: string | null
          created_at: string | null
          customer_id: string | null
          first_response_at: string | null
          priority: string | null
          related_order_id: string | null
          related_product_id: string | null
          resolution_time_minutes: number | null
          resolved_at: string | null
          resolved_by: string | null
          satisfaction_rating: number | null
          status: string | null
          subject: string | null
          ticket_id: string
        }
        Insert: {
          category?: string | null
          channel?: string | null
          created_at?: string | null
          customer_id?: string | null
          first_response_at?: string | null
          priority?: string | null
          related_order_id?: string | null
          related_product_id?: string | null
          resolution_time_minutes?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          satisfaction_rating?: number | null
          status?: string | null
          subject?: string | null
          ticket_id: string
        }
        Update: {
          category?: string | null
          channel?: string | null
          created_at?: string | null
          customer_id?: string | null
          first_response_at?: string | null
          priority?: string | null
          related_order_id?: string | null
          related_product_id?: string | null
          resolution_time_minutes?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          satisfaction_rating?: number | null
          status?: string | null
          subject?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      variants: {
        Row: {
          barcode: string | null
          compare_at_price: number | null
          inventory_quantity: number | null
          option1_name: string | null
          option1_value: string | null
          option2_name: string | null
          option2_value: string | null
          price: number | null
          product_id: string | null
          sku: string | null
          variant_id: string
          weight_grams: number | null
        }
        Insert: {
          barcode?: string | null
          compare_at_price?: number | null
          inventory_quantity?: number | null
          option1_name?: string | null
          option1_value?: string | null
          option2_name?: string | null
          option2_value?: string | null
          price?: number | null
          product_id?: string | null
          sku?: string | null
          variant_id: string
          weight_grams?: number | null
        }
        Update: {
          barcode?: string | null
          compare_at_price?: number | null
          inventory_quantity?: number | null
          option1_name?: string | null
          option1_value?: string | null
          option2_name?: string | null
          option2_value?: string | null
          price?: number | null
          product_id?: string | null
          sku?: string | null
          variant_id?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "variants_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["product_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ingest_stream: { Args: { p_asof: string }; Returns: undefined }
      product_daily_outflow: {
        Args: { p_asof?: string; p_days?: number }
        Returns: {
          current_balance: number
          daily_outflow: number
          product_id: string
        }[]
      }
      product_monthly_series: {
        Args: { p_months?: number }
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
        Args: { p_asof?: string; p_window_days?: number }
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
      reset_contract_data: { Args: never; Returns: undefined }
      reset_stream: { Args: { p_stream_start: string }; Returns: undefined }
      stage_future_stream: { Args: { p_cutoff?: string }; Returns: undefined }
      stream_end_date: { Args: never; Returns: string }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const


