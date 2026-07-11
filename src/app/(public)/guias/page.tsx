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
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>

      {[...categorias.entries()].map(([categoria, lista]) => (
        <div key={categoria} className="mt-10">
          <h2 className="font-heading text-xl font-semibold">{categoria}</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {lista.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/guias/${g.slug}`}
                  className="flex h-full flex-col gap-2 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
                >
                  <span className="flex items-center gap-2 text-primary">
                    <BookOpen className="size-4" aria-hidden="true" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {t("minutos", { n: g.minutosLectura })}
                    </span>
                  </span>
                  <span className="font-heading text-lg font-semibold">{g.titulo}</span>
                  <span className="text-sm text-muted-foreground">{g.descripcion}</span>
                  <span className="mt-auto text-sm font-medium text-primary">{t("leerGuia")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
