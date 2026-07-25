/** Jornada tal como la devuelve el RPC `events_upcoming` (FEATURE-062). */
export type JornadaMapa = {
  id: string;
  shelter_id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  city: string | null;
  address: string | null;
  poster_url: string | null;
  capacity: number | null;
  lat: number;
  lng: number;
  shelter_name: string;
  shelter_slug: string;
  animal_count: number;
  attendee_count: number;
  distance_m: number | null;
};
