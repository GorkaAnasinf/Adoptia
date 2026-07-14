import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AnimalForm } from "@/components/animals/AnimalForm";
import type { Media } from "@/components/animals/AnimalMediaUploader";
import type { AnimalStatus } from "@/lib/schemas/animal";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("animales");
  return { title: t("formEditTitle") };
}

type MediaRow = { id: string; type: string; url: string; is_cover: boolean; sort_order: number };
type AnimalRow = {
  id: string;
  shelter_id: string;
  name: string;
  species: string | null;
  breed: string | null;
  sex: string;
  size: string | null;
  birth_date_approx: string | null;
  weight_kg: number | null;
  status: AnimalStatus;
  description: string | null;
  good_with_kids: boolean | null;
  good_with_dogs: boolean | null;
  good_with_cats: boolean | null;
  apartment_suitable: boolean | null;
  energy_level: string | null;
  special_needs: string | null;
  vaccinated: boolean;
  sterilized: boolean;
  microchipped: boolean;
  health_notes: string | null;
  adoption_fee: number | null;
  animal_media: MediaRow[];
};

export default async function EditarFichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: shelter } = user
    ? await supabase.from("shelters").select("id, status").eq("owner_id", user.id).maybeSingle()
    : { data: null };
  if (!shelter) notFound();

  const { data: animal } = await supabase
    .from("animals")
    .select(
      "id,shelter_id,name,species,breed,sex,size,birth_date_approx,weight_kg,status,description,good_with_kids,good_with_dogs,good_with_cats,apartment_suitable,energy_level,special_needs,vaccinated,sterilized,microchipped,health_notes,adoption_fee,animal_media(id,type,url,is_cover,sort_order)",
    )
    .eq("id", id)
    .eq("shelter_id", shelter.id)
    .maybeSingle();

  if (!animal) notFound();
  const a = animal as AnimalRow;

  // Fotos y vídeos MP4 se gestionan juntos en el uploader; YouTube va aparte.
  const fotos: Media[] = a.animal_media
    .filter((m) => m.type === "photo" || m.type === "video")
    .sort((x, y) => x.sort_order - y.sort_order)
    .map((m) => ({
      id: m.id,
      url: m.url,
      is_cover: m.is_cover,
      sort_order: m.sort_order,
      type: m.type === "video" ? "video" : "photo",
    }));
  const youtubeRow = a.animal_media.find((m) => {
    return m.type === "youtube";
  });
  const youtube = youtubeRow?.url ?? "";

  return (
    <AnimalForm
      shelterId={shelter.id}
      animalId={a.id}
      initialMedia={fotos}
      initialYoutube={youtube}
      shelterVerified={shelter.status === "verified"}
      initial={{
        name: a.name,
        species: (a.species as "dog" | "cat" | "other" | null) ?? undefined,
        breed: a.breed ?? undefined,
        sex: a.sex as "male" | "female" | "unknown",
        size: (a.size as "small" | "medium" | "large" | null) ?? null,
        birthDateApprox: a.birth_date_approx ?? undefined,
        weightKg: a.weight_kg ?? null,
        status: a.status,
        description: a.description ?? undefined,
        goodWithKids: a.good_with_kids,
        goodWithDogs: a.good_with_dogs,
        goodWithCats: a.good_with_cats,
        apartmentSuitable: a.apartment_suitable,
        energyLevel: (a.energy_level as "low" | "medium" | "high" | null) ?? null,
        specialNeeds: a.special_needs ?? undefined,
        vaccinated: a.vaccinated,
        sterilized: a.sterilized,
        microchipped: a.microchipped,
        healthNotes: a.health_notes ?? undefined,
        adoptionFee: a.adoption_fee ?? null,
      }}
    />
  );
}
