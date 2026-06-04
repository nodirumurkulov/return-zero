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
          handle: string | null;
          product_type: string | null;
          gender_segment: string | null;
          status: string | null;
        };
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
          affected_kpis: Json | null;
          root_cause: string | null;
          root_cause_confidence: number | null;
          created_at: string;
          resolved_at: string | null;
        };
        Update: {
          status?: string;
          resolved_at?: string | null;
        };
      };
      // Engine shape: per-product override of a metric_definitions threshold.
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
          product_id: string;
          metric_key: string;
          threshold: number;
          direction?: string | null;
          active?: boolean;
        };
        Update: {
          threshold?: number;
          direction?: string | null;
          active?: boolean;
        };
      };
    };
  };
};

export type KpiThreshold = Database["public"]["Tables"]["product_kpi_thresholds"]["Row"];

// Health level === the engine's MetricStatus (re-exported for UI components).
export type { MetricStatus as HealthLevel } from "@/lib/metrics/types";
