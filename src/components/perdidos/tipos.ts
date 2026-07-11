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
