import { CalendarCheck, Heart, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AnimalCard, type AnimalSearchResult } from "@/components/animals/AnimalCard";
import { HeroSearch } from "@/components/home/HeroSearch";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

const FOTO_CTA_PROTECTORAS =
  "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&q=80";

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

export default async function HomePage() {
  const t = await getTranslations();
  const [stats, recientes] = await Promise.all([cargarEstadisticas(), cargarRecientes()]);

  const pasos = [
    { icono: Search, titulo: t("home.how1Title"), texto: t("home.how1Text") },
    { icono: Heart, titulo: t("home.how2Title"), texto: t("home.how2Text") },
    { icono: CalendarCheck, titulo: t("home.how3Title"), texto: t("home.how3Text") },
  ];

  return (
    <>
      {/* Hero con buscador */}
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 pb-12 pt-14 text-center sm:pt-20">
        <h1 className="font-heading text-4xl font-bold text-foreground sm:text-5xl">
          {t("home.title")}
        </h1>
        <p className="max-w-2xl text-muted-foreground sm:text-lg">{t("home.subtitle")}</p>
        <HeroSearch />
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
            {recientes.map((animal) => (
              <li key={animal.id}>
                <AnimalCard animal={animal} conCta />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Cómo funciona */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center font-heading text-2xl font-semibold">{t("home.howTitle")}</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">{t("home.howSubtitle")}</p>
          <ol className="mt-10 grid gap-5 sm:grid-cols-3">
            {pasos.map(({ icono: Icono, titulo, texto }, i) => (
              <li
                key={titulo}
                className="flex flex-col items-center gap-3 rounded-2xl bg-background px-6 py-8 text-center"
              >
                <span
                  className={`flex size-14 items-center justify-center rounded-xl ${
                    i === 1 ? "bg-secondary/10 text-secondary" : i === 2 ? "bg-tertiary/10 text-tertiary" : "bg-primary/10 text-primary"
                  }`}
                >
                  <Icono className="size-7" aria-hidden="true" />
                </span>
                <h3 className="font-heading text-lg font-semibold">{titulo}</h3>
                <p className="max-w-xs text-sm text-muted-foreground">{texto}</p>
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
                <dd className="font-heading text-3xl font-bold tabular-nums sm:text-4xl">{valor}</dd>
                <dt className="text-sm text-white/80">{etiqueta}</dt>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Guías (FEATURE-015) */}
      <section className="mx-auto max-w-6xl px-4 pb-4 pt-12">
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card px-6 py-10 text-center">
          <h2 className="font-heading text-2xl font-semibold">{t("guias.homeTitle")}</h2>
          <p className="max-w-xl text-muted-foreground">{t("guias.homeText")}</p>
          <Link
            href="/guias"
            className="mt-1 rounded-full border border-primary px-6 py-2.5 font-medium text-primary hover:bg-primary hover:text-primary-foreground"
          >
            {t("guias.homeCta")}
          </Link>
        </div>
      </section>

      {/* CTA protectoras */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid overflow-hidden rounded-3xl bg-accent md:grid-cols-2">
          <div className="flex flex-col items-start justify-center gap-4 px-6 py-10 sm:px-10">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              {t("home.ctaSheltersOverline")}
            </p>
            <h2 className="font-heading text-3xl font-bold text-foreground">
              {t("home.ctaSheltersTitle")}
            </h2>
            <p className="text-muted-foreground">{t("home.ctaSheltersText")}</p>
            <Link
              href="/registro"
              className="mt-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {t("home.ctaShelters")}
            </Link>
          </div>
          <div className="relative min-h-56 md:min-h-full">
            <Image
              src={FOTO_CTA_PROTECTORAS}
              alt={t("home.ctaSheltersOverline")}
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
