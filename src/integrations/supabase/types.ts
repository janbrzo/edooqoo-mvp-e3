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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      download_sessions: {
        Row: {
          created_at: string
          downloads_count: number | null
          expires_at: string
          id: string
          payment_id: string | null
          session_token: string
          worksheet_id: string | null
        }
        Insert: {
          created_at?: string
          downloads_count?: number | null
          expires_at?: string
          id?: string
          payment_id?: string | null
          session_token: string
          worksheet_id?: string | null
        }
        Update: {
          created_at?: string
          downloads_count?: number | null
          expires_at?: string
          id?: string
          payment_id?: string | null
          session_token?: string
          worksheet_id?: string | null
        }
        Relationships: []
      }
      export_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_email: string | null
          user_id: string | null
          user_identifier: string | null
          worksheet_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_identifier?: string | null
          worksheet_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_identifier?: string | null
          worksheet_id?: string | null
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          status: string
          user_id: string | null
          worksheet_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          status?: string
          user_id?: string | null
          worksheet_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          status?: string
          user_id?: string | null
          worksheet_id?: string
        }
        Relationships: []
      }
      geolocation_cache: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          ip: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          ip: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          ip?: string
          updated_at?: string
        }
        Relationships: []
      }
      homework_assignments: {
        Row: {
          completed_at: string | null
          completed_by_teacher: boolean | null
          created_at: string
          deadline: string | null
          id: string
          reminder_hours: number | null
          reminder_scheduled_at: string | null
          reminder_sent_at: string | null
          selected_exercises: Json
          share_expires_at: string | null
          share_token: string | null
          source_worksheet_id: string | null
          student_id: string | null
          teacher_id: string
          title: string
          updated_at: string
          view_count: number
          viewed_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by_teacher?: boolean | null
          created_at?: string
          deadline?: string | null
          id?: string
          reminder_hours?: number | null
          reminder_scheduled_at?: string | null
          reminder_sent_at?: string | null
          selected_exercises?: Json
          share_expires_at?: string | null
          share_token?: string | null
          source_worksheet_id?: string | null
          student_id?: string | null
          teacher_id: string
          title: string
          updated_at?: string
          view_count?: number
          viewed_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by_teacher?: boolean | null
          created_at?: string
          deadline?: string | null
          id?: string
          reminder_hours?: number | null
          reminder_scheduled_at?: string | null
          reminder_sent_at?: string | null
          selected_exercises?: Json
          share_expires_at?: string | null
          share_token?: string | null
          source_worksheet_id?: string | null
          student_id?: string | null
          teacher_id?: string
          title?: string
          updated_at?: string
          view_count?: number
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_assignments_source_worksheet_id_fkey"
            columns: ["source_worksheet_id"]
            isOneToOne: false
            referencedRelation: "worksheets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_notifications: {
        Row: {
          created_at: string | null
          homework_id: string
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          read_at: string | null
          student_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string | null
          homework_id: string
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          read_at?: string | null
          student_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string | null
          homework_id?: string
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          read_at?: string | null
          student_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_notifications_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_notifications_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_upgrade_sessions: {
        Row: {
          email: string | null
          id: string
          processed_at: string
          session_id: string
          teacher_id: string
          tokens_added: number
          upgrade_details: Json | null
        }
        Insert: {
          email?: string | null
          id?: string
          processed_at?: string
          session_id: string
          teacher_id: string
          tokens_added?: number
          upgrade_details?: Json | null
        }
        Update: {
          email?: string | null
          id?: string
          processed_at?: string
          session_id?: string
          teacher_id?: string
          tokens_added?: number
          upgrade_details?: Json | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          available_tokens: number
          created_at: string
          deleted_at: string | null
          email: string | null
          first_name: string | null
          id: string
          is_tokens_frozen: boolean
          last_limit_reset: string | null
          last_name: string | null
          monthly_worksheet_limit: number | null
          monthly_worksheets_used: number
          onboarding_progress: Json | null
          rollover_tokens: number
          school_institution: string | null
          subscription_expires_at: string | null
          subscription_status: string | null
          subscription_type: string | null
          teaching_preferences: Json | null
          total_tokens_consumed: number | null
          total_tokens_received: number | null
          total_worksheets_created: number | null
          updated_at: string
        }
        Insert: {
          available_tokens?: number
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          is_tokens_frozen?: boolean
          last_limit_reset?: string | null
          last_name?: string | null
          monthly_worksheet_limit?: number | null
          monthly_worksheets_used?: number
          onboarding_progress?: Json | null
          rollover_tokens?: number
          school_institution?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          teaching_preferences?: Json | null
          total_tokens_consumed?: number | null
          total_tokens_received?: number | null
          total_worksheets_created?: number | null
          updated_at?: string
        }
        Update: {
          available_tokens?: number
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_tokens_frozen?: boolean
          last_limit_reset?: string | null
          last_name?: string | null
          monthly_worksheet_limit?: number | null
          monthly_worksheets_used?: number
          onboarding_progress?: Json | null
          rollover_tokens?: number
          school_institution?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          teaching_preferences?: Json | null
          total_tokens_consumed?: number | null
          total_tokens_received?: number | null
          total_worksheets_created?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      student_knowledge_entries: {
        Row: {
          category: string
          content: string
          created_at: string | null
          deleted_at: string | null
          entry_source: string | null
          id: string
          is_outdated: boolean | null
          outdated_at: string | null
          outdated_reason: string | null
          student_id: string
          tags: string[] | null
          teacher_id: string
          updated_at: string | null
          worksheet_id: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          entry_source?: string | null
          id?: string
          is_outdated?: boolean | null
          outdated_at?: string | null
          outdated_reason?: string | null
          student_id: string
          tags?: string[] | null
          teacher_id: string
          updated_at?: string | null
          worksheet_id?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          entry_source?: string | null
          id?: string
          is_outdated?: boolean | null
          outdated_at?: string | null
          outdated_reason?: string | null
          student_id?: string
          tags?: string[] | null
          teacher_id?: string
          updated_at?: string | null
          worksheet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_knowledge_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_knowledge_entries_worksheet_id_fkey"
            columns: ["worksheet_id"]
            isOneToOne: false
            referencedRelation: "worksheets"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          deleted_at: string | null
          english_level: string
          id: string
          main_goal: string
          name: string
          student_email: string | null
          teacher_email: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          english_level: string
          id?: string
          main_goal: string
          name: string
          student_email?: string | null
          teacher_email?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          english_level?: string
          id?: string
          main_goal?: string
          name?: string
          student_email?: string | null
          teacher_email?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_events: {
        Row: {
          created_at: string
          email: string | null
          event_data: Json | null
          event_type: string
          id: string
          new_plan_type: string | null
          old_plan_type: string | null
          stripe_event_id: string | null
          teacher_id: string
          tokens_added: number | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          new_plan_type?: string | null
          old_plan_type?: string | null
          stripe_event_id?: string | null
          teacher_id: string
          tokens_added?: number | null
        }
        Update: {
          created_at?: string
          email?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          new_plan_type?: string | null
          old_plan_type?: string | null
          stripe_event_id?: string | null
          teacher_id?: string
          tokens_added?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          email: string | null
          id: string
          monthly_limit: number
          stripe_customer_id: string
          stripe_subscription_id: string
          subscription_status: string
          subscription_type: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end: string
          current_period_start: string
          email?: string | null
          id?: string
          monthly_limit: number
          stripe_customer_id: string
          stripe_subscription_id: string
          subscription_status: string
          subscription_type: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          email?: string | null
          id?: string
          monthly_limit?: number
          stripe_customer_id?: string
          stripe_subscription_id?: string
          subscription_status?: string
          subscription_type?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      token_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          teacher_email: string | null
          teacher_id: string
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          teacher_email?: string | null
          teacher_id: string
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          teacher_email?: string | null
          teacher_id?: string
          transaction_type?: string
        }
        Relationships: []
      }
      user_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          session_id: string | null
          user_agent: string | null
          user_identifier: string
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_identifier: string
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_identifier?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      worksheets: {
        Row: {
          ai_response: string
          audio_duration: number | null
          audio_transcript: string | null
          audio_url: string | null
          audio_voice: string | null
          city: string | null
          country: string | null
          created_at: string
          deleted_at: string | null
          download_count: number
          form_data: Json
          generation_time_seconds: number | null
          html_content: string
          id: string
          ip_address: string | null
          last_modified_at: string
          media_metadata: Json | null
          prompt: string
          referrer_url: string | null
          selected_audio: Json | null
          selected_image: Json | null
          sequence_number: number
          session_id: string | null
          share_expires_at: string | null
          share_token: string | null
          status: string
          student_id: string | null
          teacher_email: string | null
          teacher_id: string | null
          title: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          ai_response: string
          audio_duration?: number | null
          audio_transcript?: string | null
          audio_url?: string | null
          audio_voice?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          download_count?: number
          form_data: Json
          generation_time_seconds?: number | null
          html_content: string
          id?: string
          ip_address?: string | null
          last_modified_at?: string
          media_metadata?: Json | null
          prompt: string
          referrer_url?: string | null
          selected_audio?: Json | null
          selected_image?: Json | null
          sequence_number?: number
          session_id?: string | null
          share_expires_at?: string | null
          share_token?: string | null
          status?: string
          student_id?: string | null
          teacher_email?: string | null
          teacher_id?: string | null
          title?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          ai_response?: string
          audio_duration?: number | null
          audio_transcript?: string | null
          audio_url?: string | null
          audio_voice?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          download_count?: number
          form_data?: Json
          generation_time_seconds?: number | null
          html_content?: string
          id?: string
          ip_address?: string | null
          last_modified_at?: string
          media_metadata?: Json | null
          prompt?: string
          referrer_url?: string | null
          selected_audio?: Json | null
          selected_image?: Json | null
          sequence_number?: number
          session_id?: string | null
          share_expires_at?: string | null
          share_token?: string | null
          status?: string
          student_id?: string | null
          teacher_email?: string | null
          teacher_id?: string | null
          title?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      conversion_funnel: {
        Row: {
          date: string | null
          download_attempts_locked: number | null
          download_attempts_unlocked: number | null
          form_abandons_page_leave: number | null
          form_abandons_tab_switch: number | null
          form_starts: number | null
          form_submits: number | null
          payment_button_clicks: number | null
          stripe_payments_success: number | null
          worksheet_generation_completes: number | null
          worksheet_generation_starts: number | null
          worksheet_view_ends_page_leave: number | null
          worksheet_view_ends_tab_switch: number | null
          worksheet_views: number | null
        }
        Relationships: []
      }
      popular_form_params: {
        Row: {
          avg_generation_time: number | null
          english_level: string | null
          lesson_goal: string | null
          lesson_time: string | null
          lesson_topic: string | null
          usage_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_tokens: {
        Args: {
          p_amount: number
          p_description: string
          p_reference_id?: string
          p_teacher_id: string
        }
        Returns: undefined
      }
      clean_old_geolocation_cache: { Args: never; Returns: undefined }
      cleanup_worksheet_base64: {
        Args: never
        Returns: {
          table_size_after: string
          table_size_before: string
          worksheets_cleaned: number
        }[]
      }
      consume_token: {
        Args: { p_teacher_id: string; p_worksheet_id: string }
        Returns: boolean
      }
      generate_homework_share_token: {
        Args: { p_homework_id: string; p_teacher_id: string }
        Returns: string
      }
      generate_worksheet_share_token: {
        Args: {
          p_expires_hours?: number
          p_teacher_id: string
          p_worksheet_id: string
        }
        Returns: string
      }
      get_homework_by_share_token: {
        Args: { p_share_token: string }
        Returns: {
          audio_url: string
          created_at: string
          deadline: string
          id: string
          selected_audio: Json
          selected_exercises: Json
          selected_image: Json
          source_worksheet_title: string
          student_english_level: string
          student_name: string
          teacher_email: string
          teacher_first_name: string
          teacher_last_name: string
          title: string
        }[]
      }
      get_student_tags: {
        Args: { p_student_id: string; p_teacher_id: string }
        Returns: string[]
      }
      get_token_balance: { Args: { p_teacher_id: string }; Returns: number }
      get_worksheet_by_share_token: {
        Args: { p_share_token: string }
        Returns: {
          ai_response: string
          audio_url: string
          created_at: string
          html_content: string
          id: string
          selected_audio: Json
          selected_image: Json
          teacher_email: string
          title: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_worksheet_download_count: {
        Args: { p_worksheet_id: string }
        Returns: number
      }
      insert_worksheet_bypass_limit:
        | {
            Args: {
              p_ai_response: string
              p_city?: string
              p_country?: string
              p_form_data: Json
              p_generation_time_seconds: number
              p_html_content: string
              p_ip_address: string
              p_prompt: string
              p_status: string
              p_teacher_email?: string
              p_title: string
              p_user_id: string
            }
            Returns: {
              created_at: string
              id: string
              title: string
            }[]
          }
        | {
            Args: {
              p_ai_response: string
              p_city?: string
              p_country?: string
              p_form_data: Json
              p_generation_time_seconds: number
              p_html_content: string
              p_ip_address: string
              p_prompt: string
              p_status: string
              p_title: string
              p_user_id: string
            }
            Returns: {
              created_at: string
              id: string
              title: string
            }[]
          }
      is_user_anonymous: { Args: { user_id: string }; Returns: boolean }
      mark_homework_completed: {
        Args: {
          p_homework_id: string
          p_is_teacher?: boolean
          p_user_id: string
        }
        Returns: Json
      }
      mark_knowledge_current: {
        Args: { p_entry_id: string; p_teacher_id: string }
        Returns: boolean
      }
      mark_knowledge_outdated: {
        Args: { p_entry_id: string; p_reason?: string; p_teacher_id: string }
        Returns: boolean
      }
      normalize_tag: { Args: { tag: string }; Returns: string }
      reactivate_user_account: {
        Args: { user_email: string }
        Returns: boolean
      }
      should_show_onboarding: { Args: { user_id: string }; Returns: boolean }
      soft_delete_knowledge_entry: {
        Args: { p_entry_id: string; p_teacher_id: string }
        Returns: boolean
      }
      soft_delete_student: {
        Args: { p_student_id: string; p_teacher_id: string }
        Returns: boolean
      }
      soft_delete_user_account: { Args: { user_id: string }; Returns: boolean }
      soft_delete_worksheet: {
        Args: { p_teacher_id: string; p_worksheet_id: string }
        Returns: boolean
      }
      track_user_event: {
        Args: {
          p_event_data?: Json
          p_event_type: string
          p_ip_address?: string
          p_session_id?: string
          p_user_agent?: string
          p_user_identifier: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "teacher"
      english_level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
      main_goal:
        | "grammar"
        | "vocabulary"
        | "speaking"
        | "listening"
        | "reading"
        | "writing"
        | "pronunciation"
        | "fluency"
        | "confidence"
        | "exam_preparation"
        | "business_english"
        | "academic_english"
        | "travel_english"
        | "conversation"
        | "mixed"
      subscription_status:
        | "active"
        | "active_cancelled"
        | "cancelled"
        | "expired"
        | "paused"
        | "pending"
      user_role_enum: "user" | "admin"
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
      app_role: ["admin", "teacher"],
      english_level: ["A1", "A2", "B1", "B2", "C1", "C2"],
      main_goal: [
        "grammar",
        "vocabulary",
        "speaking",
        "listening",
        "reading",
        "writing",
        "pronunciation",
        "fluency",
        "confidence",
        "exam_preparation",
        "business_english",
        "academic_english",
        "travel_english",
        "conversation",
        "mixed",
      ],
      subscription_status: [
        "active",
        "active_cancelled",
        "cancelled",
        "expired",
        "paused",
        "pending",
      ],
      user_role_enum: ["user", "admin"],
    },
  },
} as const
