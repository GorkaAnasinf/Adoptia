import { ArrowRight, CalendarHeart, FileText, Heart, PawPrint, Plus } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { CasoDestacado, type AnimalDestacado } from "@/components/cuenta/CasoDestacado";
import { HeroCuenta } from "@/components/cuenta/HeroCuenta";
import { PanelAportacion } from "@/components/cuenta/PanelAportacion";
import { Recordatorios } from "@/components/cuenta/Recordatorios";
import { TarjetaMetrica } from "@/components/cuenta/TarjetaMetrica";
import { esImagenValida } from "@/lib/animal-search";
import { componerRecordatorios } from "@/lib/cuenta/recordatorios";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("title") };
}

type Media = { url: string; is_cover: boolean; sort_order: number };
type AnimalRef = {
  name: string;
  slug: string;
  published_at: string | null;
  animal_media: Media[] | null;
} | null;

type Favorito = { animal_id: string; animals: AnimalRef };
type Solicitud = {
  id: string;
  status: "pending" | "approved" | "rejected" | "withdrawn" | "completed";
  created_at: string;
  animals: AnimalRef;
};
type Cita = {
  id: string;
  request_id: string | null;
  starts_at: string;
  adoption_requests: { animals: { name: string; shelters: { name: string } | null } | null } | null;
};
type Propuesta = { id: string; animals: { name: string } | null; shelters: { name: string } | null };
type AnimalEspera = { id: string; name: string; slug: string; published_at: string; animal_media: Media[] | null };

/** Estados vivos de una solicitud: los que el adoptante sigue esperando. */
const EN_CURSO: Solicitud["status"][] = ["pending", "approved"];

const CHIP_ESTADO: Record<Solicitud["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  withdrawn: "bg-stone-200 text-stone-700",
  completed: "bg-sky-100 text-sky-800",
};

const CLAVE_ESTADO: Record<Solicitud["status"], string> = {
  pending: "statusPending",
  approved: "statusApproved",
  rejected: "statusRejected",
  withdrawn: "statusWithdrawn",
  completed: "statusCompleted",
};

function portada(media: Media[] | null): string | null {
  const orden = (media ?? [])
    .slice()
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);
  const url = orden[0]?.url ?? null;
  return esImagenValida(url) ? url : null;
}

/**
 * Dashboard del adoptante (FEATURE-039). Todas las lecturas van con la sesión
 * del usuario: RLS ya limita cada tabla a sus propias filas, así que aquí no
 * hace falta —ni debe usarse— el cliente admin.
 */
