import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { type AnimalOpcion, JornadaForm, type JornadaExistente } from "@/components/jornadas/JornadaForm";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("jornadas");
  return { title: t("editarTitulo") };
}

export default async function EditarJornadaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: shelter } = user
    ? await supabase.from("shelters").select("id, status").eq("owner_id", user.id).maybeSingle()
    : { data: null };

  if (!user || !shelter || shelter.status !== "verified") notFound();

  const { data: detalle } = await supabase.rpc("event_detail", { p_id: id });
  const evento = ((detalle as Record<string, unknown>[] | null) ?? [])[0];
  // Solo la dueña edita su jornada.
  if (!evento || evento.shelter_id !== shelter.id) notFound();

  const { data: vinculos } = await supabase
    .from("event_animals")
    .select("animal_id")
    .eq("event_id", id);
  const animalIds = ((vinculos as { animal_id: string }[] | null) ?? []).map((v) => v.animal_id);

  const { data: animales } = await supabase
    .from("animals")
    .select("id, name")
    .eq("shelter_id", shelter.id)
    .order("name");

  const existente: JornadaExistente = {
    id: evento.id as string,
    title: evento.title as string,
    description: (evento.description as string) ?? "",
    starts_at: evento.starts_at as string,
    ends_at: evento.ends_at as string,
    address: (evento.address as string | null) ?? null,
    city: (evento.city as string | null) ?? null,
    lat: evento.lat != null ? Number(evento.lat) : null,
    lng: evento.lng != null ? Number(evento.lng) : null,
    capacity: evento.capacity != null ? Number(evento.capacity) : null,
    poster_url: (evento.poster_url as string | null) ?? null,
    status: evento.status as JornadaExistente["status"],
    animal_ids: animalIds,
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <JornadaForm
        userId={user.id}
        shelterId={shelter.id as string}
        animales={(animales as AnimalOpcion[] | null) ?? []}
        existente={existente}
      />
    </section>
  );
}
