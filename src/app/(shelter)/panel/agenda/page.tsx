import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { DisponibilidadEditor, type Franja } from "@/components/citas/DisponibilidadEditor";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("citas");
  return { title: t("disponibilidadTitle") };
}

/** Editor de la agenda semanal de disponibilidad de la protectora. */
export default async function AgendaPage() {
  const t = await getTranslations("citas");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: shelter } = user
    ? await supabase.from("shelters").select("id").eq("owner_id", user.id).maybeSingle()
    : { data: null };

  let franjas: Franja[] = [];
  if (shelter) {
    const { data } = await supabase
      .from("availability_slots")
      .select("id, weekday, start_time, end_time, slot_minutes, active")
      .eq("shelter_id", shelter.id)
      .order("weekday")
      .order("start_time");
    franjas = (data as Franja[] | null) ?? [];
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold">{t("disponibilidadTitle")}</h1>
      <p className="mt-1 text-muted-foreground">{t("disponibilidadSubtitle")}</p>
      <div className="mt-8">
        {shelter && <DisponibilidadEditor shelterId={shelter.id} franjas={franjas} />}
      </div>
    </section>
  );
}
