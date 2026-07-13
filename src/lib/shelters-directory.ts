import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShelterDirectoryEntry } from "@/components/shelters/ShelterDirectory";

interface FilaDirectorio {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  city: string | null;
  province: string | null;
  description: string | null;
  animals: { count: number }[] | null;
}

/**
 * Protectoras verificadas para el directorio público, ordenadas por nombre,
 * con el conteo de sus animales disponibles y publicados. La RLS ya limita
 * a `verified` con el cliente anon; el filtro explícito documenta la intención.
 */
export async function cargarProtectorasDirectorio(
  supabase: SupabaseClient,
): Promise<ShelterDirectoryEntry[]> {
  const { data, error } = await supabase
    .from("shelters")
    .select("id, name, slug, logo_url, city, province, description, animals(count)")
    .eq("status", "verified")
    .eq("animals.status", "available")
    .not("animals.published_at", "is", null)
    .order("name", { ascending: true });

  if (error || !data) return [];

  return (data as FilaDirectorio[]).map(({ animals, ...shelter }) => ({
    ...shelter,
    available_count: animals?.[0]?.count ?? 0,
  }));
}
