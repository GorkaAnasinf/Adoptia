import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AgendaCliente } from "@/components/citas/AgendaCliente";
import type { CitaAgenda, FranjaDia, FranjaSemanal, OverrideDia, Plantilla } from "@/lib/agenda";
import { createAdminClient } from "@/lib/supabase/admin";
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
  let plantillas: Plantilla[] = [];
  let citasDetalle: CitaAgenda[] = [];
  let capacidad = 0;
  let proximaISO: string | null = null;

  if (shelter) {
    const [{ data: fr }, { data: ov }, { data: ci }, { data: pl }, { data: hu }] = await Promise.all([
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
        .select("id, status, starts_at, adopter_id, adoption_requests(animals(name, slug))")
        .eq("shelter_id", shelter.id)
        .in("status", ["pending", "confirmed", "done", "no_show"])
        .gte("starts_at", `${desde}T00:00:00Z`)
        .lte("starts_at", `${hasta}T23:59:59Z`)
        .order("starts_at", { ascending: true }),
      supabase
        .from("availability_templates")
        .select("id, nombre, slots")
        .eq("shelter_id", shelter.id)
        .order("nombre"),
      supabase.rpc("appointment_free_slots", { p_shelter_id: shelter.id, p_days: 30 }),
    ]);

    franjas = (fr as FranjaSemanal[] | null) ?? [];
    overrides = ((ov as { date: string; closed: boolean; slots: FranjaDia[]; note: string | null }[] | null) ?? []).map(
      (o) => ({ date: o.date, closed: o.closed, slots: o.slots ?? [], note: o.note }),
    );
    plantillas = ((pl as { id: string; nombre: string; slots: FranjaDia[] }[] | null) ?? []).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      slots: p.slots ?? [],
    }));

    const huecos = (hu as { starts_at: string }[] | null) ?? [];
    capacidad = huecos.length;
    proximaISO = huecos[0]?.starts_at ?? null;

    // Citas con detalle para la vista diaria. El nombre del adoptante vive en
    // profiles (RLS: solo su dueño); mismo bypass acotado que en la bandeja de
    // citas — nunca se expone el contacto.
    type CitaRow = {
      id: string;
      status: string;
      starts_at: string;
      adopter_id: string;
      adoption_requests: { animals: { name: string; slug: string } | null } | null;
    };
    const filas = (ci as unknown as CitaRow[] | null) ?? [];
    const ids = [...new Set(filas.map((c) => c.adopter_id))];
    const admin = createAdminClient();
    const { data: perfiles } = ids.length
      ? await admin.from("profiles").select("id, full_name").in("id", ids)
      : { data: [] };
    const nombres = new Map(
      ((perfiles as { id: string; full_name: string | null }[] | null) ?? []).map((p) => [p.id, p.full_name]),
    );

    citasDetalle = filas.map((c) => ({
      id: c.id,
      starts_at: c.starts_at,
      status: c.status,
      animalName: c.adoption_requests?.animals?.name ?? null,
      animalSlug: c.adoption_requests?.animals?.slug ?? null,
      adopterName: nombres.get(c.adopter_id) ?? null,
    }));
    citasPorDia = [...new Set(citasDetalle.map((c) => YMD.format(new Date(c.starts_at))))];
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
            plantillas={plantillas}
            citasDetalle={citasDetalle}
            capacidad={capacidad}
            proximaISO={proximaISO}
            hoyISO={hoyISO}
            anioInicial={anio}
            mesInicial={mes - 1}
          />
        )}
      </div>
    </section>
  );
}
