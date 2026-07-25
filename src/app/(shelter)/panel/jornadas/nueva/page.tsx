import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { type AnimalOpcion, JornadaForm } from "@/components/jornadas/JornadaForm";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("jornadas");
  return { title: t("nuevaTitulo") };
}

export default async function NuevaJornadaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: shelter } = user
    ? await supabase.from("shelters").select("id, status").eq("owner_id", user.id).maybeSingle()
    : { data: null };

  if (!user || !shelter || shelter.status !== "verified") notFound();

  const { data: animales } = await supabase
    .from("animals")
    .select("id, name")
    .eq("shelter_id", shelter.id)
    .order("name");

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <JornadaForm
        userId={user.id}
        shelterId={shelter.id as string}
        animales={(animales as AnimalOpcion[] | null) ?? []}
      />
    </section>
  );
}
