import { Heart, PawPrint, Search } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AnimalCard, type AnimalSearchResult } from "@/components/animals/AnimalCard";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

async function contarAnimales(): Promise<number | null> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("animals")
      .select("*", { count: "exact", head: true });
    return error ? null : count;
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
  const [animalCount, recientes] = await Promise.all([contarAnimales(), cargarRecientes()]);

  const pasos = [
    { icono: Search, titulo: t("home.how1Title"), texto: t("home.how1Text") },
    { icono: Heart, titulo: t("home.how2Title"), texto: t("home.how2Text") },
    { icono: PawPrint, titulo: t("home.how3Title"), texto: t("home.how3Text") },
  ];

  return (
    <>
      {/* Hero + buscador rápido */}
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24">
        <h1 className="font-heading text-4xl font-bold text-foreground sm:text-5xl">
          {t("home.title")}
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">{t("home.subtitle")}</p>
        {animalCount !== null && animalCount > 0 && (
          <p data-testid="animal-count" className="font-medium text-tertiary">
            {t("home.animalsCount", { count: animalCount })}
          </p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/animales"
            className="rounded-full bg-secondary px-6 py-3 font-medium text-secondary-foreground hover:opacity-90"
          >
            {t("home.cta")}
          </Link>
          <Link
            href="/registro"
            className="rounded-full border border-primary px-6 py-3 font-medium text-primary hover:bg-primary hover:text-primary-foreground"
          >
            {t("home.ctaShelters")}
          </Link>
        </div>

        <nav aria-label={t("home.quickTitle")} className="mt-4">
          <p className="text-sm font-medium text-muted-foreground">{t("home.quickTitle")}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Link
              href="/animales?especie=dog"
              className="rounded-full border border-input bg-white px-4 py-2 text-sm font-medium hover:border-primary/50"
            >
              {t("home.quickDogs")}
            </Link>
            <Link
              href="/animales?especie=cat"
              className="rounded-full border border-input bg-white px-4 py-2 text-sm font-medium hover:border-primary/50"
            >
              {t("home.quickCats")}
            </Link>
            <Link
              href="/animales?especie=other"
              className="rounded-full border border-input bg-white px-4 py-2 text-sm font-medium hover:border-primary/50"
            >
              {t("home.quickOthers")}
            </Link>
            <Link
              href="/animales"
              className="rounded-full border border-primary/40 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
            >
              {t("home.quickAll")}
            </Link>
          </div>
        </nav>
      </section>

      {/* Recién llegados */}
      {recientes.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-heading text-2xl font-semibold">{t("home.recentTitle")}</h2>
            <Link
              href="/animales"
              className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("home.recentAll")}
            </Link>
          </div>
          <ul className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {recientes.map((animal) => (
              <li key={animal.id}>
                <AnimalCard animal={animal} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Cómo funciona */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center font-heading text-2xl font-semibold">{t("home.howTitle")}</h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3">
            {pasos.map(({ icono: Icono, titulo, texto }) => (
              <li key={titulo} className="flex flex-col items-center gap-3 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icono className="size-7" aria-hidden="true" />
                </span>
                <h3 className="font-heading text-lg font-semibold">{titulo}</h3>
                <p className="max-w-xs text-sm text-muted-foreground">{texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA protectoras */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-secondary px-6 py-12 text-center text-secondary-foreground">
          <h2 className="font-heading text-2xl font-semibold">{t("home.ctaSheltersTitle")}</h2>
          <p className="max-w-xl text-secondary-foreground/90">{t("home.ctaSheltersText")}</p>
          <Link
            href="/registro"
            className="rounded-full bg-white px-6 py-3 font-medium text-secondary hover:opacity-90"
          >
            {t("home.ctaShelters")}
          </Link>
        </div>
      </section>
    </>
  );
}
