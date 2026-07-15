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

export type Sexo = "male" | "female" | "unknown";
export type Tamano = "small" | "medium" | "large";
export type Especie = "dog" | "cat" | "other";

/** Datos identificativos (FEATURE-023). `null` = «no lo sé». */
export type DatosIdentificativos = {
  breed: string | null;
  sex: Sexo | null;
  size: Tamano | null;
  color: string | null;
  has_collar: boolean | null;
  collar_description: string | null;
  has_microchip: boolean | null;
  /** Cuándo se perdió o se encontró — no cuándo se publicó. */
  occurred_on: string;
};

export type AvisoMapa = DatosIdentificativos & {
  id: string;
  type: "lost" | "found";
  species: Especie;
  name: string | null;
  description: string;
  photo_url: string | null;
  city: string | null;
  status: "open" | "resolved" | "archived";
  lat: number;
  lng: number;
  created_at: string;
};
