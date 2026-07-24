import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  type PublicAnimal,
  type PublicNeed,
  type PublicShelter,
  ShelterPublicProfile,
  type ShelterStats,
} from "@/components/shelters/ShelterPublicProfile";
import { createClient } from "@/lib/supabase/server";

const CAMPOS =
  "name, slug, description, city, province, website, social_links, accepts_volunteers, accepts_fostering, status, donation_link, email, cover_url, founded_year, address, location";

async function cargarProtectora(slug: string) {
  const supabase = await createClient();
  const { data: shelter } = await supabase
    .from("shelters")
    .select(`id, logo_url, ${CAMPOS}`)
    .eq("slug", slug)
    .maybeSingle();
  if (!shelter) return null;

  const shelterId = (shelter as { id: string }).id;
  const [{ data: animals }, { data: photos }, { data: stats }, { data: needs }] = await Promise.all([
    supabase
      .from("animals")
      .select(
        "id,name,slug,status,sponsorable,species,sex,size,breed,birth_date_approx,published_at,animal_media(url,is_cover,sort_order)",
      )
      .eq("shelter_id", shelterId)
      .not("published_at", "is", null)
      .eq("status", "available")
      .order("updated_at", { ascending: false }),
    supabase
      .from("shelter_media")
      .select("id,url,sort_order")
      .eq("shelter_id", shelterId)
      .eq("type", "photo")
      .order("sort_order", { ascending: true }),
    // Métricas agregadas (FEATURE-028): security definer, solo verificadas.
    supabase.rpc("shelter_public_stats", { p_shelter_id: shelterId }),
    // Necesidades abiertas (FEATURE-031): la RLS ya limita a abiertas de verificadas.
    supabase
      .from("shelter_needs")
      .select("id, categoria, descripcion, urgencia")
      .eq("shelter_id", shelterId)
      .order("urgencia", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  return {
    shelter: shelter as PublicShelter & { id: string },
    animals: (animals as PublicAnimal[]) ?? [],
    photos: (photos as { id: string; url: string }[]) ?? [],
    stats: ((stats as ShelterStats[] | null)?.[0] as ShelterStats | undefined) ?? null,
    needs: (needs as PublicNeed[]) ?? [],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await cargarProtectora(slug);
  return { title: data?.shelter.name ?? "Protectora" };
}

export default async function ProtectoraPublicaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await cargarProtectora(slug);
  if (!data) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <ShelterPublicProfile
      shelter={data.shelter}
      animals={data.animals}
      photos={data.photos}
      stats={data.stats}
      needs={data.needs}
      autenticado={Boolean(user)}
    />
  );
}
