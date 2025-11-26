import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          full_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          full_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          full_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      custody_sessions: {
        Row: {
          id: string
          user_id: string
          start_time: string
          end_time: string | null
          child_name: string
          notes: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          start_time: string
          end_time?: string | null
          child_name: string
          notes?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          start_time?: string
          end_time?: string | null
          child_name?: string
          notes?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      gps_trips: {
        Row: {
          id: string
          session_id: string
          start_location: any
          end_location: any
          distance_miles: number
          mileage_rate: number
          route_data: any | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          start_location: any
          end_location: any
          distance_miles: number
          mileage_rate?: number
          route_data?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          start_location?: any
          end_location?: any
          distance_miles?: number
          mileage_rate?: number
          route_data?: any | null
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          receipt_url: string
          category: string
          amount: number
          expense_date: string
          reimbursement_status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          receipt_url: string
          category: string
          amount: number
          expense_date: string
          reimbursement_status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          receipt_url?: string
          category?: string
          amount?: number
          expense_date?: string
          reimbursement_status?: string
          created_at?: string
        }
      }
      evidence_items: {
        Row: {
          id: string
          user_id: string
          item_type: string
          file_url: string
          description: string | null
          ai_analysis: any | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_type: string
          file_url: string
          description?: string | null
          ai_analysis?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_type?: string
          file_url?: string
          description?: string | null
          ai_analysis?: any | null
          created_at?: string
        }
      }
      ai_conversations: {
        Row: {
          id: string
          session_id: string
          image_url: string
          summary: string
          tone: string
          key_points: any | null
          cost: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          image_url: string
          summary: string
          tone: string
          key_points?: any | null
          cost: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          image_url?: string
          summary?: string
          tone?: string
          key_points?: any | null
          cost?: number
          created_at?: string
        }
      }
    }
  }
}

export type Tables = Database['public']['Tables']