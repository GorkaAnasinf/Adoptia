import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AnimalCard, type AnimalSearchResult } from "@/components/animals/AnimalCard";
import { AnimalSearchEmpty } from "@/components/animals/AnimalSearchEmpty";
import { CrearAlertaButton } from "@/components/alertas/CrearAlertaButton";
import { AnimalSearchFilters } from "@/components/animals/AnimalSearchFilters";
import { OrdenSelect } from "@/components/animals/OrdenSelect";
import { Reveal } from "@/components/ui/Reveal";
import {
  type AnimalSearch,
  buildQueryString,
  contarFiltrosActivos,
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
  return { title: t("seoTitle"), description: t("subtitle") };
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

  const filtrosActivos = contarFiltrosActivos(search);
  const etiquetaFiltros =
    filtrosActivos > 0 ? t("filtrosConActivos", { count: filtrosActivos }) : t("filters");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Barra de filtros — superficie tonal (lenguaje de la home) */}
      <details className="group rounded-3xl bg-surface-container-low p-4 shadow-soft lg:hidden">
        <summary className="cursor-pointer font-semibold text-foreground">
          {etiquetaFiltros}
        </summary>
        <div className="pt-4">
          <AnimalSearchFilters search={search} />
        </div>
      </details>
      <div className="hidden rounded-3xl bg-surface-container-low p-6 shadow-soft lg:block">
        <AnimalSearchFilters search={search} />
      </div>

      {/* Cabecera de resultados */}
      <header className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 font-medium text-primary">{t("resultados", { count: total })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <CrearAlertaButton search={search} variant="compacto" />
          <OrdenSelect search={search} />
        </div>
      </header>

      <section aria-live="polite" className="mt-6">
        {animales.length === 0 ? (
          <AnimalSearchEmpty search={search} />
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {animales.map((animal, i) => (
                <li key={animal.id}>
                  <Reveal delayMs={(i % 4) * 100} className="h-full">
                    <AnimalCard animal={animal} conFavorito />
                  </Reveal>
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
                  {search.pagina > 1 && (
                    <li>
                      <Link
                        href={enlacePagina(search.pagina - 1)}
                        aria-label={t("paginaAnterior")}
                        className="flex size-10 items-center justify-center rounded-full border border-input bg-surface-container-lowest hover:border-primary/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        <ChevronLeft className="size-5" aria-hidden="true" />
                      </Link>
                    </li>
                  )}
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
                              "flex size-10 items-center justify-center rounded-full border border-input bg-surface-container-lowest text-sm font-medium",
                              "hover:border-primary/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                            )}
                          >
                            {p}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                  {search.pagina < paginas && (
                    <li>
                      <Link
                        href={enlacePagina(search.pagina + 1)}
                        aria-label={t("paginaSiguiente")}
                        className="flex size-10 items-center justify-center rounded-full border border-input bg-surface-container-lowest hover:border-primary/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        <ChevronRight className="size-5" aria-hidden="true" />
                      </Link>
                    </li>
                  )}
                </ul>
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}
