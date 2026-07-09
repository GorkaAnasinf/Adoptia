import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PerfilEditor } from "@/components/shelters/PerfilEditor";
import type { PublicAnimal } from "@/components/shelters/ShelterPublicProfile";
import type { OpeningHours, SocialLinks } from "@/lib/schemas/shelter";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("perfil");
  return { title: t("title") };
}

type ShelterRow = {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  city: string | null;
  province: string | null;
  website: string | null;
  social_links: SocialLinks | null;
  opening_hours: OpeningHours | null;
  accepts_volunteers: boolean;
  accepts_fostering: boolean;
  status: string | null;
};

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: shelter } = user
    ? await supabase
        .from("shelters")
        .select(
          "id, name, logo_url, description, city, province, website, social_links, opening_hours, accepts_volunteers, accepts_fostering, status",
        )
        .eq("owner_id", user.id)
        .maybeSingle()
    : { data: null };

  if (!shelter) notFound();
  const s = shelter as ShelterRow;

  const { data: animals } = await supabase
    .from("animals")
    .select("id,name,slug,status,animal_media(url,is_cover,sort_order)")
    .eq("shelter_id", s.id)
    .not("published_at", "is", null)
    .eq("status", "available")
    .order("updated_at", { ascending: false });

  return (
    <PerfilEditor
      shelterId={s.id}
      base={{ name: s.name, city: s.city, province: s.province, website: s.website, status: s.status }}
      initial={{
        logoUrl: s.logo_url ?? "",
        description: s.description ?? "",
        openingHours: s.opening_hours ?? {},
        socialLinks: s.social_links ?? {},
        acceptsVolunteers: s.accepts_volunteers,
        acceptsFostering: s.accepts_fostering,
      }}
      animals={(animals as PublicAnimal[] | null) ?? []}
    />
  );
}
