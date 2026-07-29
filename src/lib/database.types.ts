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
    PostgrestVersion: "14.5"
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
      adoption_requests: {
        Row: {
          adopter_id: string
          animal_id: string
          created_at: string
          id: string
          message: string | null
          questionnaire: Json | null
          shelter_notes: string | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          adopter_id: string
          animal_id: string
          created_at?: string
          id?: string
          message?: string | null
          questionnaire?: Json | null
          shelter_notes?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          adopter_id?: string
          animal_id?: string
          created_at?: string
          id?: string
          message?: string | null
          questionnaire?: Json | null
          shelter_notes?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adoption_requests_adopter_id_fkey"
            columns: ["adopter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adoption_requests_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
      adoption_stories: {
        Row: {
          adopter_id: string
          animal_id: string
          consent: boolean
          created_at: string
          id: string
          photo_url: string | null
          published_at: string | null
          quote: string
          shelter_id: string
          shelter_note: string | null
          status: string
          updated_at: string
        }
        Insert: {
          adopter_id: string
          animal_id: string
          consent?: boolean
          created_at?: string
          id?: string
          photo_url?: string | null
          published_at?: string | null
          quote: string
          shelter_id: string
          shelter_note?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          adopter_id?: string
          animal_id?: string
          consent?: boolean
          created_at?: string
          id?: string
          photo_url?: string | null
          published_at?: string | null
          quote?: string
          shelter_id?: string
          shelter_note?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adoption_stories_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adoption_stories_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
        ]
      }
      animal_media: {
        Row: {
          animal_id: string
          created_at: string
          id: string
          is_cover: boolean
          sort_order: number
          type: Database["public"]["Enums"]["media_type"]
          url: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          id?: string
          is_cover?: boolean
          sort_order?: number
          type?: Database["public"]["Enums"]["media_type"]
          url: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          id?: string
          is_cover?: boolean
          sort_order?: number
          type?: Database["public"]["Enums"]["media_type"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "animal_media_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
      animals: {
        Row: {
          adoption_fee: number | null
          apartment_suitable: boolean | null
          birth_date_approx: string | null
          breed: string | null
          created_at: string
          description: string | null
          energy_level: Database["public"]["Enums"]["energy_level"] | null
          entry_date: string | null
          good_with_cats: boolean | null
          good_with_dogs: boolean | null
          good_with_kids: boolean | null
          health_notes: string | null
          id: string
          microchipped: boolean
          moderation_note: string | null
          name: string
          published_at: string | null
          sex: Database["public"]["Enums"]["animal_sex"]
          shelter_id: string
          size: Database["public"]["Enums"]["animal_size"] | null
          slug: string
          special_needs: string | null
          species: Database["public"]["Enums"]["animal_species"] | null
          sponsor_link: string | null
          sponsor_note: string | null
          sponsorable: boolean
          status: Database["public"]["Enums"]["animal_status"]
          sterilized: boolean
          updated_at: string
          urgent: boolean
          vaccinated: boolean
          weight_kg: number | null
        }
        Insert: {
          adoption_fee?: number | null
          apartment_suitable?: boolean | null
          birth_date_approx?: string | null
          breed?: string | null
          created_at?: string
          description?: string | null
          energy_level?: Database["public"]["Enums"]["energy_level"] | null
          entry_date?: string | null
          good_with_cats?: boolean | null
          good_with_dogs?: boolean | null
          good_with_kids?: boolean | null
          health_notes?: string | null
          id?: string
          microchipped?: boolean
          moderation_note?: string | null
          name: string
          published_at?: string | null
          sex?: Database["public"]["Enums"]["animal_sex"]
          shelter_id: string
          size?: Database["public"]["Enums"]["animal_size"] | null
          slug: string
          special_needs?: string | null
          species?: Database["public"]["Enums"]["animal_species"] | null
          sponsor_link?: string | null
          sponsor_note?: string | null
          sponsorable?: boolean
          status?: Database["public"]["Enums"]["animal_status"]
          sterilized?: boolean
          updated_at?: string
          urgent?: boolean
          vaccinated?: boolean
          weight_kg?: number | null
        }
        Update: {
          adoption_fee?: number | null
          apartment_suitable?: boolean | null
          birth_date_approx?: string | null
          breed?: string | null
          created_at?: string
          description?: string | null
          energy_level?: Database["public"]["Enums"]["energy_level"] | null
          entry_date?: string | null
          good_with_cats?: boolean | null
          good_with_dogs?: boolean | null
          good_with_kids?: boolean | null
          health_notes?: string | null
          id?: string
          microchipped?: boolean
          moderation_note?: string | null
          name?: string
          published_at?: string | null
          sex?: Database["public"]["Enums"]["animal_sex"]
          shelter_id?: string
          size?: Database["public"]["Enums"]["animal_size"] | null
          slug?: string
          special_needs?: string | null
          species?: Database["public"]["Enums"]["animal_species"] | null
          sponsor_link?: string | null
          sponsor_note?: string | null
          sponsorable?: boolean
          status?: Database["public"]["Enums"]["animal_status"]
          sterilized?: boolean
          updated_at?: string
          urgent?: boolean
          vaccinated?: boolean
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "animals_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          adopter_id: string
          cancel_reason: string | null
          cancelled_by: string | null
          created_at: string
          ends_at: string
          id: string
          reminder_sent_at: string | null
          request_id: string
          shelter_id: string
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          adopter_id: string
          cancel_reason?: string | null
          cancelled_by?: string | null
          created_at?: string
          ends_at: string
          id?: string
          reminder_sent_at?: string | null
          request_id: string
          shelter_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          adopter_id?: string
          cancel_reason?: string | null
          cancelled_by?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          reminder_sent_at?: string | null
          request_id?: string
          shelter_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_adopter_id_fkey"
            columns: ["adopter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "adoption_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_overrides: {
        Row: {
          closed: boolean
          created_at: string
          date: string
          id: string
          note: string | null
          shelter_id: string
          slots: Json
          updated_at: string
        }
        Insert: {
          closed?: boolean
          created_at?: string
          date: string
          id?: string
          note?: string | null
          shelter_id: string
          slots?: Json
          updated_at?: string
        }
        Update: {
          closed?: boolean
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          shelter_id?: string
          slots?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_overrides_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_slots: {
        Row: {
          active: boolean
          created_at: string
          end_time: string
          id: string
          shelter_id: string
          slot_minutes: number
          start_time: string
          updated_at: string
          weekday: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_time: string
          id?: string
          shelter_id: string
          slot_minutes?: number
          start_time: string
          updated_at?: string
          weekday: number
        }
        Update: {
          active?: boolean
          created_at?: string
          end_time?: string
          id?: string
          shelter_id?: string
          slot_minutes?: number
          start_time?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_templates: {
        Row: {
          created_at: string
          id: string
          nombre: string
          shelter_id: string
          slots: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
          shelter_id: string
          slots?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          shelter_id?: string
          slots?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_templates_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_offers: {
        Row: {
          categoria: string
          city: string | null
          created_at: string
          descripcion: string
          id: string
          location: unknown
          radius_km: number
          renovada_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria: string
          city?: string | null
          created_at?: string
          descripcion: string
          id?: string
          location: unknown
          radius_km?: number
          renovada_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string
          city?: string | null
          created_at?: string
          descripcion?: string
          id?: string
          location?: unknown
          radius_km?: number
          renovada_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_offers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_animals: {
        Row: {
          animal_id: string
          event_id: string
        }
        Insert: {
          animal_id: string
          event_id: string
        }
        Update: {
          animal_id?: string
          event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_animals_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_animals_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          created_at: string
          event_id: string
          reminded_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          reminded_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          reminded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          adoptions_count: number | null
          attended_count: number | null
          capacity: number | null
          city: string | null
          created_at: string
          description: string
          ends_at: string
          id: string
          location: unknown
          poster_url: string | null
          reminder_sent_at: string | null
          shelter_id: string
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
          zone_notified_at: string | null
        }
        Insert: {
          address?: string | null
          adoptions_count?: number | null
          attended_count?: number | null
          capacity?: number | null
          city?: string | null
          created_at?: string
          description?: string
          ends_at: string
          id?: string
          location?: unknown
          poster_url?: string | null
          reminder_sent_at?: string | null
          shelter_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
          zone_notified_at?: string | null
        }
        Update: {
          address?: string | null
          adoptions_count?: number | null
          attended_count?: number | null
          capacity?: number | null
          city?: string | null
          created_at?: string
          description?: string
          ends_at?: string
          id?: string
          location?: unknown
          poster_url?: string | null
          reminder_sent_at?: string | null
          shelter_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
          zone_notified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          animal_id: string
          created_at: string
          notified_at: string | null
          user_id: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          notified_at?: string | null
          user_id: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          notified_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      foster_homes: {
        Row: {
          active: boolean
          city: string | null
          condiciones: Json
          consent_at: string
          created_at: string
          location: unknown
          radius_km: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          city?: string | null
          condiciones?: Json
          consent_at: string
          created_at?: string
          location: unknown
          radius_km?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          city?: string | null
          condiciones?: Json
          consent_at?: string
          created_at?: string
          location?: unknown
          radius_km?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "foster_homes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      foster_proposals: {
        Row: {
          animal_id: string | null
          created_at: string
          duracion: string
          foster_user_id: string
          id: string
          mensaje: string
          relevo_fecha_limite: string | null
          relevo_motivo: string | null
          relevo_pedido_at: string | null
          shelter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          animal_id?: string | null
          created_at?: string
          duracion: string
          foster_user_id: string
          id?: string
          mensaje: string
          relevo_fecha_limite?: string | null
          relevo_motivo?: string | null
          relevo_pedido_at?: string | null
          shelter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          animal_id?: string | null
          created_at?: string
          duracion?: string
          foster_user_id?: string
          id?: string
          mensaje?: string
          relevo_fecha_limite?: string | null
          relevo_motivo?: string | null
          relevo_pedido_at?: string | null
          shelter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "foster_proposals_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foster_proposals_foster_user_id_fkey"
            columns: ["foster_user_id"]
            isOneToOne: false
            referencedRelation: "foster_homes"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "foster_proposals_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
        ]
      }
      geocode_cache: {
        Row: {
          created_at: string
          lat: number | null
          lng: number | null
          query_norm: string
        }
        Insert: {
          created_at?: string
          lat?: number | null
          lng?: number | null
          query_norm: string
        }
        Update: {
          created_at?: string
          lat?: number | null
          lng?: number | null
          query_norm?: string
        }
        Relationships: []
      }
      lost_found_media: {
        Row: {
          created_at: string
          id: string
          is_cover: boolean
          post_id: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_cover?: boolean
          post_id: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_cover?: boolean
          post_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_found_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "lost_found_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_found_posts: {
        Row: {
          allow_contact: boolean
          breed: string | null
          city: string | null
          collar_description: string | null
          color: string | null
          contact_phone: string | null
          created_at: string
          description: string
          has_collar: boolean | null
          has_microchip: boolean | null
          id: string
          last_activity_at: string
          location: unknown
          name: string | null
          occurred_on: string
          resolution_story: string | null
          sex: Database["public"]["Enums"]["animal_sex"] | null
          size: Database["public"]["Enums"]["animal_size"] | null
          species: Database["public"]["Enums"]["animal_species"]
          status: Database["public"]["Enums"]["lost_found_status"]
          type: Database["public"]["Enums"]["lost_found_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_contact?: boolean
          breed?: string | null
          city?: string | null
          collar_description?: string | null
          color?: string | null
          contact_phone?: string | null
          created_at?: string
          description: string
          has_collar?: boolean | null
          has_microchip?: boolean | null
          id?: string
          last_activity_at?: string
          location: unknown
          name?: string | null
          occurred_on?: string
          resolution_story?: string | null
          sex?: Database["public"]["Enums"]["animal_sex"] | null
          size?: Database["public"]["Enums"]["animal_size"] | null
          species: Database["public"]["Enums"]["animal_species"]
          status?: Database["public"]["Enums"]["lost_found_status"]
          type: Database["public"]["Enums"]["lost_found_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_contact?: boolean
          breed?: string | null
          city?: string | null
          collar_description?: string | null
          color?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string
          has_collar?: boolean | null
          has_microchip?: boolean | null
          id?: string
          last_activity_at?: string
          location?: unknown
          name?: string | null
          occurred_on?: string
          resolution_story?: string | null
          sex?: Database["public"]["Enums"]["animal_sex"] | null
          size?: Database["public"]["Enums"]["animal_size"] | null
          species?: Database["public"]["Enums"]["animal_species"]
          status?: Database["public"]["Enums"]["lost_found_status"]
          type?: Database["public"]["Enums"]["lost_found_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_found_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_found_sightings: {
        Row: {
          created_at: string
          id: string
          location: unknown
          note: string | null
          photo_url: string | null
          post_id: string
          seen_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location: unknown
          note?: string | null
          photo_url?: string | null
          post_id: string
          seen_at: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: unknown
          note?: string | null
          photo_url?: string | null
          post_id?: string
          seen_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_found_sightings_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "lost_found_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_found_sightings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          animal_id: string
          day: string
          views: number
        }
        Insert: {
          animal_id: string
          day?: string
          views?: number
        }
        Update: {
          animal_id?: string
          day?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "page_views_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      reports: {
        Row: {
          animal_id: string
          created_at: string
          details: string | null
          id: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          animal_id: string
          created_at?: string
          details?: string | null
          id?: string
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          animal_id?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: Database["public"]["Enums"]["report_reason"]
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          active: boolean
          created_at: string
          filters: Json
          id: string
          last_sent_at: string | null
          name: string
          unsubscribe_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          filters?: Json
          id?: string
          last_sent_at?: string | null
          name: string
          unsubscribe_token?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          filters?: Json
          id?: string
          last_sent_at?: string | null
          name?: string
          unsubscribe_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shelter_media: {
        Row: {
          created_at: string
          id: string
          is_cover: boolean
          shelter_id: string
          sort_order: number
          type: Database["public"]["Enums"]["media_type"]
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_cover?: boolean
          shelter_id: string
          sort_order?: number
          type?: Database["public"]["Enums"]["media_type"]
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_cover?: boolean
          shelter_id?: string
          sort_order?: number
          type?: Database["public"]["Enums"]["media_type"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "shelter_media_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
        ]
      }
      shelter_needs: {
        Row: {
          categoria: string
          created_at: string
          descripcion: string
          id: string
          shelter_id: string
          status: string
          updated_at: string
          urgencia: string
        }
        Insert: {
          categoria: string
          created_at?: string
          descripcion: string
          id?: string
          shelter_id: string
          status?: string
          updated_at?: string
          urgencia?: string
        }
        Update: {
          categoria?: string
          created_at?: string
          descripcion?: string
          id?: string
          shelter_id?: string
          status?: string
          updated_at?: string
          urgencia?: string
        }
        Relationships: [
          {
            foreignKeyName: "shelter_needs_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
        ]
      }
      shelters: {
        Row: {
          accepts_fostering: boolean
          accepts_volunteers: boolean
          address: string | null
          cif: string | null
          city: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          donation_link: string | null
          email: string | null
          founded_year: number | null
          id: string
          location: unknown
          logo_url: string | null
          name: string
          opening_hours: Json | null
          owner_id: string
          phone: string | null
          postal_code: string | null
          province: string | null
          slug: string
          social_links: Json | null
          status: Database["public"]["Enums"]["shelter_status"]
          submitted_at: string | null
          updated_at: string
          verification_note: string | null
          website: string | null
        }
        Insert: {
          accepts_fostering?: boolean
          accepts_volunteers?: boolean
          address?: string | null
          cif?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          donation_link?: string | null
          email?: string | null
          founded_year?: number | null
          id?: string
          location?: unknown
          logo_url?: string | null
          name: string
          opening_hours?: Json | null
          owner_id: string
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          slug: string
          social_links?: Json | null
          status?: Database["public"]["Enums"]["shelter_status"]
          submitted_at?: string | null
          updated_at?: string
          verification_note?: string | null
          website?: string | null
        }
        Update: {
          accepts_fostering?: boolean
          accepts_volunteers?: boolean
          address?: string | null
          cif?: string | null
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          donation_link?: string | null
          email?: string | null
          founded_year?: number | null
          id?: string
          location?: unknown
          logo_url?: string | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          slug?: string
          social_links?: Json | null
          status?: Database["public"]["Enums"]["shelter_status"]
          submitted_at?: string | null
          updated_at?: string
          verification_note?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shelters_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsorships: {
        Row: {
          animal_id: string
          created_at: string
          id: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          id?: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sponsorships_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adopted_animals_recent: {
        Args: { p_limit?: number }
        Returns: {
          adopted_at: string
          city: string
          cover_url: string
          id: string
          name: string
          province: string
          shelter_name: string
          shelter_slug: string
          slug: string
          species: Database["public"]["Enums"]["animal_species"]
        }[]
      }
      adopter_has_request_for: {
        Args: { p_animal_id: string }
        Returns: boolean
      }
      animals_search: {
        Args: {
          p_apartment_suitable?: boolean
          p_birth_after?: string
          p_birth_before?: string
          p_good_with_cats?: boolean
          p_good_with_dogs?: boolean
          p_good_with_kids?: boolean
          p_lat?: number
          p_limit?: number
          p_lng?: number
          p_offset?: number
          p_order?: string
          p_query?: string
          p_radius_km?: number
          p_sexes?: Database["public"]["Enums"]["animal_sex"][]
          p_sizes?: Database["public"]["Enums"]["animal_size"][]
          p_species?: Database["public"]["Enums"]["animal_species"]
          p_urgent?: boolean
        }
        Returns: {
          birth_date_approx: string
          city: string
          cover_url: string
          distance_m: number
          id: string
          name: string
          province: string
          published_at: string
          sex: Database["public"]["Enums"]["animal_sex"]
          shelter_name: string
          shelter_slug: string
          size: Database["public"]["Enums"]["animal_size"]
          slug: string
          species: Database["public"]["Enums"]["animal_species"]
          status: Database["public"]["Enums"]["animal_status"]
          total_count: number
          urgent: boolean
        }[]
      }
      appointment_free_slots: {
        Args: { p_days?: number; p_shelter_id: string }
        Returns: {
          ends_at: string
          slot_minutes: number
          starts_at: string
        }[]
      }
      availability_override_slots_ok: {
        Args: { p_slots: Json }
        Returns: boolean
      }
      cancelar_relevo: { Args: { p_proposal_id: string }; Returns: undefined }
      contar_interesados: { Args: { p_animal_id: string }; Returns: number }
      donation_offers_nearby: {
        Args: { p_shelter_id: string }
        Returns: {
          categoria: string
          city: string
          created_at: string
          descripcion: string
          distance_km: number
          full_name: string
          id: string
          radius_km: number
          renovada_at: string
        }[]
      }
      es_enlace_pago_valido: { Args: { url: string }; Returns: boolean }
      event_detail: {
        Args: { p_id: string }
        Returns: {
          address: string
          attendee_count: number
          capacity: number
          city: string
          description: string
          ends_at: string
          id: string
          lat: number
          lng: number
          poster_url: string
          shelter_id: string
          shelter_name: string
          shelter_slug: string
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
        }[]
      }
      event_zone_matches: {
        Args: never
        Returns: {
          event_city: string
          event_id: string
          event_title: string
          search_name: string
          starts_at: string
          unsubscribe_token: string
          user_id: string
        }[]
      }
      events_upcoming: {
        Args: { p_lat?: number; p_lng?: number; p_radius_m?: number }
        Returns: {
          address: string
          animal_count: number
          attendee_count: number
          capacity: number
          city: string
          description: string
          distance_m: number
          ends_at: string
          id: string
          lat: number
          lng: number
          poster_url: string
          shelter_id: string
          shelter_name: string
          shelter_slug: string
          starts_at: string
          title: string
        }[]
      }
      foster_homes_nearby: {
        Args: { p_shelter_id: string }
        Returns: {
          city: string
          condiciones: Json
          created_at: string
          distance_km: number
          full_name: string
          radius_km: number
          user_id: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      lost_found_list: {
        Args: never
        Returns: {
          breed: string
          city: string
          collar_description: string
          color: string
          cover_url: string
          created_at: string
          description: string
          has_collar: boolean
          has_microchip: boolean
          id: string
          lat: number
          lng: number
          name: string
          occurred_on: string
          sex: Database["public"]["Enums"]["animal_sex"]
          size: Database["public"]["Enums"]["animal_size"]
          species: Database["public"]["Enums"]["animal_species"]
          status: Database["public"]["Enums"]["lost_found_status"]
          type: Database["public"]["Enums"]["lost_found_type"]
        }[]
      }
      lost_found_media_list: {
        Args: { p_post_id: string }
        Returns: {
          id: string
          is_cover: boolean
          sort_order: number
          url: string
        }[]
      }
      lost_found_sightings_list: {
        Args: { p_post_id: string }
        Returns: {
          created_at: string
          id: string
          lat: number
          lng: number
          note: string
          photo_url: string
          seen_at: string
        }[]
      }
      pedir_relevo: {
        Args: {
          p_fecha_limite: string
          p_motivo: string
          p_proposal_id: string
        }
        Returns: undefined
      }
      registrar_visita: { Args: { p_animal_id: string }; Returns: undefined }
      saved_search_matches: {
        Args: { p_hours?: number }
        Returns: {
          animal_id: string
          animal_name: string
          animal_slug: string
          search_id: string
          search_name: string
          unsubscribe_token: string
          user_id: string
        }[]
      }
      shelter_needs_nearby: {
        Args: { p_lat: number; p_lng: number; p_radius_km: number }
        Returns: {
          categoria: string
          created_at: string
          descripcion: string
          distance_km: number
          id: string
          shelter_city: string
          shelter_name: string
          shelter_slug: string
          urgencia: string
        }[]
      }
      shelter_public_stats: {
        Args: { p_shelter_id: string }
        Returns: {
          adopciones: number
          disponibles: number
        }[]
      }
      shelters_nearby: {
        Args: {
          lat: number
          lng: number
          p_accepts_fostering?: boolean
          p_accepts_volunteers?: boolean
          p_species?: Database["public"]["Enums"]["animal_species"]
          radius_m: number
        }
        Returns: {
          animal_count: number
          city: string
          distance_m: number
          id: string
          lat: number
          lng: number
          name: string
          slug: string
        }[]
      }
    }
    Enums: {
      animal_sex: "male" | "female" | "unknown"
      animal_size: "small" | "medium" | "large"
      animal_species: "dog" | "cat" | "other"
      animal_status:
        | "available"
        | "reserved"
        | "adopted"
        | "fostered"
        | "not_listed"
      appointment_status:
        | "pending"
        | "confirmed"
        | "cancelled"
        | "done"
        | "no_show"
      energy_level: "low" | "medium" | "high"
      event_status: "draft" | "published" | "cancelled" | "finished"
      lost_found_status: "open" | "resolved" | "archived"
      lost_found_type: "lost" | "found"
      media_type: "photo" | "video" | "youtube"
      report_reason:
        | "contenido_inapropiado"
        | "posible_fraude"
        | "spam"
        | "maltrato"
        | "otro"
      report_status: "pending" | "reviewed" | "dismissed"
      request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "withdrawn"
        | "completed"
      shelter_status: "pending" | "verified" | "suspended"
      user_role: "adopter" | "shelter" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      animal_sex: ["male", "female", "unknown"],
      animal_size: ["small", "medium", "large"],
      animal_species: ["dog", "cat", "other"],
      animal_status: [
        "available",
        "reserved",
        "adopted",
        "fostered",
        "not_listed",
      ],
      appointment_status: [
        "pending",
        "confirmed",
        "cancelled",
        "done",
        "no_show",
      ],
      energy_level: ["low", "medium", "high"],
      event_status: ["draft", "published", "cancelled", "finished"],
      lost_found_status: ["open", "resolved", "archived"],
      lost_found_type: ["lost", "found"],
      media_type: ["photo", "video", "youtube"],
      report_reason: [
        "contenido_inapropiado",
        "posible_fraude",
        "spam",
        "maltrato",
        "otro",
      ],
      report_status: ["pending", "reviewed", "dismissed"],
      request_status: [
        "pending",
        "approved",
        "rejected",
        "withdrawn",
        "completed",
      ],
      shelter_status: ["pending", "verified", "suspended"],
      user_role: ["adopter", "shelter", "admin"],
    },
  },
} as const
