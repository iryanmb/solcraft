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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      checkins: {
        Row: {
          created_at: string
          id: string
          method: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          method: string
          session_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          method?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkins_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_windows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      gatherings: {
        Row: {
          age_text: string
          art_form: string
          cost_text: string
          end_text: string
          host_id: string
          how_you_take_part: string
          id: string
          kind: string
          last_verified_at: string
          recurrence_text: string
          source_url: string
          start_text: string
          status: string
          title: string
          venue_id: string
          why_it_fits: string
        }
        Insert: {
          age_text: string
          art_form: string
          cost_text: string
          end_text: string
          host_id: string
          how_you_take_part: string
          id: string
          kind: string
          last_verified_at: string
          recurrence_text: string
          source_url: string
          start_text: string
          status?: string
          title: string
          venue_id: string
          why_it_fits: string
        }
        Update: {
          age_text?: string
          art_form?: string
          cost_text?: string
          end_text?: string
          host_id?: string
          how_you_take_part?: string
          id?: string
          kind?: string
          last_verified_at?: string
          recurrence_text?: string
          source_url?: string
          start_text?: string
          status?: string
          title?: string
          venue_id?: string
          why_it_fits?: string
        }
        Relationships: [
          {
            foreignKeyName: "gatherings_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gatherings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      hosts: {
        Row: {
          contact: string | null
          id: string
          name: string
        }
        Insert: {
          contact?: string | null
          id: string
          name: string
        }
        Update: {
          contact?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      moons: {
        Row: {
          checkin_id: string
          created_at: string
          id: string
          note: string | null
          photo_path: string | null
          word: string
        }
        Insert: {
          checkin_id: string
          created_at?: string
          id?: string
          note?: string | null
          photo_path?: string | null
          word: string
        }
        Update: {
          checkin_id?: string
          created_at?: string
          id?: string
          note?: string | null
          photo_path?: string | null
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "moons_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: true
            referencedRelation: "checkins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moons_checkin_id_fkey"
            columns: ["checkin_id"]
            isOneToOne: true
            referencedRelation: "my_checkins"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birthday: string
          created_at: string
          display_name: string
          id: string
          is_tester: boolean
          sun_sign: string | null
        }
        Insert: {
          birthday: string
          created_at?: string
          display_name: string
          id: string
          is_tester?: boolean
          sun_sign?: string | null
        }
        Update: {
          birthday?: string
          created_at?: string
          display_name?: string
          id?: string
          is_tester?: boolean
          sun_sign?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          ends_at: string | null
          gathering_id: string
          id: string
          starts_at: string
          status: string
        }
        Insert: {
          ends_at?: string | null
          gathering_id: string
          id?: string
          starts_at: string
          status?: string
        }
        Update: {
          ends_at?: string | null
          gathering_id?: string
          id?: string
          starts_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_gathering_id_fkey"
            columns: ["gathering_id"]
            isOneToOne: false
            referencedRelation: "gatherings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_gathering_id_fkey"
            columns: ["gathering_id"]
            isOneToOne: false
            referencedRelation: "my_checkins"
            referencedColumns: ["gathering_id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string
          id: string
          lat: number | null
          lng: number | null
          name: string
        }
        Insert: {
          address: string
          id: string
          lat?: number | null
          lng?: number | null
          name: string
        }
        Update: {
          address?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      my_checkins: {
        Row: {
          art_form: string | null
          created_at: string | null
          ends_at: string | null
          gathering_id: string | null
          id: string | null
          kind: string | null
          moon_note: string | null
          moon_photo_path: string | null
          moon_word: string | null
          planet_number: number | null
          session_id: string | null
          starts_at: string | null
          title: string | null
          venue_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_windows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gatherings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      session_windows: {
        Row: {
          closes_at: string | null
          ends_at: string | null
          gathering_id: string | null
          id: string | null
          opens_at: string | null
          starts_at: string | null
          status: string | null
        }
        Insert: {
          closes_at?: never
          ends_at?: string | null
          gathering_id?: string | null
          id?: string | null
          opens_at?: never
          starts_at?: string | null
          status?: string | null
        }
        Update: {
          closes_at?: never
          ends_at?: string | null
          gathering_id?: string | null
          id?: string | null
          opens_at?: never
          starts_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_gathering_id_fkey"
            columns: ["gathering_id"]
            isOneToOne: false
            referencedRelation: "gatherings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_gathering_id_fkey"
            columns: ["gathering_id"]
            isOneToOne: false
            referencedRelation: "my_checkins"
            referencedColumns: ["gathering_id"]
          },
        ]
      }
    }
    Functions: {
      check_in: {
        Args: {
          p_accuracy?: number
          p_lat?: number
          p_lng?: number
          p_pretend_place?: boolean
          p_pretend_time?: boolean
          p_session_id: string
        }
        Returns: {
          checkin_id: string
          is_new: boolean
          planet_number: number
          sun_count: number
        }[]
      }
      checkin_closes_at: {
        Args: { ends_at: string; starts_at: string }
        Returns: string
      }
      checkin_opens_at: { Args: { starts_at: string }; Returns: string }
      dev_delete_my_checkins: { Args: never; Returns: number }
      sun_sign_for: { Args: { birthday: string }; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
