import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CalendarioCitas } from "@/components/citas/CalendarioCitas";
import { CitasCliente, type CitaVista } from "@/components/citas/CitasCliente";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("citas");
  return { title: t("agendaTitle") };
}

type MediaRow = { url: string; is_cover: boolean; sort_order: number };
type Cita = {
  id: string;
  status: CitaVista["status"];
  starts_at: string;
  cancel_reason: string | null;
  adopter_id: string;
  adoption_requests: {
    animals: { name: string; slug: string; animal_media: MediaRow[] | null } | null;
  } | null;
};

function portada(media: MediaRow[] | null): string | null {
  if (!media || media.length === 0) return null;
  return (media.find((m) => m.is_cover) ?? [...media].sort((a, b) => a.sort_order - b.sort_order)[0]).url;
}

const YMD = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Europe/Madrid",
});
const ymd = (d: Date) => YMD.format(d);

/** Agenda de citas de la protectora: pestañas Próximas/Pasadas + calendario y resumen. */
export default async function CitasPanelPage() {
  const t = await getTranslations("citas");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: shelter } = user
    ? await supabase.from("shelters").select("id").eq("owner_id", user.id).maybeSingle()
    : { data: null };

  let citas: (Cita & { adopterName: string | null })[] = [];
  let nuevasSolicitudes = 0;
  if (shelter) {
    const { data } = await supabase
      .from("appointments")
      .select(
        "id, status, starts_at, cancel_reason, adopter_id, adoption_requests(animals(name, slug, animal_media(url, is_cover, sort_order)))",
      )
      .eq("shelter_id", shelter.id)
      .order("starts_at", { ascending: true });
    const filas = (data as unknown as Cita[] | null) ?? [];

    // El nombre del adoptante vive en profiles (RLS: solo su dueño); mismo bypass
    // acotado que en la bandeja de solicitudes.
    const admin = createAdminClient();
    const ids = [...new Set(filas.map((c) => c.adopter_id))];
    const { data: perfiles } = ids.length
      ? await admin.from("profiles").select("id, full_name").in("id", ids)
      : { data: [] };
    const nombres = new Map(
      ((perfiles as { id: string; full_name: string | null }[] | null) ?? []).map((p) => [p.id, p.full_name]),
    );
    citas = filas.map((c) => ({ ...c, adopterName: nombres.get(c.adopter_id) ?? null }));

    const { count } = await supabase
      .from("adoption_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    nuevasSolicitudes = count ?? 0;
  }

  const ahora = new Date();
  const [aa, mm, dd] = ymd(ahora).split("-").map(Number);

  // Semana ISO (Lun-Dom) que contiene hoy, por fechas de calendario (Europe/Madrid).
  const hoyProxy = new Date(`${ymd(ahora)}T00:00:00Z`);
  const offLun = (hoyProxy.getUTCDay() + 6) % 7;
  const semana = new Set(
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(hoyProxy);
      d.setUTCDate(d.getUTCDate() - offLun + i);
      return d.toISOString().slice(0, 10);
    }),
  );

  const activa = (c: Cita) => c.status === "pending" || c.status === "confirmed";
  const enFuturo = (c: Cita) => new Date(c.starts_at).getTime() >= ahora.getTime();
  const proximas = citas.filter((c) => activa(c) && enFuturo(c));
  const pasadas = citas.filter((c) => !(activa(c) && enFuturo(c))).reverse();

  const citasEstaSemana = citas.filter((c) => activa(c) && semana.has(ymd(new Date(c.starts_at)))).length;
  const done = citas.filter((c) => c.status === "done").length;
  const noShow = citas.filter((c) => c.status === "no_show").length;
  const tasaAsistencia = done + noShow > 0 ? Math.round((done / (done + noShow)) * 100) : null;

  const diasConCitas = [
    ...new Set(
      citas
        .map((c) => ymd(new Date(c.starts_at)))
        .filter((s) => Number(s.slice(0, 4)) === aa && Number(s.slice(5, 7)) === mm)
        .map((s) => Number(s.slice(8, 10))),
    ),
  ];

  const aVista = (c: (typeof citas)[number]): CitaVista => ({
    id: c.id,
    status: c.status,
    starts_at: c.starts_at,
    cancel_reason: c.cancel_reason,
    adopterName: c.adopterName,
    animal: c.adoption_requests?.animals
      ? {
          name: c.adoption_requests.animals.name,
          slug: c.adoption_requests.animals.slug,
          cover: portada(c.adoption_requests.animals.animal_media),
        }
      : null,
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold">{t("agendaTitle")}</h1>
          <p className="mt-1 text-muted-foreground">{t("agendaSubtitle")}</p>
        </div>
        <Link
          href="/panel/agenda"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          {t("disponibilidadTitle")}
        </Link>
      </header>

      {citas.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card px-6 py-14 text-center text-muted-foreground shadow-soft">
          {t("agendaEmpty")}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
          <CitasCliente proximas={proximas.map(aVista)} pasadas={pasadas.map(aVista)} />
          <aside className="flex flex-col gap-6">
            <CalendarioCitas year={aa} month={mm - 1} todayDay={dd} diasConCitas={diasConCitas} />
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h2 className="font-heading text-lg font-semibold">{t("resumenTitle")}</h2>
              <dl className="mt-3 flex flex-col gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{t("resumenSemana")}</dt>
                  <dd className="font-heading text-lg font-bold tabular-nums">{citasEstaSemana}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{t("resumenSolicitudes")}</dt>
                  <dd className="font-heading text-lg font-bold tabular-nums">{nuevasSolicitudes}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{t("resumenAsistencia")}</dt>
                  <dd className="font-heading text-lg font-bold tabular-nums text-tertiary">
                    {tasaAsistencia === null ? "—" : `${tasaAsistencia}%`}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="rounded-2xl border border-border bg-surface-container-low p-5 shadow-soft">
              <p className="text-sm italic text-muted-foreground">{t("consejoTexto")}</p>
              <Link
                href="/guias"
                className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-tertiary px-4 py-2 text-sm font-semibold text-on-tertiary transition-colors hover:bg-tertiary/90"
              >
                {t("verRecursos")}
              </Link>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
