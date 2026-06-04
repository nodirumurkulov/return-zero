/**
 * Supabase Database types — regenerate after schema changes:
 *   cd frontend && bun run db:types
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          product_id: string;
          title: string | null;
          product_type: string | null;
          gender_segment: string | null;
          created_at: string;
        };
        Insert: {
          product_id: string;
          title?: string | null;
          product_type?: string | null;
          gender_segment?: string | null;
          created_at?: string;
        };
        Update: {
          product_id?: string;
          title?: string | null;
          product_type?: string | null;
          gender_segment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      metric_definitions: {
        Row: {
          id: string;
          metric_key: string;
          display_name: string;
          description: string | null;
          unit: string;
          numerator_source: string;
          numerator_field: string;
          denominator_source: string | null;
          denominator_field: string | null;
          operation: string;
          window_days: number;
          direction: string;
          default_threshold: number;
          severity: string;
          enabled: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          metric_key: string;
          display_name: string;
          description?: string | null;
          unit?: string;
          numerator_source: string;
          numerator_field: string;
          denominator_source?: string | null;
          denominator_field?: string | null;
          operation?: string;
          window_days?: number;
          direction: string;
          default_threshold: number;
          severity?: string;
          enabled?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          metric_key?: string;
          display_name?: string;
          description?: string | null;
          unit?: string;
          numerator_source?: string;
          numerator_field?: string;
          denominator_source?: string | null;
          denominator_field?: string | null;
          operation?: string;
          window_days?: number;
          direction?: string;
          default_threshold?: number;
          severity?: string;
          enabled?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      product_kpi_thresholds: {
        Row: {
          id: string;
          product_id: string | null;
          metric_key: string;
          threshold: number;
          direction: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          metric_key: string;
          threshold: number;
          direction?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          metric_key?: string;
          threshold?: number;
          direction?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      incidents: {
        Row: {
          id: string;
          title: string;
          status: string;
          severity: string;
          impact_amount: number | null;
          impact_label: string | null;
          affected_product: string | null;
          affected_kpis: string[] | null;
          root_cause: string | null;
          root_cause_confidence: number | null;
          created_at: string;
          resolved_at: string | null;
          investigation_started_at: string | null;
          fix_proposed_at: string | null;
          monitoring_kpi: string | null;
          baseline_value: number | null;
          target_value: number | null;
          recovery_pct: number | null;
        };
        Insert: {
          id?: string;
          title: string;
          status?: string;
          severity?: string;
          impact_amount?: number | null;
          impact_label?: string | null;
          affected_product?: string | null;
          affected_kpis?: string[] | null;
          root_cause?: string | null;
          root_cause_confidence?: number | null;
          created_at?: string;
          resolved_at?: string | null;
          investigation_started_at?: string | null;
          fix_proposed_at?: string | null;
          monitoring_kpi?: string | null;
          baseline_value?: number | null;
          target_value?: number | null;
          recovery_pct?: number | null;
        };
        Update: {
          id?: string;
          title?: string;
          status?: string;
          severity?: string;
          impact_amount?: number | null;
          impact_label?: string | null;
          affected_product?: string | null;
          affected_kpis?: string[] | null;
          root_cause?: string | null;
          root_cause_confidence?: number | null;
          created_at?: string;
          resolved_at?: string | null;
          investigation_started_at?: string | null;
          fix_proposed_at?: string | null;
          monitoring_kpi?: string | null;
          baseline_value?: number | null;
          target_value?: number | null;
          recovery_pct?: number | null;
        };
        Relationships: [];
      };
      incident_actions: {
        Row: {
          id: string;
          incident_id: string;
          title: string;
          description: string | null;
          impact_level: string;
          risk_level: string;
          auto_deploy: boolean;
          status: string;
          approved_by: string | null;
          approved_at: string | null;
          deployed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          incident_id: string;
          title: string;
          description?: string | null;
          impact_level: string;
          risk_level: string;
          auto_deploy?: boolean;
          status?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          deployed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          incident_id?: string;
          title?: string;
          description?: string | null;
          impact_level?: string;
          risk_level?: string;
          auto_deploy?: boolean;
          status?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          deployed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      agent_findings: {
        Row: {
          id: string;
          incident_id: string;
          agent_name: string;
          agent_icon: string | null;
          summary: string;
          detail: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          incident_id: string;
          agent_name: string;
          agent_icon?: string | null;
          summary: string;
          detail?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          incident_id?: string;
          agent_name?: string;
          agent_icon?: string | null;
          summary?: string;
          detail?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      incident_timeline: {
        Row: {
          id: string;
          incident_id: string;
          event_type: string;
          description: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          incident_id: string;
          event_type: string;
          description: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          incident_id?: string;
          event_type?: string;
          description?: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      refunds: {
        Row: {
          refund_id: string;
          order_id: string;
          amount: number;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          refund_id: string;
          order_id: string;
          amount: number;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          refund_id?: string;
          order_id?: string;
          amount?: number;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      business_settings: {
        Row: {
          key: string;
          value: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      product_metrics_view: {
        Row: {
          product_id: string;
          title: string | null;
          product_type: string | null;
          gender_segment: string | null;
          revenue_gbp: number | null;
          order_count: number | null;
          return_rate: number | null;
          refund_rate: number | null;
          support_tickets: number | null;
          ad_roas: number | null;
        };
        Relationships: [];
      };
      product_metrics_monthly_view: {
        Row: {
          product_id: string;
          month_start: string;
          revenue_gbp: number | null;
          order_count: number | null;
          return_rate: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      product_daily_outflow: {
        Args: { p_days?: number; p_asof?: string };
        Returns: {
          product_id: string;
          current_balance: number;
          daily_outflow: number;
        }[];
      };
      product_source_facts: {
        Args: { p_window_days?: number };
        Returns: Record<string, unknown>[];
      };
      product_monthly_series: {
        Args: { p_months?: number };
        Returns: Record<string, unknown>[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];
