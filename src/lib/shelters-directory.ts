import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShelterDirectoryEntry } from "@/components/shelters/ShelterDirectory";

interface FilaDirectorio {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cover_url: string | null;
  city: string | null;
  province: string | null;
  description: string | null;
  disponibles: { count: number }[] | null;
  adopciones: { count: number }[] | null;
}

/**
 * Protectoras verificadas para el directorio público, ordenadas por nombre,
 * con dos conteos por embeds con alias: animales disponibles publicados y
 * adopciones completadas. La RLS ya limita a `verified` con el cliente anon;
 * el filtro explícito documenta la intención.
 */
export async function cargarProtectorasDirectorio(
  supabase: SupabaseClient,
): Promise<ShelterDirectoryEntry[]> {
  const { data, error } = await supabase
    .from("shelters")
    .select(
      "id, name, slug, logo_url, cover_url, city, province, description, " +
        "disponibles:animals(count), adopciones:animals(count)",
    )
    .eq("status", "verified")
    .eq("disponibles.status", "available")
    .not("disponibles.published_at", "is", null)
    .eq("adopciones.status", "adopted")
    .order("name", { ascending: true });

  if (error || !data) return [];

  return (data as unknown as FilaDirectorio[]).map(({ disponibles, adopciones, ...shelter }) => ({
    ...shelter,
    available_count: disponibles?.[0]?.count ?? 0,
    adopted_count: adopciones?.[0]?.count ?? 0,
  }));
}
