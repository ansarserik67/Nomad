export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TripStatus = "planning" | "upcoming" | "active" | "completed" | "archived";
export type TripMemberRole = "owner" | "editor" | "viewer";
export type ExpenseCategory =
  | "flights"
  | "stay"
  | "food"
  | "transport"
  | "activities"
  | "shopping"
  | "other";
export type ItineraryCategory = "activity" | "food" | "transport" | "stay" | "note";
export type DocumentCategory =
  | "ticket"
  | "booking"
  | "passport"
  | "insurance"
  | "receipt"
  | "other";
export type AiUsageKind = "assistant" | "itinerary" | "budget_analysis" | "recommendations";
export type AiUsageStatus = "pending" | "success" | "failed";

type Timestamps = { created_at: string; updated_at: string };

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  home_city: string | null;
  home_country: string | null;
  home_currency: string;
  travel_style: "slow" | "balanced" | "fast" | "luxury" | "budget";
  onboarded: boolean;
} & Timestamps;

export type Trip = {
  id: string;
  owner_id: string;
  title: string;
  destination_city: string;
  destination_country: string;
  destination_country_code: string | null;
  destination_lat: number | null;
  destination_lng: number | null;
  start_date: string | null;
  end_date: string | null;
  travelers: number;
  budget_amount: number;
  currency: string;
  status: TripStatus;
  cover_hue: number;
  notes: string | null;
} & Timestamps;

export type TripMember = {
  id: string;
  trip_id: string;
  user_id: string | null;
  email: string;
  role: TripMemberRole;
  status: "pending" | "active";
  invited_by: string | null;
} & Timestamps;

export type ItineraryItem = {
  id: string;
  trip_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  category: ItineraryCategory;
  day_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location_name: string | null;
  lat: number | null;
  lng: number | null;
  cost_amount: number;
  currency: string;
  status: "planned" | "booked" | "done";
  sort_order: number;
} & Timestamps;

export type Expense = {
  id: string;
  trip_id: string;
  created_by: string | null;
  title: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  exchange_rate: number;
  spent_on: string;
  notes: string | null;
} & Timestamps;

export type GroupExpense = {
  id: string;
  trip_id: string;
  expense_id: string | null;
  paid_by: string | null;
  title: string;
  amount: number;
  currency: string;
  split_type: "equal" | "custom";
  participants: Json;
  settled: boolean;
  spent_on: string;
} & Timestamps;

export type DocumentRecord = {
  id: string;
  owner_id: string;
  trip_id: string | null;
  title: string;
  category: DocumentCategory;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  expires_on: string | null;
  notes: string | null;
} & Timestamps;

export type AiUsage = {
  id: string;
  user_id: string;
  kind: AiUsageKind;
  model: string;
  status: AiUsageStatus;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
};

export type SavedDestination = {
  id: string;
  user_id: string;
  city: string;
  country: string;
  country_code: string;
  lat: number | null;
  lng: number | null;
  note: string | null;
  created_at: string;
};

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        Profile,
        {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          home_city?: string | null;
          home_country?: string | null;
          home_currency?: string;
          travel_style?: Profile["travel_style"];
          onboarded?: boolean;
          created_at?: string;
          updated_at?: string;
        },
        Partial<{
          full_name: string | null;
          avatar_url: string | null;
          home_city: string | null;
          home_country: string | null;
          home_currency: string;
          travel_style: Profile["travel_style"];
          onboarded: boolean;
          updated_at: string;
        }>
      >;
      trips: Table<
        Trip,
        {
          id?: string;
          owner_id: string;
          title: string;
          destination_city: string;
          destination_country: string;
          destination_country_code?: string | null;
          destination_lat?: number | null;
          destination_lng?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          travelers?: number;
          budget_amount?: number;
          currency?: string;
          status?: TripStatus;
          cover_hue?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Omit<Trip, "id" | "owner_id" | "created_at">>
      >;
      trip_members: Table<
        TripMember,
        {
          id?: string;
          trip_id: string;
          user_id?: string | null;
          email: string;
          role?: TripMemberRole;
          status?: "pending" | "active";
          invited_by?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Omit<TripMember, "id" | "trip_id" | "created_at">>
      >;
      itinerary_items: Table<
        ItineraryItem,
        {
          id?: string;
          trip_id: string;
          created_by?: string | null;
          title: string;
          description?: string | null;
          category?: ItineraryCategory;
          day_date?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          location_name?: string | null;
          lat?: number | null;
          lng?: number | null;
          cost_amount?: number;
          currency?: string;
          status?: ItineraryItem["status"];
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Omit<ItineraryItem, "id" | "trip_id" | "created_at">>
      >;
      expenses: Table<
        Expense,
        {
          id?: string;
          trip_id: string;
          created_by?: string | null;
          title: string;
          category?: ExpenseCategory;
          amount: number;
          currency?: string;
          exchange_rate?: number;
          spent_on?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Omit<Expense, "id" | "trip_id" | "created_at">>
      >;
      group_expenses: Table<
        GroupExpense,
        {
          id?: string;
          trip_id: string;
          expense_id?: string | null;
          paid_by?: string | null;
          title: string;
          amount: number;
          currency?: string;
          split_type?: "equal" | "custom";
          participants?: Json;
          settled?: boolean;
          spent_on?: string;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Omit<GroupExpense, "id" | "trip_id" | "created_at">>
      >;
      documents: Table<
        DocumentRecord,
        {
          id?: string;
          owner_id: string;
          trip_id?: string | null;
          title: string;
          category?: DocumentCategory;
          file_path: string;
          file_name: string;
          mime_type?: string | null;
          file_size?: number | null;
          expires_on?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        Partial<Omit<DocumentRecord, "id" | "owner_id" | "created_at">>
      >;
      ai_usage: Table<
        AiUsage,
        {
          id?: string;
          user_id: string;
          kind?: AiUsageKind;
          model: string;
          status?: AiUsageStatus;
          prompt_tokens?: number | null;
          completion_tokens?: number | null;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        },
        Partial<Omit<AiUsage, "id" | "user_id" | "created_at">>
      >;
      saved_destinations: Table<
        SavedDestination,
        {
          id?: string;
          user_id: string;
          city: string;
          country: string;
          country_code: string;
          lat?: number | null;
          lng?: number | null;
          note?: string | null;
          created_at?: string;
        },
        Partial<Omit<SavedDestination, "id" | "user_id" | "created_at">>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      claim_ai_operation: {
        Args: { p_kind: AiUsageKind; p_model: string };
        Returns: string | null;
      };
      finish_ai_operation: {
        Args: {
          p_id: string;
          p_success: boolean;
          p_prompt_tokens?: number | null;
          p_completion_tokens?: number | null;
          p_error?: string | null;
        };
        Returns: Json;
      };
      ai_usage_today: {
        Args: Record<string, never>;
        Returns: Json;
      };
      invite_trip_member: {
        Args: { p_trip_id: string; p_email: string; p_role?: TripMemberRole };
        Returns: Json;
      };
      is_trip_member: { Args: { p_trip_id: string }; Returns: boolean };
      trip_role: { Args: { p_trip_id: string }; Returns: string | null };
      can_edit_trip: { Args: { p_trip_id: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type AiQuota = { used: number; limit: number; remaining: number };
