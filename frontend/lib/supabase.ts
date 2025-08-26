import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on our schema
export interface Database {
  public: {
    Tables: {
      transformers: {
        Row: {
          id: string
          transformer_no: string
          pole_no: string
          region: string
          type: string
          location_details: string | null
          capacity: number | null
          no_of_feeders: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transformer_no: string
          pole_no: string
          region: string
          type: string
          location_details?: string | null
          capacity?: number | null
          no_of_feeders?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transformer_no?: string
          pole_no?: string
          region?: string
          type?: string
          location_details?: string | null
          capacity?: number | null
          no_of_feeders?: number | null
          updated_at?: string
        }
      }
      inspections: {
        Row: {
          id: string
          inspection_no: string
          transformer_id: string
          inspected_date: string
          maintenance_date: string | null
          status: string
          inspected_by: string | null
          weather_condition: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          inspection_no: string
          transformer_id: string
          inspected_date: string
          maintenance_date?: string | null
          status?: string
          inspected_by?: string | null
          weather_condition?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          inspection_no?: string
          transformer_id?: string
          inspected_date?: string
          maintenance_date?: string | null
          status?: string
          inspected_by?: string | null
          weather_condition?: string | null
          updated_at?: string
        }
      }
      thermal_images: {
        Row: {
          id: string
          inspection_id: string
          image_url: string
          image_type: string
          temperature_reading: number | null
          anomaly_detected: boolean | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          inspection_id: string
          image_url: string
          image_type: string
          temperature_reading?: number | null
          anomaly_detected?: boolean | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          inspection_id?: string
          image_url?: string
          image_type?: string
          temperature_reading?: number | null
          anomaly_detected?: boolean | null
        }
      }
      alerts: {
        Row: {
          id: string
          transformer_id: string
          alert_type: string
          message: string
          severity: string
          is_read: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          transformer_id: string
          alert_type: string
          message: string
          severity?: string
          is_read?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          transformer_id?: string
          alert_type?: string
          message?: string
          severity?: string
          is_read?: boolean | null
        }
      }
    }
  }
}
