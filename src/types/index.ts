export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          brokerage: string | null;
          plan: "free" | "pro" | "team";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_status: "active" | "inactive" | "cancelled" | "past_due";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          brokerage?: string | null;
          plan?: "free" | "pro" | "team";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: "active" | "inactive" | "cancelled" | "past_due";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          brokerage?: string | null;
          plan?: "free" | "pro" | "team";
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_status?: "active" | "inactive" | "cancelled" | "past_due";
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          source: "manual" | "csv_import" | "website" | "referral" | "open_house" | "zillow" | "other";
          pipeline_stage:
            | "new_lead"
            | "contacted"
            | "showing"
            | "offer"
            | "closed_won"
            | "closed_lost";
          notes: string | null;
          next_action: string | null;
          next_action_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          source?: "manual" | "csv_import" | "website" | "referral" | "open_house" | "zillow" | "other";
          pipeline_stage?:
            | "new_lead"
            | "contacted"
            | "showing"
            | "offer"
            | "closed_won"
            | "closed_lost";
          notes?: string | null;
          next_action?: string | null;
          next_action_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          source?: "manual" | "csv_import" | "website" | "referral" | "open_house" | "zillow" | "other";
          pipeline_stage?:
            | "new_lead"
            | "contacted"
            | "showing"
            | "offer"
            | "closed_won"
            | "closed_lost";
          notes?: string | null;
          next_action?: string | null;
          next_action_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      actions: {
        Row: {
          id: string;
          lead_id: string;
          user_id: string;
          action_type: "call" | "text" | "email" | "meeting" | "showing" | "note";
          description: string | null;
          due_date: string;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          user_id: string;
          action_type: "call" | "text" | "email" | "meeting" | "showing" | "note";
          description?: string | null;
          due_date: string;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string;
          user_id?: string;
          action_type?: "call" | "text" | "email" | "meeting" | "showing" | "note";
          description?: string | null;
          due_date?: string;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
