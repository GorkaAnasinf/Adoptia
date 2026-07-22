import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AgendaCliente } from "@/components/citas/AgendaCliente";
import type { FranjaDia, FranjaSemanal, OverrideDia } from "@/lib/agenda";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("agenda");
  return { title: t("title") };
}

const YMD = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Europe/Madrid",
});

/** Agenda de disponibilidad de la protectora: calendario mensual + editor de día. */
export default async function AgendaPage() {
  const t = await getTranslations("agenda");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: shelter } = user
    ? await supabase.from("shelters").select("id").eq("owner_id", user.id).maybeSingle()
    : { data: null };

  const hoyISO = YMD.format(new Date());
  const [anio, mes] = hoyISO.split("-").map(Number);
  const desde = `${anio}-01-01`;
  const hasta = `${anio}-12-31`;

  let franjas: FranjaSemanal[] = [];
  let overrides: OverrideDia[] = [];
  let citasPorDia: string[] = [];

  if (shelter) {
    const [{ data: fr }, { data: ov }, { data: ci }] = await Promise.all([
      supabase
        .from("availability_slots")
        .select("weekday, start_time, end_time, slot_minutes, active")
        .eq("shelter_id", shelter.id),
      supabase
        .from("availability_overrides")
        .select("date, closed, slots, note")
        .eq("shelter_id", shelter.id)
        .gte("date", desde)
        .lte("date", hasta),
      supabase
        .from("appointments")
        .select("starts_at")
        .eq("shelter_id", shelter.id)
        .in("status", ["pending", "confirmed"])
        .gte("starts_at", `${desde}T00:00:00Z`)
        .lte("starts_at", `${hasta}T23:59:59Z`),
    ]);

    franjas = (fr as FranjaSemanal[] | null) ?? [];
    overrides = ((ov as { date: string; closed: boolean; slots: FranjaDia[]; note: string | null }[] | null) ?? []).map(
      (o) => ({ date: o.date, closed: o.closed, slots: o.slots ?? [], note: o.note }),
    );
    citasPorDia = [
      ...new Set(((ci as { starts_at: string }[] | null) ?? []).map((c) => YMD.format(new Date(c.starts_at)))),
    ];
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      <div className="mt-8">
        {shelter && (
          <AgendaCliente
            shelterId={shelter.id}
            franjas={franjas}
            overrides={overrides}
            citasPorDia={citasPorDia}
            hoyISO={hoyISO}
            anioInicial={anio}
            mesInicial={mes - 1}
          />
        )}
      </div>
    </section>
  );
}
