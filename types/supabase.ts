export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      account_type_setup: {
        Row: {
          admin_code: string | null
          id: number
          moderator_code: string | null
        }
        Insert: {
          admin_code?: string | null
          id?: number
          moderator_code?: string | null
        }
        Update: {
          admin_code?: string | null
          id?: number
          moderator_code?: string | null
        }
        Relationships: []
      }
      account_types: {
        Row: {
          created_at: string
          id: number
          preselected_chatcode: string | null
          user_account_type: string | null
          user_account_type_selected: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          preselected_chatcode?: string | null
          user_account_type?: string | null
          user_account_type_selected?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          preselected_chatcode?: string | null
          user_account_type?: string | null
          user_account_type_selected?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "account_types_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      companions: {
        Row: {
          characters: string | null
          chatcode: string | null
          companion_id: string | null
          created_at: string
          description: string | null
          extras: string | null
          id: number
          intros: string | null
          name: string | null
          pfp: string | null
          settings: Json | null
          test_questions: Json | null
          user_id: string | null
          user_list: Json
        }
        Insert: {
          characters?: string | null
          chatcode?: string | null
          companion_id?: string | null
          created_at?: string
          description?: string | null
          extras?: string | null
          id?: number
          intros?: string | null
          name?: string | null
          pfp?: string | null
          settings?: Json | null
          test_questions?: Json | null
          user_id?: string | null
          user_list?: Json
        }
        Update: {
          characters?: string | null
          chatcode?: string | null
          companion_id?: string | null
          created_at?: string
          description?: string | null
          extras?: string | null
          id?: number
          intros?: string | null
          name?: string | null
          pfp?: string | null
          settings?: Json | null
          test_questions?: Json | null
          user_id?: string | null
          user_list?: Json
        }
        Relationships: [
          {
            foreignKeyName: "companions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      customers: {
        Row: {
          id: number | null
          stripe_customer_id: string
          user_id: string
        }
        Insert: {
          id?: number | null
          stripe_customer_id: string
          user_id: string
        }
        Update: {
          id?: number | null
          stripe_customer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      files: {
        Row: {
          chunks_remaining: string | null
          companion_id: string | null
          created_at: string
          file_content: string | null
          file_extension: string | null
          file_id: string | null
          file_name: string | null
          has_uploaded: boolean
          id: number
          total_chunks: string | null
          user_id: string | null
        }
        Insert: {
          chunks_remaining?: string | null
          companion_id?: string | null
          created_at?: string
          file_content?: string | null
          file_extension?: string | null
          file_id?: string | null
          file_name?: string | null
          has_uploaded?: boolean
          id?: number
          total_chunks?: string | null
          user_id?: string | null
        }
        Update: {
          chunks_remaining?: string | null
          companion_id?: string | null
          created_at?: string
          file_content?: string | null
          file_extension?: string | null
          file_id?: string | null
          file_name?: string | null
          has_uploaded?: boolean
          id?: number
          total_chunks?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      library: {
        Row: {
          id: number
          SCOMP: Json | null
          SE: Json[] | null
          SGPT: Json[] | null
        }
        Insert: {
          id?: number
          SCOMP?: Json | null
          SE?: Json[] | null
          SGPT?: Json[] | null
        }
        Update: {
          id?: number
          SCOMP?: Json | null
          SE?: Json[] | null
          SGPT?: Json[] | null
        }
        Relationships: []
      }
      memories: {
        Row: {
          companion_id: string
          content: string | null
          created_at: string | null
          embeddings: string | null
          file_id: string | null
          id: number
          memory_name: string | null
          token_count: number | null
          user_id: string
        }
        Insert: {
          companion_id: string
          content?: string | null
          created_at?: string | null
          embeddings?: string | null
          file_id?: string | null
          id?: number
          memory_name?: string | null
          token_count?: number | null
          user_id: string
        }
        Update: {
          companion_id?: string
          content?: string | null
          created_at?: string | null
          embeddings?: string | null
          file_id?: string | null
          id?: number
          memory_name?: string | null
          token_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      prices: {
        Row: {
          active: boolean | null
          currency: string | null
          description: string | null
          id: string
          interval: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count: number | null
          metadata: Json | null
          product_id: string | null
          trial_period_days: number | null
          type: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount: number | null
        }
        Insert: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Update: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          active: boolean | null
          description: string | null
          id: string
          image: string | null
          metadata: Json | null
          name: string | null
        }
        Insert: {
          active?: boolean | null
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Update: {
          active?: boolean | null
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Relationships: []
      }
      shared_companions: {
        Row: {
          companion_id: string | null
          created_at: string
          id: number
          my_chatcodes: string
          user_id: string | null
        }
        Insert: {
          companion_id?: string | null
          created_at?: string
          id?: number
          my_chatcodes: string
          user_id?: string | null
        }
        Update: {
          companion_id?: string | null
          created_at?: string
          id?: number
          my_chatcodes?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shared_companions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          id: string
          metadata: Json | null
          price_id: string | null
          product_id: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          trial_end: string | null
          trial_start: string | null
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id: string
          metadata?: Json | null
          price_id?: string | null
          product_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          price_id?: string | null
          product_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      test_results: {
        Row: {
          companion_id: string | null
          created_at: string
          id: number
          test_state: Json | null
          user_id: string | null
        }
        Insert: {
          companion_id?: string | null
          created_at?: string
          id?: number
          test_state?: Json | null
          user_id?: string | null
        }
        Update: {
          companion_id?: string | null
          created_at?: string
          id?: number
          test_state?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_conversation_ids: {
        Row: {
          conversation_id: string
          gameplayState: Json
          modLastUsed: Json
          time: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          gameplayState?: Json
          modLastUsed?: Json
          time?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          gameplayState?: Json
          modLastUsed?: Json
          time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_conversation_ids_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_conversations: {
        Row: {
          content: string | null
          conversation_id: string
          embeddings: string | null
          heading: string | null
          id: number
          modUsed: Json
          owner: string
          sender: string | null
          time: string | null
          token_count: number | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          embeddings?: string | null
          heading?: string | null
          id?: number
          modUsed?: Json
          owner: string
          sender?: string | null
          time?: string | null
          token_count?: number | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          embeddings?: string | null
          heading?: string | null
          id?: number
          modUsed?: Json
          owner?: string
          sender?: string | null
          time?: string | null
          token_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_conversations_owner_fkey"
            columns: ["owner"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_mods: {
        Row: {
          companions: Json | null
          id: number
          mymodpack: Json | null
          mymods: Json | null
          roomcode: string | null
          user_id: string | null
        }
        Insert: {
          companions?: Json | null
          id?: number
          mymodpack?: Json | null
          mymods?: Json | null
          roomcode?: string | null
          user_id?: string | null
        }
        Update: {
          companions?: Json | null
          id?: number
          mymodpack?: Json | null
          mymods?: Json | null
          roomcode?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_mods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_conversation_parents: {
        Args: {
          conversation_id: number
        }
        Returns: {
          id: number
          parent_conversation_id: number
          conversation_name: string
          meta: Json
        }[]
      }
      get_page_parents: {
        Args: {
          page_id: number
        }
        Returns: {
          id: number
          parent_page_id: number
          path: string
          meta: Json
        }[]
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      match_companion_memories: {
        Args: {
          embedding: string
          match_threshold: number
          match_count: number
          min_content_length: number
          companion_id_param: string
        }
        Returns: {
          id: number
          companion_id: string
          user_id: string
          embeddings: string
          content: string
          memory_name: string
          similarity: number
        }[]
      }
      match_context_memories: {
        Args: {
          conversation_id_param: number
          min_content_length: number
          embedding: string
          match_threshold: number
          companion_id: number
          match_count: number
        }
        Returns: {
          id: number
          owner: string
          conversation_id: number
          embeddings: string
          content: string
          sender: string
          token_count: number
          heading: string
          context: string
          similarity: number
        }[]
      }
      match_conversation_sections: {
        Args: {
          embedding: string
          match_threshold: number
          match_count: number
          min_content_length: number
        }
        Returns: {
          id: number
          conversation_id: number
          slug: string
          heading: string
          content: string
          similarity: number
        }[]
      }
      match_memories:
        | {
            Args: {
              companion_id_param: number
              query_embedding: string
              match_threshold: number
              match_count: number
              min_content_length: number
            }
            Returns: {
              id: number
              companion_id: number
              embeddings: string
              content: string
              user_id: number
              memory_name: string
              similarity: number
            }[]
          }
        | {
            Args: {
              query_embedding: string
              match_threshold: number
              match_count: number
              min_content_length: number
              companion_id_param: string
            }
            Returns: {
              id: string
              companion_id: string
              embeddings: string
              content: string
              user_id: string
              memory_name: string
              similarity: number
            }[]
          }
      match_memories_f: {
        Args: {
          query_embedding: string
          companion_id: string
          match_threshold: number
          match_count: number
          min_content_length: number
        }
        Returns: {
          id: number
          content: string
          similarity: number
        }[]
      }
      match_memory: {
        Args: {
          query_embedding: string
          companion_id: string
        }
        Returns: {
          content: string
        }[]
      }
      match_memory_a: {
        Args: {
          query_embedding: string
          min_content_length: number
          match_count: number
          match_threshold: number
        }
        Returns: {
          content: string
        }[]
      }
      match_page_sections: {
        Args: {
          embedding: string
          match_threshold: number
          match_count: number
          min_content_length: number
          the_id: number
        }
        Returns: {
          id: number
          page_id: number
          slug: string
          heading: string
          content: string
          similarity: number
        }[]
      }
      match_user_conversations: {
        Args: {
          embedding: string
          match_threshold: number
          match_count: number
          min_content_length: number
          conversation_id_param: string
        }
        Returns: {
          id: number
          owner: string
          conversation_id: string
          embeddings: string
          content: string
          sender: string
          token_count: number
          heading: string
          similarity: number
        }[]
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "paused"
        | "unpaid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
