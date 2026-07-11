import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Markdown } from "@/components/guias/Markdown";
import { extraerTOC, leerGuia, listarGuias } from "@/lib/guias";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return listarGuias().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const guia = leerGuia(slug);
  if (!guia) return { robots: { index: false } };
  return {
    title: guia.titulo,
    description: guia.descripcion,
    alternates: { canonical: `/guias/${guia.slug}` },
    openGraph: { title: guia.titulo, description: guia.descripcion, type: "article" },
  };
}

/** Artículo de guía: TOC, tiempo de lectura, JSON-LD Article y CTA final. */
export default async function GuiaPage({ params }: { params: Params }) {
  const { slug } = await params;
  const guia = leerGuia(slug);
  if (!guia) notFound();

  const t = await getTranslations("guias");
  const format = await getFormatter();
  const toc = extraerTOC(guia.cuerpo);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guia.titulo,
    description: guia.descripcion,
    inLanguage: "es",
    dateModified: guia.actualizado || undefined,
    author: { "@type": "Organization", name: "Adoptia" },
    publisher: { "@type": "Organization", name: "Adoptia" },
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link href="/guias" className="text-sm text-primary underline-offset-4 hover:underline">
        {t("volver")}
      </Link>
      <h1 className="mt-3 font-heading text-3xl font-bold">{guia.titulo}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("minutos", { n: guia.minutosLectura })}
        {guia.actualizado
          ? ` · ${t("actualizado", {
              fecha: format.dateTime(new Date(guia.actualizado), {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
            })}`
          : ""}
      </p>

      {toc.length > 1 && (
        <nav
          aria-label={t("tocTitle")}
          className="mt-6 rounded-2xl border border-border bg-card p-4"
        >
          <p className="text-sm font-semibold">{t("tocTitle")}</p>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {toc.map((h) => (
              <li key={h.id}>
                <a href={`#${h.id}`} className="text-primary underline-offset-4 hover:underline">
                  {h.titulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="mt-8">
        <Markdown cuerpo={guia.cuerpo} />
      </div>

      {/* CTA final */}
      <div className="mt-12 flex flex-col items-center gap-3 rounded-3xl bg-secondary px-6 py-10 text-center text-secondary-foreground">
        <h2 className="font-heading text-2xl font-semibold">{t("ctaTitle")}</h2>
        <p className="max-w-md text-secondary-foreground/90">{t("ctaText")}</p>
        <Link
          href="/animales"
          className="mt-2 rounded-full bg-white px-6 py-3 font-medium text-secondary hover:opacity-90"
        >
          {t("ctaBoton")}
        </Link>
      </div>
    </article>
  );
}
