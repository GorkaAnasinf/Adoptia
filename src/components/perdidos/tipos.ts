/** Fila del RPC `lost_found_sightings_list`: sin `user_id` (minimización). */
export type Avistamiento = {
  id: string;
  seen_at: string;
  note: string | null;
  photo_url: string | null;
  lat: number;
  lng: number;
  created_at: string;
};

export type AvisoMapa = {
  id: string;
  type: "lost" | "found";
  species: "dog" | "cat" | "other";
  name: string | null;
  description: string;
  photo_url: string | null;
  city: string | null;
  status: "open" | "resolved" | "archived";
  lat: number;
  lng: number;
  created_at: string;
};
