import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AnimalCard, type AnimalSearchResult } from "@/components/animals/AnimalCard";
import { AnimalSearchEmpty } from "@/components/animals/AnimalSearchEmpty";
import { AnimalSearchFilters } from "@/components/animals/AnimalSearchFilters";
import {
  type AnimalSearch,
  buildQueryString,
  parseAnimalSearch,
  searchToRpcArgs,
  totalPaginas,
} from "@/lib/animal-search";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("busqueda");
  return { title: t("title"), description: t("subtitle") };
}

async function buscarAnimales(search: AnimalSearch): Promise<AnimalSearchResult[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("animals_search", searchToRpcArgs(search));
  if (error || !data) return [];
  return data as AnimalSearchResult[];
}

export default async function AnimalesPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations("busqueda");
  const search = parseAnimalSearch(await searchParams);
  const animales = await buscarAnimales(search);
  const total = animales.length ? Number(animales[0].total_count) : 0;
  const paginas = totalPaginas(total);

  const enlacePagina = (pagina: number) => {
    const qs = buildQueryString({ ...search, pagina });
    return qs ? `/animales?${qs}` : "/animales";
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside aria-label={t("filters")}>
          <details className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 lg:hidden" open={false}>
            <summary className="cursor-pointer font-semibold text-foreground">
              {t("filters")}
            </summary>
            <div className="pt-4">
              <AnimalSearchFilters search={search} />
            </div>
          </details>
          <div className="hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:block">
            <AnimalSearchFilters search={search} />
          </div>
        </aside>

        <section aria-live="polite">
          <p className="mb-4 text-sm text-muted-foreground">{t("results", { count: total })}</p>
          {animales.length === 0 ? (
            <AnimalSearchEmpty />
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {animales.map((animal) => (
                  <li key={animal.id}>
                    <AnimalCard animal={animal} />
                  </li>
                ))}
              </ul>
              {paginas > 1 && (
                <nav
                  aria-label={t("pagina", { actual: search.pagina, total: paginas })}
                  className="mt-8 flex items-center justify-center gap-4"
                >
                  {search.pagina > 1 && (
                    <Link
                      href={enlacePagina(search.pagina - 1)}
                      className="rounded-full border border-input bg-white px-4 py-2 text-sm hover:border-primary/50"
                    >
                      {t("pagAnterior")}
                    </Link>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {t("pagina", { actual: search.pagina, total: paginas })}
                  </span>
                  {search.pagina < paginas && (
                    <Link
                      href={enlacePagina(search.pagina + 1)}
                      className="rounded-full border border-input bg-white px-4 py-2 text-sm hover:border-primary/50"
                    >
                      {t("pagSiguiente")}
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
