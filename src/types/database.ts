export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      trainers: {
        Row: { id: string; name: string; email: string; ics_token: string; created_at: string }
        Insert: { id: string; name: string; email: string; ics_token?: string; created_at?: string }
        Update: { id?: string; name?: string; email?: string; ics_token?: string; created_at?: string }
        Relationships: []
      }
      clients: {
        Row: { id: string; trainer_id: string; name: string; email: string | null; phone: string | null; birth_date: string | null; notes: string | null; status: 'active' | 'inactive' | 'archived'; created_at: string }
        Insert: { id?: string; trainer_id: string; name: string; email?: string | null; phone?: string | null; birth_date?: string | null; notes?: string | null; status?: 'active' | 'inactive' | 'archived'; created_at?: string }
        Update: { id?: string; trainer_id?: string; name?: string; email?: string | null; phone?: string | null; birth_date?: string | null; notes?: string | null; status?: 'active' | 'inactive' | 'archived'; created_at?: string }
        Relationships: [
          { foreignKeyName: 'clients_trainer_id_fkey'; columns: ['trainer_id']; isOneToOne: false; referencedRelation: 'trainers'; referencedColumns: ['id'] }
        ]
      }
      packages: {
        Row: { id: string; client_id: string; name: string; total_sessions: number; used_sessions: number; price: number | null; paid: boolean; paid_at: string | null; status: 'active' | 'completed' | 'expired'; created_at: string }
        Insert: { id?: string; client_id: string; name: string; total_sessions: number; used_sessions?: number; price?: number | null; paid?: boolean; paid_at?: string | null; status?: 'active' | 'completed' | 'expired'; created_at?: string }
        Update: { id?: string; client_id?: string; name?: string; total_sessions?: number; used_sessions?: number; price?: number | null; paid?: boolean; paid_at?: string | null; status?: 'active' | 'completed' | 'expired'; created_at?: string }
        Relationships: [
          { foreignKeyName: 'packages_client_id_fkey'; columns: ['client_id']; isOneToOne: false; referencedRelation: 'clients'; referencedColumns: ['id'] }
        ]
      }
      sessions: {
        Row: { id: string; client_id: string; package_id: string | null; trainer_id: string; scheduled_at: string; duration_minutes: number; status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'; location: string | null; notes: string | null; recurrence_group_id: string | null; recurrence_rule: Json | null; created_at: string }
        Insert: { id?: string; client_id: string; package_id?: string | null; trainer_id: string; scheduled_at: string; duration_minutes?: number; status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show'; location?: string | null; notes?: string | null; recurrence_group_id?: string | null; recurrence_rule?: Json | null; created_at?: string }
        Update: { id?: string; client_id?: string; package_id?: string | null; trainer_id?: string; scheduled_at?: string; duration_minutes?: number; status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show'; location?: string | null; notes?: string | null; recurrence_group_id?: string | null; recurrence_rule?: Json | null; created_at?: string }
        Relationships: [
          { foreignKeyName: 'sessions_client_id_fkey'; columns: ['client_id']; isOneToOne: false; referencedRelation: 'clients'; referencedColumns: ['id'] },
          { foreignKeyName: 'sessions_package_id_fkey'; columns: ['package_id']; isOneToOne: false; referencedRelation: 'packages'; referencedColumns: ['id'] },
          { foreignKeyName: 'sessions_trainer_id_fkey'; columns: ['trainer_id']; isOneToOne: false; referencedRelation: 'trainers'; referencedColumns: ['id'] }
        ]
      }
      exercises: {
        Row: { id: string; trainer_id: string; name: string; created_at: string }
        Insert: { id?: string; trainer_id: string; name: string; created_at?: string }
        Update: { id?: string; trainer_id?: string; name?: string; created_at?: string }
        Relationships: [
          { foreignKeyName: 'exercises_trainer_id_fkey'; columns: ['trainer_id']; isOneToOne: false; referencedRelation: 'trainers'; referencedColumns: ['id'] }
        ]
      }
      session_exercises: {
        Row: { id: string; session_id: string; exercise_id: string | null; order_index: number; sets: Json; notes: string | null; superset_group: number | null }
        Insert: { id?: string; session_id: string; exercise_id?: string | null; order_index: number; sets?: Json; notes?: string | null; superset_group?: number | null }
        Update: { id?: string; session_id?: string; exercise_id?: string | null; order_index?: number; sets?: Json; notes?: string | null; superset_group?: number | null }
        Relationships: [
          { foreignKeyName: 'session_exercises_session_id_fkey'; columns: ['session_id']; isOneToOne: false; referencedRelation: 'sessions'; referencedColumns: ['id'] },
          { foreignKeyName: 'session_exercises_exercise_id_fkey'; columns: ['exercise_id']; isOneToOne: false; referencedRelation: 'exercises'; referencedColumns: ['id'] }
        ]
      }
      workout_templates: {
        Row: { id: string; trainer_id: string; name: string; exercises: Json; category: string | null; created_at: string }
        Insert: { id?: string; trainer_id: string; name: string; exercises: Json; category?: string | null; created_at?: string }
        Update: { id?: string; trainer_id?: string; name?: string; exercises?: Json; category?: string | null; created_at?: string }
        Relationships: [
          { foreignKeyName: 'workout_templates_trainer_id_fkey'; columns: ['trainer_id']; isOneToOne: false; referencedRelation: 'trainers'; referencedColumns: ['id'] }
        ]
      }
      inbody_records: {
        Row: { id: string; client_id: string; measured_at: string; weight: number | null; body_fat_pct: number | null; muscle_mass: number | null; bmi: number | null; visceral_fat: number | null; body_water_pct: number | null; custom_data: Json; photo_urls: string[] | null; notes: string | null; created_at: string }
        Insert: { id?: string; client_id: string; measured_at: string; weight?: number | null; body_fat_pct?: number | null; muscle_mass?: number | null; bmi?: number | null; visceral_fat?: number | null; body_water_pct?: number | null; custom_data?: Json; photo_urls?: string[] | null; notes?: string | null; created_at?: string }
        Update: { id?: string; client_id?: string; measured_at?: string; weight?: number | null; body_fat_pct?: number | null; muscle_mass?: number | null; bmi?: number | null; visceral_fat?: number | null; body_water_pct?: number | null; custom_data?: Json; photo_urls?: string[] | null; notes?: string | null; created_at?: string }
        Relationships: [
          { foreignKeyName: 'inbody_records_client_id_fkey'; columns: ['client_id']; isOneToOne: false; referencedRelation: 'clients'; referencedColumns: ['id'] }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_package_sessions: {
        Args: { p_package_id: string }
        Returns: { id: string; used_sessions: number; total_sessions: number; status: 'active' | 'completed' | 'expired' }[]
      }
      decrement_package_sessions: {
        Args: { p_package_id: string }
        Returns: { id: string; used_sessions: number; total_sessions: number; status: 'active' | 'completed' | 'expired' }[]
      }
      toggle_package_payment: {
        Args: { p_package_id: string }
        Returns: undefined
      }
    }
    Enums: {
      client_status: 'active' | 'inactive' | 'archived'
      package_status: 'active' | 'completed' | 'expired'
      session_status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
