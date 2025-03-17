export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          activity_id: string | null
          content: string
          created_at: string
          id: string
          is_bot: boolean
          show_condition_selection: boolean
          show_effort_rating: boolean
          show_energy_rating: boolean
          timestamp: string
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_bot?: boolean
          show_condition_selection?: boolean
          show_effort_rating?: boolean
          show_energy_rating?: boolean
          timestamp?: string
          user_id: string
        }
        Update: {
          activity_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_bot?: boolean
          show_condition_selection?: boolean
          show_effort_rating?: boolean
          show_energy_rating?: boolean
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_conditions: {
        Row: {
          condition: string | null
          created_at: string
          effort_level: number | null
          energy_level: number | null
          id: string
          user_id: string
        }
        Insert: {
          condition?: string | null
          created_at?: string
          effort_level?: number | null
          energy_level?: number | null
          id?: string
          user_id: string
        }
        Update: {
          condition?: string | null
          created_at?: string
          effort_level?: number | null
          energy_level?: number | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          subscription: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          subscription: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          subscription?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      strava_tokens: {
        Row: {
          athlete_id: string
          created_at: string | null
          refresh_token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          athlete_id: string
          created_at?: string | null
          refresh_token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          athlete_id?: string
          created_at?: string | null
          refresh_token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      training_recommendations: {
        Row: {
          created_at: string
          feedback: string | null
          feedback_provided_at: string | null
          id: string
          prompt: string
          recommendation: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          feedback_provided_at?: string | null
          id?: string
          prompt: string
          recommendation: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          feedback_provided_at?: string | null
          id?: string
          prompt?: string
          recommendation?: string
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding: {
        Row: {
          additional_info: string | null
          completed_at: string | null
          created_at: string | null
          goal_type: string
          id: string
          race_date: string | null
          race_distance: Database["public"]["Enums"]["race_distance"] | null
          running_experience: string
          strava_profile: string | null
          user_id: string
          weekly_frequency: string
        }
        Insert: {
          additional_info?: string | null
          completed_at?: string | null
          created_at?: string | null
          goal_type: string
          id?: string
          race_date?: string | null
          race_distance?: Database["public"]["Enums"]["race_distance"] | null
          running_experience: string
          strava_profile?: string | null
          user_id: string
          weekly_frequency: string
        }
        Update: {
          additional_info?: string | null
          completed_at?: string | null
          created_at?: string | null
          goal_type?: string
          id?: string
          race_date?: string | null
          race_distance?: Database["public"]["Enums"]["race_distance"] | null
          running_experience?: string
          strava_profile?: string | null
          user_id?: string
          weekly_frequency?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      race_distance: "5K" | "10K" | "Media maratón" | "Maratón"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
