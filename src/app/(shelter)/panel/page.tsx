import { ArrowRight, CalendarDays, CheckCircle2, ChevronRight, Clock, Heart, ImagePlus, PawPrint, Plus, Sprout } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AnimalStatusBadge } from "@/components/animals/AnimalStatusBadge";
import type { AnimalStatus } from "@/lib/schemas/animal";
import type { EstadoSolicitud } from "@/lib/schemas/solicitud";
import { edadAproximada } from "@/lib/animal-search";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("panel");
  return { title: t("title") };
}

type MediaRow = { url: string; is_cover: boolean; sort_order: number };
type AnimalRow = {
  id: string;
  name: string;
  slug: string;
  status: AnimalStatus;
  breed: string | null;
  birth_date_approx: string | null;
  published_at: string | null;
  updated_at: string;
  animal_media: MediaRow[];
};
type RequestRow = {
  id: string;
  created_at: string;
  status: EstadoSolicitud;
  adopter_id: string;
  animal: { name: string; slug: string } | null;
};
type CitaRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  adopter_id: string;
  adoption_requests: { animals: { name: string; breed: string | null } | null } | null;
};

const HORA_MADRID = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Madrid",
});
const DIA_MADRID = new Intl.DateTimeFormat("es-ES", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Europe/Madrid",
});
const MES_CORTO_MADRID = new Intl.DateTimeFormat("es-ES", { month: "short", timeZone: "Europe/Madrid" });
const DIA_NUM_MADRID = new Intl.DateTimeFormat("es-ES", { day: "numeric", timeZone: "Europe/Madrid" });

const FECHA_CORTA_MADRID = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Madrid",
});

const CHIP_SOLICITUD: Record<EstadoSolicitud, string> = {
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-tertiary/10 text-tertiary",
  rejected: "bg-destructive/10 text-destructive",
  withdrawn: "bg-muted text-muted-foreground",
  completed: "bg-primary/10 text-primary",
};

