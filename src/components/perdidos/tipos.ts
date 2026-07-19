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

/** Fila del RPC `lost_found_media_list`: una foto de la galería (FEATURE-024). */
export type FotoAviso = {
  id: string;
  url: string;
  is_cover: boolean;
  sort_order: number;
};

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

/**
 * Color por tipo de aviso, compartido por badge y marcador del mapa
 * (FEATURE-038): granate = perdido, teal = encontrado — roles del design
 * system en lugar del rojo/verde genérico de FEATURE-012.
 */
export const COLOR_AVISO: Record<AvisoMapa["type"], string> = {
  lost: "#9f402d",
  found: "#396662",
};

export type AvisoMapa = DatosIdentificativos & {
  id: string;
  type: "lost" | "found";
  species: Especie;
  name: string | null;
  description: string;
  /** Portada del aviso (FEATURE-024): la foto `is_cover` de `lost_found_media`. */
  cover_url: string | null;
  city: string | null;
  status: "open" | "resolved" | "archived";
  lat: number;
  lng: number;
  created_at: string;
};
