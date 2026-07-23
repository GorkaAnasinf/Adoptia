import { CalendarCheck, Heart, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AnimalCard, type AnimalSearchResult } from "@/components/animals/AnimalCard";
import { HeroSearch } from "@/components/home/HeroSearch";
import { CountUp } from "@/components/ui/CountUp";
import { Parallax } from "@/components/ui/Parallax";
import { PawTrail } from "@/components/ui/PawTrail";
import { Reveal } from "@/components/ui/Reveal";
import { esImagenValida } from "@/lib/animal-search";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

const FOTO_HERO = "/images/hero-home.jpg";
const FOTO_CTA_PROTECTORAS = "/images/cta-protectoras.jpg";

type Estadisticas = { animales: number; protectoras: number; adopciones: number };

async function cargarEstadisticas(): Promise<Estadisticas | null> {
  try {
    const supabase = await createClient();
    const [animales, protectoras, adopciones] = await Promise.all([
      supabase
        .from("animals")
        .select("*", { count: "exact", head: true })
        .not("published_at", "is", null),
      supabase
        .from("shelters")
        .select("*", { count: "exact", head: true })
        .eq("status", "verified"),
      supabase
        .from("animals")
        .select("*", { count: "exact", head: true })
        .eq("status", "adopted"),
    ]);
    if (animales.error || protectoras.error || adopciones.error) return null;
    return {
      animales: animales.count ?? 0,
      protectoras: protectoras.count ?? 0,
      adopciones: adopciones.count ?? 0,
    };
  } catch {
    // Sin conexión o sin .env: la home sigue funcionando
    return null;
  }
}

async function cargarRecientes(): Promise<AnimalSearchResult[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("animals_search", { p_limit: 4 });
    if (error || !data) return [];
    return data as AnimalSearchResult[];
  } catch {
    return [];
  }
}

type Adoptado = {
  id: string;
  name: string;
  slug: string;
  shelter_name: string;
  adopted_at: string;
  cover_url: string | null;
};

async function cargarAdoptados(): Promise<Adoptado[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("adopted_animals_recent", { p_limit: 3 });
    if (error || !data) return [];
    return data as Adoptado[];
  } catch {
    return [];
  }
}

const MES_ANIO = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });

type HistoriaMedia = { url: string; is_cover: boolean; sort_order: number };
type Historia = {
  id: string;
  quote: string;
  photo_url: string | null;
  animals: { name: string; slug: string; animal_media: HistoriaMedia[] | null } | null;
  shelters: { name: string } | null;
};

async function cargarHistorias(): Promise<Historia[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("adoption_stories")
      .select(
        "id, quote, photo_url, animals (name, slug, animal_media (url, is_cover, sort_order)), shelters (name)",
      )
      .eq("status", "approved")
      .order("published_at", { ascending: false })
      .limit(3);
    if (error || !data) return [];
    return data as unknown as Historia[];
  } catch {
    return [];
  }
}

/** Portada de la historia: foto propia del testimonio o, si no, la del animal. */
function portadaHistoria(h: Historia): string | null {
  if (h.photo_url && esImagenValida(h.photo_url)) return h.photo_url;
  const media = (h.animals?.animal_media ?? [])
    .slice()
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);
  const url = media[0]?.url ?? null;
  return url && esImagenValida(url) ? url : null;
}

