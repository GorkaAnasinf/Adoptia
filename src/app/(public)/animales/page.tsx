import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AnimalCard, type AnimalSearchResult } from "@/components/animals/AnimalCard";
import { AnimalSearchEmpty } from "@/components/animals/AnimalSearchEmpty";
import { AnimalSearchFilters } from "@/components/animals/AnimalSearchFilters";
import { OrdenSelect } from "@/components/animals/OrdenSelect";
import {
  type AnimalSearch,
  buildQueryString,
  paginasVisibles,
  parseAnimalSearch,
  searchToRpcArgs,
  totalPaginas,
} from "@/lib/animal-search";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

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
      {/* Barra de filtros */}
      <details className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 lg:hidden">
        <summary className="cursor-pointer font-semibold text-foreground">{t("filters")}</summary>
        <div className="pt-4">
          <AnimalSearchFilters search={search} />
        </div>
      </details>
      <div className="hidden rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 lg:block">
        <AnimalSearchFilters search={search} />
      </div>

      {/* Cabecera de resultados */}
      <header className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          {t("title")}{" "}
          <span className="align-middle font-body text-base font-medium text-primary">
            {t("resultados", { count: total })}
          </span>
        </h1>
        <OrdenSelect search={search} />
      </header>

      <section aria-live="polite" className="mt-6">
        {animales.length === 0 ? (
          <AnimalSearchEmpty />
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {animales.map((animal) => (
                <li key={animal.id}>
                  <AnimalCard animal={animal} conFavorito />
                </li>
              ))}
            </ul>

            {paginas > 1 && (
              <nav
                aria-label={t("pagina", { actual: search.pagina, total: paginas })}
                className="mt-10 flex flex-col items-center gap-5"
              >
                {search.pagina < paginas && (
                  <Link
                    href={enlacePagina(search.pagina + 1)}
                    className="rounded-full border border-primary px-6 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    {t("verMas")}
                  </Link>
                )}
                <ul className="flex flex-wrap items-center justify-center gap-2">
                  {paginasVisibles(search.pagina, paginas).map((p, i) => {
                    if (typeof p !== "number") {
                      return (
                        <li key={`elipsis-${i}`} className="px-1 text-muted-foreground" aria-hidden="true">
                          …
                        </li>
                      );
                    }
                    return (
                      <li key={p}>
                        {p === search.pagina ? (
                          <span
                            aria-current="page"
                            className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                          >
                            {p}
                          </span>
                        ) : (
                          <Link
                            href={enlacePagina(p)}
                            className={cn(
                              "flex size-10 items-center justify-center rounded-full border border-input bg-white text-sm font-medium",
                              "hover:border-primary/50 hover:text-primary",
                            )}
                          >
                            {p}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}
