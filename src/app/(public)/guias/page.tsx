import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { listarGuias } from "@/lib/guias";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("guias");
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: { canonical: "/guias" },
  };
}

/** Índice de guías agrupado por categoría (contenido estático, motor SEO). */
export default async function GuiasPage() {
  const t = await getTranslations("guias");
  const guias = listarGuias();

  const categorias = new Map<string, typeof guias>();
  for (const g of guias) {
    categorias.set(g.categoria, [...(categorias.get(g.categoria) ?? []), g]);
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      {/* Cabecera con acento de marca */}
      <header className="flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-surface-container-low px-6 py-10 text-center shadow-soft">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <BookOpen className="size-7" aria-hidden="true" />
        </span>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">{t("title")}</h1>
        <p className="max-w-xl text-muted-foreground">{t("subtitle")}</p>
      </header>

      {[...categorias.entries()].map(([categoria, lista]) => (
        <div key={categoria} className="mt-12">
          <h2 className="flex items-center gap-3 font-heading text-xl font-semibold">
            <span className="h-6 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            {categoria}
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/guias/${g.slug}`}
                  className="group flex h-full flex-col gap-2 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all motion-safe:duration-300 hover:border-primary/50 hover:shadow-md motion-safe:hover:-translate-y-1"
                >
                  <span className="flex items-center gap-2 text-primary">
                    <BookOpen className="size-4" aria-hidden="true" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {t("minutos", { n: g.minutosLectura })}
                    </span>
                  </span>
                  <span className="font-heading text-lg font-semibold">{g.titulo}</span>
                  <span className="text-sm text-muted-foreground">{g.descripcion}</span>
                  <span className="mt-auto pt-2 text-sm font-medium text-primary">
                    {t("leerGuia")}
                    <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 inline-block"> →</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
