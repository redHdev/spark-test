export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];
export type DatabaseRow<Table extends keyof Database['public']['Tables']> = Database['public']['Tables'][Table]['Row'];

export interface Database {
  public: {
    Tables: {
      referrals: {
          Row: {
            id: string;
            name: string;
            created_at: string;
            referer_id: string;
            referral_code: number;
            referral1_email: string;
            referral2_email: string;
            referral1_name: string;
            referral2_name: string;
            referral1_id: string;
            referral2_id: string;
            is_full: boolean;
          };
          Insert: {
            id?: string;
            name: string;
            created_at?: string;
            referer_id: string;
            referral_code?: number;
            referral1_email?: string;
            referral2_email?: string;
            referral1_name?: string;
            referral2_name?: string;
            referral1_id?: string;
            referral2_id?: string;
            is_full: boolean;
          };
  Update: {
    id?: string;
    name?: string;
    created_at?: string;
    referer_id?: string;
    referral_code?: number;
    referral1_email?: string;
    referral2_email?: string;
    referral1_name?: string;
    referral2_name?: string;
    referral1_id?: string;
    referral2_id?: string;
    is_full?: boolean;
  };
};
      teams: {
          Row: {
            id: string;
            name: string;
            created_at: string;
            owner_id: string;
            team_code: number;
            member1_email: string;
            member2_email: string;
            member1_name: string;
            member2_name: string;
            member1_id: string;
            member2_id: string;
          };
          Insert: {
            id?: string;
            name: string;
            created_at?: string;
            owner_id: string;
            team_code?: number;
            member1_email?: string;
            member2_email?: string;
            member1_name?: string;
            member2_name?: string;
            member1_id?: string;
            member2_id?: string;
          };
  Update: {
    id?: string;
    name?: string;
    created_at?: string;
    owner_id?: string;
    team_code?: number;
    member1_email?: string;
    member2_email?: string;
    member1_name?: string;
    member2_name?: string;
    member1_id?: string;
    member2_id?: string;
  };
};

      clients: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          phone: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          phone?: string | null;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          phone?: string | null;
          user_id?: string;
        };
      };
      api_tokens: {
  Row: {
    id: string;
    user_id: string;
    token: string;
    created_at: string;
    freemium: boolean;
    premium: boolean;
    total_tokens: number;
    num_tokens: number;
    last_reset: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    token: string;
    created_at?: string;
    last_reset?: string;
    freemium: boolean;
    premium: boolean;
    total_tokens: number;
    num_tokens: number;
  };
  Update: {
    id?: string;
    user_id?: string;
    token?: string;
    created_at?: string;
    last_reset?: string;
    freemium?: boolean;
    premium?: boolean;
    total_tokens?: number;
    num_tokens?: number;
  };
};
      team_invitations: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          created_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      customers: {
        Row: {
          stripe_customer_id: string;
          user_id: string;
        };
        Insert: {
          stripe_customer_id: string;
          user_id: string;
        };
        Update: {
          stripe_customer_id?: string;
          user_id?: string;
        };
      };
      prices: {
        Row: {
          active: boolean | null;
          currency: string | null;
          description: string | null;
          id: string;
          interval: Database['public']['Enums']['pricing_plan_interval'] | null;
          interval_count: number | null;
          metadata: Json | null;
          product_id: string | null;
          trial_period_days: number | null;
          type: Database['public']['Enums']['pricing_type'] | null;
          unit_amount: number | null;
        };
        Insert: {
          active?: boolean | null;
          currency?: string | null;
          description?: string | null;
          id: string;
          interval?: Database['public']['Enums']['pricing_plan_interval'] | null;
          interval_count?: number | null;
          metadata?: Json | null;
          product_id?: string | null;
          trial_period_days?: number | null;
          type?: Database['public']['Enums']['pricing_type'] | null;
          unit_amount?: number | null;
        };
        Update: {
          active?: boolean | null;
          currency?: string | null;
          description?: string | null;
          id?: string;
          interval?: Database['public']['Enums']['pricing_plan_interval'] | null;
          interval_count?: number | null;
          metadata?: Json | null;
          product_id?: string | null;
          trial_period_days?: number | null;
          type?: Database['public']['Enums']['pricing_type'] | null;
          unit_amount?: number | null;
        };
      };
      products: {
        Row: {
          active: boolean | null;
          description: string | null;
          id: string;
          image: string | null;
          metadata: Json | null;
          name: string | null;
        };
        Insert: {
          active?: boolean | null;
          description?: string | null;
          id: string;
          image?: string | null;
          metadata?: Json | null;
          name?: string | null;
        };
        Update: {
          active?: boolean | null;
          description?: string | null;
          id?: string;
          image?: string | null;
          metadata?: Json | null;
          name?: string | null;
        };
      };
      subscriptions: {
        Row: {
          cancel_at: string | null;
          cancel_at_period_end: boolean | null;
          canceled_at: string | null;
          created_at: string;
          current_period_end: string;
          current_period_start: string;
          ended_at: string | null;
          id: string;
          metadata: Json | null;
          price_id: string | null;
          product_id: string;
          quantity: number | null;
          status: Database['public']['Enums']['subscription_status'] | null;
          trial_end: string | null;
          trial_start: string | null;
          user_id: string;
        };
        Insert: {
          cancel_at?: string | null;
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          created_at?: string;
          current_period_end?: string;
          current_period_start?: string;
          ended_at?: string | null;
          id: string;
          metadata?: Json | null;
          price_id?: string | null;
          product_id: string;
          quantity?: number | null;
          status?: Database['public']['Enums']['subscription_status'] | null;
          trial_end?: string | null;
          trial_start?: string | null;
          user_id: string;
        };
        Update: {
          cancel_at?: string | null;
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          created_at?: string;
          current_period_end?: string;
          current_period_start?: string;
          ended_at?: string | null;
          id?: string;
          metadata?: Json | null;
          price_id?: string | null;
          product_id?: string;
          quantity?: number | null;
          status?: Database['public']['Enums']['subscription_status'] | null;
          trial_end?: string | null;
          trial_start?: string | null;
          user_id?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      pricing_plan_interval: 'day' | 'month' | 'week' | 'year';
      pricing_type: 'one_time' | 'recurring';
      subscription_status:
        | 'trialing'
        | 'active'
        | 'canceled'
        | 'incomplete'
        | 'incomplete_expired'
        | 'past_due'
        | 'unpaid'
        | 'paused';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
