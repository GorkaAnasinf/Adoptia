import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AnimalForm } from "@/components/animals/AnimalForm";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("animales");
  return { title: t("formNewTitle") };
}

export default async function NuevaFichaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: shelter } = user
    ? await supabase.from("shelters").select("id, status").eq("owner_id", user.id).maybeSingle()
    : { data: null };

  if (!shelter) notFound();

  return (
    <AnimalForm
      shelterId={shelter.id}
      animalId={null}
      initial={{}}
      shelterVerified={shelter.status === "verified"}
    />
  );
}