function capitaliza(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function portada(media: MediaRow[]): string | null {
  if (media.length === 0) return null;
  return (media.find((m) => m.is_cover) ?? [...media].sort((a, b) => a.sort_order - b.sort_order)[0]).url;
}

export default async function PanelPage() {
  const t = await getTranslations("panel");
  const to = await getTranslations("onboarding");
  const tc = await getTranslations("citas");
  const ts = await getTranslations("solicitudesPanel");
  const tb = await getTranslations("busqueda");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: shelter } = user
    ? await supabase
        .from("shelters")
        .select("id, name, status, verification_note, description")
        .eq("owner_id", user.id)
        .maybeSingle()
    : { data: null };

  let animals: AnimalRow[] = [];
  let pendingCount = 0;
  let solicitudes7 = 0;
  let solicitudesPrev7 = 0;
  let recentRequests: (RequestRow & { adopterName: string | null })[] = [];
  let proximasCitas: (CitaRow & { adopterName: string | null })[] = [];

  if (shelter) {
    const { data: a } = await supabase
      .from("animals")
      .select("id,name,slug,status,breed,birth_date_approx,published_at,updated_at,animal_media(url,is_cover,sort_order)")
      .eq("shelter_id", shelter.id)
      .order("updated_at", { ascending: false });
    animals = (a as AnimalRow[] | null) ?? [];

    const { count } = await supabase
      .from("adoption_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    pendingCount = count ?? 0;

    // Delta semanal: solicitudes recibidas en los últimos 7 días vs los 7 anteriores
    const hace7 = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const hace14 = new Date(Date.now() - 14 * 86_400_000).toISOString();
    const { count: c7 } = await supabase
      .from("adoption_requests")
      .select("id", { count: "exact", head: true })
      .gte("created_at", hace7);
    solicitudes7 = c7 ?? 0;
    const { count: cPrev } = await supabase
      .from("adoption_requests")
      .select("id", { count: "exact", head: true })
      .gte("created_at", hace14)
      .lt("created_at", hace7);
    solicitudesPrev7 = cPrev ?? 0;

    const { data: r } = await supabase
      .from("adoption_requests")
      .select("id,created_at,status,adopter_id,animal:animals(name,slug)")
      .order("created_at", { ascending: false })
      .limit(5);
    recentRequests = ((r as RequestRow[] | null) ?? []) as (RequestRow & { adopterName: string | null })[];

    const { data: citas } = await supabase
      .from("appointments")
      .select("id, starts_at, ends_at, adopter_id, adoption_requests(animals(name, breed))")
      .eq("shelter_id", shelter.id)
      .in("status", ["pending", "confirmed"])
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(20);
    const filas = (citas as unknown as CitaRow[] | null) ?? [];

    // El nombre del adoptante vive en profiles (RLS: solo su dueño); mismo
    // bypass acotado que en la agenda de citas.
    const ids = [
      ...new Set([...filas.map((c) => c.adopter_id), ...recentRequests.map((r) => r.adopter_id)]),
    ];
    const { data: perfiles } = ids.length
      ? await createAdminClient().from("profiles").select("id, full_name").in("id", ids)
      : { data: [] };
    const nombres = new Map(
      ((perfiles as { id: string; full_name: string | null }[] | null) ?? []).map((p) => [p.id, p.full_name]),
    );
    proximasCitas = filas.map((c) => ({ ...c, adopterName: nombres.get(c.adopter_id) ?? null }));
    recentRequests = recentRequests.map((r) => ({ ...r, adopterName: nombres.get(r.adopter_id) ?? null }));
  }

  const hoy = DIA_MADRID.format(new Date());
  const citasHoy = proximasCitas.filter((c) => DIA_MADRID.format(new Date(c.starts_at)) === hoy);

  const activos = animals.filter(
    (x) => x.published_at != null && (x.status === "available" || x.status === "reserved"),
  );
  const avatares = activos.slice(0, 4);
  const restantes = activos.length - avatares.length;

  // Delta semanal en % (solo con histórico previo; con 0 no hay porcentaje que dar)
  let deltaSemanal: string | null = null;
  if (solicitudesPrev7 > 0) {
    const pct = Math.round(((solicitudes7 - solicitudesPrev7) / solicitudesPrev7) * 100);
    if (pct > 0) deltaSemanal = t("statDeltaUp", { pct });
    else if (pct < 0) deltaSemanal = t("statDeltaDown", { pct: Math.abs(pct) });
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      {shelter?.status === "pending" && (
        <div
          role="status"
          className="mb-6 flex flex-col gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{to("bannerPending")}</span>
          <Link
            href="/panel/alta"
            className="shrink-0 font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-950"
          >
            {to("bannerPendingEdit")}
          </Link>
        </div>
      )}
      {shelter?.status === "suspended" && (
        <p
          role="alert"
          className="mb-6 rounded-xl border-2 border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {to("bannerSuspended", { motivo: shelter.verification_note ?? "—" })}
        </p>
      )}

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-primary">
            {shelter?.name ? t("greeting", { name: shelter.name }) : t("title")}
          </h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link
          href="/panel/animales/nueva"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("addAnimal")}
        </Link>
      </header>

      {animals.length === 0 ? (
        <PrimerosPasos perfilListo={Boolean(shelter?.description)} t={t} />
      ) : (
        <>
          {/* Tarjetas de métricas */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Solicitudes pendientes — coral */}
            <Link
              href="/panel/solicitudes"
              className="group relative overflow-hidden rounded-2xl bg-primary-container p-5 text-white shadow-sm transition-shadow hover:shadow-md"
            >
              <Heart
                className="absolute -right-3 -top-3 size-24 rotate-12 text-white/20"
                aria-hidden="true"
                fill="currentColor"
              />
              <span className="block text-xs font-bold uppercase tracking-wider text-white/90">
                {t("statPending")}
              </span>
              <span className="mt-2 block font-heading text-5xl font-bold tabular-nums">{pendingCount}</span>
              {deltaSemanal && <span className="mt-2 block text-sm text-white/90">{deltaSemanal}</span>}
            </Link>

            {/* Citas hoy — teal */}
            <Link
              href="/panel/citas"
              className="group relative overflow-hidden rounded-2xl bg-secondary p-5 text-secondary-foreground shadow-sm transition-shadow hover:shadow-md"
            >
              <CalendarDays className="absolute -right-3 -top-3 size-24 rotate-12 text-white/10" aria-hidden="true" />
              <span className="block text-xs font-bold uppercase tracking-wider text-white/90">
                {t("statCitasHoy")}
              </span>
              <span className="mt-2 block font-heading text-5xl font-bold tabular-nums">{citasHoy.length}</span>
              <span className="mt-2 block text-sm text-white/90">
                {citasHoy.length > 0
                  ? t("statCitasProxima", { hora: HORA_MADRID.format(new Date(citasHoy[0].starts_at)) })
                  : t("statCitasNinguna")}
              </span>
            </Link>

            {/* Perfiles activos — crema */}
            <Link
              href="/panel/animales"
              className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:col-span-2 lg:col-span-1"
            >
              <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("statActiveProfiles")}
              </span>
              <span className="mt-2 block font-heading text-5xl font-bold tabular-nums text-primary">
                {activos.length}
              </span>
              <span className="mt-2 flex items-center -space-x-2">
                {avatares.map((a) => (
                  <AvatarAnimal key={a.id} url={portada(a.animal_media)} alt={a.name} />
                ))}
                {restantes > 0 && (
                  <span className="z-10 flex size-8 items-center justify-center rounded-full border-2 border-card bg-accent text-xs font-semibold text-accent-foreground">
                    +{restantes}
                  </span>
                )}
              </span>
            </Link>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
            {/* Columna principal: próximas citas + animales */}
            <div className="flex flex-col gap-6">
              {/* Próximas Citas */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-heading text-lg font-semibold">{tc("dashboardTitle")}</h2>
                  <Link href="/panel/citas" className="text-sm font-semibold text-tertiary hover:underline">
                    {t("viewCalendar")}
                  </Link>
                </div>
                {proximasCitas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{tc("dashboardEmpty")}</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {proximasCitas.slice(0, 4).map((c) => {
                      const fecha = new Date(c.starts_at);
                      const animal = c.adoption_requests?.animals;
                      return (
                        <li key={c.id}>
                          <Link
                            href="/panel/citas"
                            className="flex items-center gap-4 rounded-xl border border-border bg-background/60 p-3 transition-colors hover:bg-accent/40"
                          >
                            <span className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-accent py-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                                {MES_CORTO_MADRID.format(fecha).replace(".", "")}
                              </span>
                              <span className="font-heading text-lg font-bold leading-tight">
                                {DIA_NUM_MADRID.format(fecha)}
                              </span>
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-semibold">
                                {`${c.adopterName ?? "—"} - ${animal?.name ?? "—"}${animal?.breed ? ` (${animal.breed})` : ""}`}
                              </span>
                              <span className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="size-3.5" aria-hidden="true" />
                                {`${HORA_MADRID.format(fecha)} - ${HORA_MADRID.format(new Date(c.ends_at))}`}
                              </span>
                            </span>
                            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Tus animales — rejilla de tarjetas */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-heading text-lg font-semibold">{t("recentAnimals")}</h2>
                  <Link href="/panel/animales" className="text-sm font-semibold text-tertiary hover:underline">
                    {t("viewAll")}
                  </Link>
                </div>
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {animals.slice(0, 5).map((a) => {
                    const edad = edadAproximada(a.birth_date_approx);
                    const subtitulo = [
                      a.breed,
                      edad ? tb(edad.unidad === "anios" ? "edadAnios" : "edadMeses", { n: edad.n }) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ");
                    return (
                      <li key={a.id}>
                        <Link
                          href={`/panel/animales/${a.id}`}
                          className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <span className="relative block aspect-square bg-muted">
                            {/* Nombre visible junto a la foto: la imagen es decorativa para lectores de pantalla */}
                            <FotoAnimal url={portada(a.animal_media)} alt="" />
                            <span className="absolute left-2 top-2">
                              <AnimalStatusBadge status={a.status} />
                            </span>
                          </span>
                          <span className="flex flex-col gap-0.5 p-3">
                            <span className="truncate font-heading font-semibold text-primary">{a.name}</span>
                            {subtitulo && (
                              <span className="truncate text-sm text-muted-foreground">{subtitulo}</span>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                  <li>
                    <Link
                      href="/panel/animales/nueva"
                      className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <ImagePlus className="size-6" aria-hidden="true" />
                      {t("addAnimalCard")}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Lateral: solicitudes recientes */}
            <div className="h-fit rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold">{t("recentRequests")}</h2>
                {recentRequests.length > 0 && (
                  <Link href="/panel/solicitudes" className="text-sm font-semibold text-tertiary hover:underline">
                    {t("viewAll")}
                  </Link>
                )}
              </div>
              {recentRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noRequests")}</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {recentRequests.map((r) => (
                    <li key={r.id}>
                      <Link
                        href="/panel/solicitudes"
                        className="flex items-center justify-between gap-2 py-2.5 hover:opacity-80"
                      >
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-semibold">{r.animal?.name ?? "—"}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {`${r.adopterName ?? "—"} · ${FECHA_CORTA_MADRID.format(new Date(r.created_at))}`}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${CHIP_SOLICITUD[r.status]}`}
                        >
                          {ts(`status${capitaliza(r.status)}`)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function AvatarAnimal({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <span className="flex size-8 items-center justify-center rounded-full border-2 border-card bg-muted text-muted-foreground">
        <PawPrint className="size-4" aria-hidden="true" />
      </span>
    );
  }
  return (
    <Image
      src={url}
      alt={alt}
      width={32}
      height={32}
      className="size-8 rounded-full border-2 border-card object-cover"
    />
  );
}

function FotoAnimal({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <span className="flex size-full items-center justify-center text-muted-foreground">
        <PawPrint className="size-8" aria-hidden="true" />
      </span>
    );
  }
  return <Image src={url} alt={alt} fill sizes="(max-width: 640px) 50vw, 12rem" className="object-cover" />;
}

function PrimerosPasos({
  perfilListo,
  t,
}: {
  perfilListo: boolean;
  t: Awaited<ReturnType<typeof getTranslations<"panel">>>;
}) {
  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sprout className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-heading text-xl font-semibold">{t("firstStepsTitle")}</h2>
        <p className="mt-2 max-w-md text-muted-foreground">{t("firstStepsText")}</p>
      </div>
      <ol className="mx-auto mt-6 flex max-w-md flex-col gap-3">
        <PasoLink
          hecho={perfilListo}
          href="/panel/perfil"
          label={perfilListo ? t("stepProfileDone") : t("stepProfile")}
        />
        <PasoLink hecho={false} href="/panel/animales/nueva" label={t("stepAnimal")} />
      </ol>
    </div>
  );
}

function PasoLink({ hecho, href, label }: { hecho: boolean; href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-xl border p-3 text-sm font-medium transition-colors",
          hecho
            ? "border-tertiary/40 bg-tertiary/5 text-muted-foreground"
            : "border-border hover:border-primary/40 hover:bg-accent/30",
        )}
      >
        {hecho ? (
          <CheckCircle2 className="size-5 shrink-0 text-tertiary" aria-hidden="true" />
        ) : (
          <span className="size-5 shrink-0 rounded-full border-2 border-muted-foreground/40" />
        )}
        <span className="flex-1">{label}</span>
        {!hecho && <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />}
      </Link>
    </li>
  );
}