export default async function MiCuentaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getTranslations("account");
  const format = await getFormatter();
  const ahora = new Date().toISOString();

  const [favData, solData, citData, aleData, acoData, propData, donData, espData] = await Promise.all([
    supabase
      .from("favorites")
      .select("animal_id, animals (name, slug, published_at, animal_media (url, is_cover, sort_order))")
      .order("created_at", { ascending: false }),
    supabase
      .from("adoption_requests")
      .select("id, status, created_at, animals (name, slug, published_at, animal_media (url, is_cover, sort_order))")
      .order("created_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("id, request_id, starts_at, adoption_requests (animals (name, shelters (name)))")
      .in("status", ["pending", "confirmed"])
      .gte("starts_at", ahora)
      .order("starts_at", { ascending: true }),
    supabase.from("saved_searches").select("id").eq("active", true),
    supabase.from("foster_homes").select("user_id, active").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("foster_proposals")
      .select("id, animals (name), shelters (name)")
      .eq("status", "enviada")
      .order("created_at", { ascending: false }),
    supabase.from("donation_offers").select("id").eq("status", "abierta"),
    supabase
      .from("animals")
      .select("id, name, slug, published_at, animal_media (url, is_cover, sort_order)")
      .eq("status", "available")
      .not("published_at", "is", null)
      .order("published_at", { ascending: true })
      .limit(5),
  ]);

  const favoritos = ((favData.data as unknown as Favorito[] | null) ?? []).filter((f) => f.animals !== null);
  const solicitudes = (solData.data as unknown as Solicitud[] | null) ?? [];
  const citas = (citData.data as unknown as Cita[] | null) ?? [];
  const alertas = ((aleData.data as { id: string }[] | null) ?? []).length;
  const acogida = Boolean((acoData.data as { active: boolean } | null)?.active);
  const propuestas = (propData.data as unknown as Propuesta[] | null) ?? [];
  const donaciones = ((donData.data as { id: string }[] | null) ?? []).length;

  const enCurso = solicitudes.filter((s) => EN_CURSO.includes(s.status));
  const sinActividad = favoritos.length === 0 && solicitudes.length === 0 && citas.length === 0;

  const nombre = (user.user_metadata?.full_name as string | undefined)?.trim() || null;

  if (sinActividad) {
    return (
      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <HeroCuenta nombre={nombre} />
        <PrimerosPasos titulo={t("primerosPasosTitulo")} texto={t("primerosPasosTexto")} pasos={[
          { href: "/animales", label: t("pasoExplorar") },
          { href: "/animales", label: t("pasoFavorito") },
          { href: "/mi-cuenta/solicitudes", label: t("pasoSolicitud") },
        ]} />
      </section>
    );
  }

  const recordatorios = componerRecordatorios({
    citas: citas.map((c) => ({
      id: c.id,
      request_id: c.request_id,
      starts_at: c.starts_at,
      animal: c.adoption_requests?.animals?.name ?? null,
      protectora: c.adoption_requests?.animals?.shelters?.name ?? null,
    })),
    solicitudes: solicitudes.map((s) => ({ id: s.id, status: s.status, animal: s.animals?.name ?? null })),
    propuestas: propuestas.map((p) => ({
      id: p.id,
      animal: p.animals?.name ?? null,
      protectora: p.shelters?.name ?? null,
    })),
  });

  // El destacado es el que más lleva publicado y que el usuario todavía no
  // tiene guardado: recomendarle un favorito suyo no aporta nada.
  const yaGuardados = new Set(favoritos.map((f) => f.animal_id));
  const espera = ((espData.data as unknown as AnimalEspera[] | null) ?? []).find((a) => !yaGuardados.has(a.id));
  const destacado: AnimalDestacado | null = espera
    ? { name: espera.name, slug: espera.slug, published_at: espera.published_at, foto: portada(espera.animal_media) }
    : null;

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <HeroCuenta nombre={nombre} />

      <div className="grid gap-4 sm:grid-cols-3">
        <TarjetaMetrica
          icono={Heart}
          etiqueta={t("metricaFavoritos")}
          valor={favoritos.length}
          href="/mi-cuenta/favoritos"
          tono="primary"
        />
        <TarjetaMetrica
          icono={FileText}
          etiqueta={t("metricaSolicitudes")}
          valor={enCurso.length}
          href="/mi-cuenta/solicitudes"
          tono="secondary"
        />
        <TarjetaMetrica
          icono={CalendarHeart}
          etiqueta={t("metricaCitas")}
          valor={citas.length}
          href="/mi-cuenta/citas"
          tono="tertiary"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-6">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-heading text-lg font-semibold">{t("solicitudesRecientes")}</h2>
              <Link
                href="/mi-cuenta/solicitudes"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                {t("verTodas")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            {solicitudes.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("solicitudesEmptyText")}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {solicitudes.slice(0, 3).map((s) => {
                  const foto = portada(s.animals?.animal_media ?? null);
                  return (
                    <li key={s.id}>
                      <Link
                        href="/mi-cuenta/solicitudes"
                        className="flex items-center gap-4 rounded-xl border border-border bg-background/60 p-3 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:active:scale-95"
                      >
                        <Miniatura url={foto} alt={s.animals?.name ?? ""} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">
                            {s.animals?.name ?? t("solicitudAnimalNoDisponible")}
                          </span>
                          <span className="mt-0.5 block text-sm text-muted-foreground">
                            {t("solicitudEnviadaEl", {
                              fecha: format.dateTime(new Date(s.created_at), {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              }),
                            })}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${CHIP_ESTADO[s.status]}`}
                        >
                          {t(CLAVE_ESTADO[s.status])}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="mb-4 font-heading text-lg font-semibold">{t("favoritosBloque")}</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {favoritos.slice(0, 3).map((f) => (
                <li key={f.animal_id}>
                  <Link
                    href={`/animales/${f.animals?.slug ?? ""}`}
                    className="group relative block aspect-square overflow-hidden rounded-xl bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Foto url={portada(f.animals?.animal_media ?? null)} alt={f.animals?.name ?? ""} />
                    <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-2 text-sm font-semibold text-white">
                      {f.animals?.name}
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/animales"
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Plus className="size-6" aria-hidden="true" />
                  {t("favoritosExplorar")}
                </Link>
              </li>
            </ul>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <PanelAportacion donaciones={donaciones} acogida={acogida} alertas={alertas} />
          <Recordatorios recordatorios={recordatorios} />
          <CasoDestacado animal={destacado} />
        </div>
      </div>
    </section>
  );
}

function Miniatura({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-container text-muted-foreground">
        <PawPrint className="size-6" aria-hidden="true" />
      </span>
    );
  }
  return <Image src={url} alt={alt} width={48} height={48} className="size-12 shrink-0 rounded-xl object-cover" />;
}

function Foto({ url, alt }: { url: string | null; alt: string }) {
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
  titulo,
  texto,
  pasos,
}: {
  titulo: string;
  texto: string;
  pasos: { href: string; label: string }[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <PawPrint className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-heading text-xl font-semibold">{titulo}</h2>
        <p className="mt-2 max-w-md text-muted-foreground">{texto}</p>
      </div>
      <ol className="mx-auto mt-6 flex max-w-md flex-col gap-3">
        {pasos.map((p, i) => (
          <li key={p.label}>
            <Link
              href={p.href}
              className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading font-bold text-primary">
                {i + 1}
              </span>
              <span className="flex-1">{p.label}</span>
              <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
