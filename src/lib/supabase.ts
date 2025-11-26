import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const SUPABASE_CONFIG_OK = Boolean(supabaseUrl && supabaseAnonKey)

// Avoid crashing the app when env vars are missing in production
let client: any = null
try {
  if (SUPABASE_CONFIG_OK) {
    client = createClient(supabaseUrl, supabaseAnonKey)
  } else {
    client = {
      auth: {
        async getUser() { return { data: { user: null }, error: null } },
        async signInWithPassword() { throw new Error('Supabase not configured') },
        async signOut() { return { error: null } },
        async signUp() { throw new Error('Supabase not configured') },
      },
      from() { throw new Error('Supabase not configured') },
      storage: {
        from() { throw new Error('Supabase not configured') }
      }
    }
    console.warn('Supabase configuration missing: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
  }
} catch (e) {
  console.error('Failed to initialize Supabase client', e)
  client = {
    auth: { async getUser() { return { data: { user: null }, error: null } } },
    from() { throw e },
    storage: { from() { throw e } }
  }
}

export const supabase = client

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