export default async function HomePage() {
  const t = await getTranslations();
  const [stats, recientes, adoptados, historias] = await Promise.all([
    cargarEstadisticas(),
    cargarRecientes(),
    cargarAdoptados(),
    cargarHistorias(),
  ]);

  const pasos = [
    { icono: Search, titulo: t("home.how1Title"), texto: t("home.how1Text") },
    { icono: Heart, titulo: t("home.how2Title"), texto: t("home.how2Text") },
    { icono: CalendarCheck, titulo: t("home.how3Title"), texto: t("home.how3Text") },
  ];

  return (
    <>
      {/* Hero con buscador sobre foto ambiente */}
      <section className="relative flex min-h-120 flex-col items-center justify-center px-4 py-16 sm:min-h-160">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <Parallax factor={0.35} className="absolute -inset-y-24 inset-x-0">
            <Image
              data-testid="hero-bg"
              src={FOTO_HERO}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-20 grayscale-[0.2]"
            />
          </Parallax>
          <div className="absolute inset-0 bg-linear-to-b from-transparent to-background" />
        </div>
        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-5 text-center">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-[40px] sm:leading-12">
            {t("home.title")}
          </h1>
          <p className="max-w-2xl text-muted-foreground sm:text-lg">{t("home.subtitle")}</p>
          <HeroSearch />
        </div>
      </section>

      {/* Recién llegados */}
      {recientes.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h2 className="font-heading text-2xl font-semibold">{t("home.recentTitle")}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t("home.recentSubtitle")}</p>
            </div>
            <Link
              href="/animales"
              className="shrink-0 text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t("home.recentAll")}
              <span aria-hidden="true"> →</span>
            </Link>
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {recientes.map((animal, i) => (
              <li key={animal.id}>
                <Reveal delayMs={i * 100} className="h-full">
                  <AnimalCard animal={animal} conCta />
                </Reveal>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Separador de marca */}
      <PawTrail className="pb-6" />

      {/* Cómo funciona */}
      <section className="bg-surface-container-low/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center font-heading text-2xl font-semibold">{t("home.howTitle")}</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">{t("home.howSubtitle")}</p>
          <ol className="mt-10 grid gap-6 sm:grid-cols-3">
            {pasos.map(({ icono: Icono, titulo, texto }, i) => (
              <li key={titulo}>
                <Reveal
                  delayMs={i * 120}
                  className="flex h-full flex-col items-center gap-3 rounded-3xl bg-surface-container-lowest px-6 py-8 text-center shadow-soft"
                >
                  <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icono className="size-7" aria-hidden="true" />
                  </span>
                  <h3 className="font-heading text-xl font-semibold">{titulo}</h3>
                  <p className="max-w-xs text-sm text-muted-foreground">{texto}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Adoptia en números — banda teal */}
      {stats !== null && (
        <section aria-label={t("home.statsTitle")} className="bg-secondary text-secondary-foreground">
          <dl
            data-testid="home-stats"
            className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-white/15 px-4 py-10 text-center"
          >
            {[
              { valor: stats.protectoras, etiqueta: t("home.statsSheltersLabel") },
              { valor: stats.animales, etiqueta: t("home.statsAnimalsLabel") },
              { valor: stats.adopciones, etiqueta: t("home.statsAdoptionsLabel") },
            ].map(({ valor, etiqueta }) => (
              <div key={etiqueta} className="flex flex-col gap-1 px-2">
                <dd className="font-heading text-3xl font-bold tabular-nums sm:text-4xl">
                  <CountUp value={valor} />
                </dd>
                <dt className="text-sm text-white/80">{etiqueta}</dt>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Historias felices — testimonios reales del adoptante (FEATURE-059, Nivel 2);
          si aún no hay ninguno aprobado, cae a las últimas adopciones (Nivel 1,
          FEATURE-035). Se oculta si no hay nada que mostrar. */}
      {(historias.length > 0 || adoptados.length > 0) && (
        <section className="mx-auto max-w-6xl px-4 pt-14">
          <div className="text-center">
            <h2 className="font-heading text-2xl font-semibold">{t("home.storiesTitle")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("home.storiesSubtitle")}</p>
          </div>

          {historias.length > 0 ? (
            <ul className="mt-8 grid gap-6 sm:grid-cols-3">
              {historias.map((historia, i) => {
                const foto = portadaHistoria(historia);
                const nombre = historia.animals?.name ?? "";
                return (
                  <li key={historia.id}>
                    <Reveal delayMs={i * 120} className="h-full">
                      <figure className="group flex h-full flex-col overflow-hidden rounded-3xl bg-surface-container-lowest shadow-soft transition-all motion-safe:duration-300 hover:shadow-md motion-safe:hover:-translate-y-1">
                        <div className="relative aspect-4/3 overflow-hidden">
                          {foto ? (
                            <Image
                              src={foto}
                              alt={t("home.storiesAlt", { nombre })}
                              fill
                              sizes="(max-width: 640px) 100vw, 33vw"
                              className="object-cover transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center bg-surface-container">
                              <Heart className="size-10 text-primary/30" aria-hidden="true" />
                            </div>
                          )}
                          <span className="absolute left-3 top-3 rounded-full bg-tertiary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-tertiary-foreground">
                            {t("home.storiesBadge")}
                          </span>
                        </div>
                        <blockquote className="flex-1 px-5 pt-5 text-sm text-foreground">
                          {historia.quote}
                        </blockquote>
                        <figcaption className="px-5 pb-5 pt-3 text-sm">
                          <span className="font-heading font-semibold text-primary">{nombre}</span>
                          {historia.shelters && (
                            <span className="block text-muted-foreground">
                              {t("home.storiesVia", { protectora: historia.shelters.name })}
                            </span>
                          )}
                        </figcaption>
                      </figure>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="mt-8 grid gap-6 sm:grid-cols-3">
              {adoptados.map((animal, i) => (
                <li key={animal.id}>
                  <Reveal delayMs={i * 120} className="h-full">
                    <Link
                      href={`/animales/${animal.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-3xl bg-surface-container-lowest shadow-soft transition-all motion-safe:duration-300 hover:shadow-md motion-safe:hover:-translate-y-1"
                    >
                      <div className="relative aspect-4/3 overflow-hidden">
                        {animal.cover_url ? (
                          <Image
                            src={animal.cover_url}
                            alt={t("home.storiesAlt", { nombre: animal.name })}
                            fill
                            sizes="(max-width: 640px) 100vw, 33vw"
                            className="object-cover transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center bg-surface-container">
                            <Heart className="size-10 text-primary/30" aria-hidden="true" />
                          </div>
                        )}
                        <span className="absolute left-3 top-3 rounded-full bg-tertiary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-tertiary-foreground">
                          {t("home.storiesBadge")}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col px-5 pb-5 pt-4 text-sm">
                        <span className="font-heading text-lg font-semibold text-primary">
                          {animal.name}
                        </span>
                        <span className="text-muted-foreground">
                          {t("home.storiesVia", { protectora: animal.shelter_name })}
                        </span>
                        <span className="mt-1 text-xs text-muted-foreground">
                          {t("home.storiesDate", {
                            fecha: MES_ANIO.format(new Date(animal.adopted_at)),
                          })}
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <PawTrail className="pt-10" />

      {/* Guías (FEATURE-015) */}
      <section className="mx-auto max-w-6xl px-4 pb-4 pt-2">
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-border/60 bg-surface-container-lowest px-6 py-10 text-center shadow-soft">
          <h2 className="font-heading text-2xl font-semibold">{t("guias.homeTitle")}</h2>
          <p className="max-w-xl text-muted-foreground">{t("guias.homeText")}</p>
          <Link
            href="/guias"
            className="mt-1 rounded-2xl border-2 border-primary px-6 py-2.5 font-medium text-primary transition hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:active:scale-95"
          >
            {t("guias.homeCta")}
          </Link>
        </div>
      </section>

      {/* CTA protectoras */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid overflow-hidden rounded-3xl border border-border/40 bg-surface-container-low shadow-soft md:grid-cols-2">
          <div className="flex flex-col items-start justify-center gap-4 px-6 py-10 sm:px-10 lg:py-12">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              {t("home.ctaSheltersOverline")}
            </p>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t("home.ctaSheltersTitle")}
            </h2>
            <p className="max-w-md text-muted-foreground">{t("home.ctaSheltersText")}</p>
            <Link
              href="/registro"
              className="mt-2 rounded-2xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:active:scale-95"
            >
              {t("home.ctaShelters")}
            </Link>
          </div>
          <div className="relative min-h-56 md:min-h-full">
            <Image
              src={FOTO_CTA_PROTECTORAS}
              alt={t("home.ctaSheltersImageAlt")}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </>
  );
}
