import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  type PublicAnimal,
  type PublicShelter,
  ShelterPublicProfile,
} from "@/components/shelters/ShelterPublicProfile";
import { createClient } from "@/lib/supabase/server";

const CAMPOS =
  "name, slug, description, city, province, website, social_links, opening_hours, accepts_volunteers, accepts_fostering, status";

async function cargarProtectora(slug: string) {
  const supabase = await createClient();
  const { data: shelter } = await supabase
    .from("shelters")
    .select(`id, logo_url, ${CAMPOS}`)
    .eq("slug", slug)
    .maybeSingle();
  if (!shelter) return null;

  const { data: animals } = await supabase
    .from("animals")
    .select("id,name,slug,status,animal_media(url,is_cover,sort_order)")
    .eq("shelter_id", (shelter as { id: string }).id)
    .not("published_at", "is", null)
    .eq("status", "available")
    .order("updated_at", { ascending: false });

  return { shelter: shelter as PublicShelter & { id: string }, animals: (animals as PublicAnimal[]) ?? [] };
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

  return <ShelterPublicProfile shelter={data.shelter} animals={data.animals} />;
}
