import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

type Props = {
  titulo: string;
  intro?: string;
  /** Claves de sección dentro del namespace `legal` (p. ej. "privacy.s1"). */
  secciones: string[];
};

/** Maqueta común de los textos legales: cabecera con acento, intro y secciones. */
export function LegalArticle({ titulo, intro, secciones }: Props) {
  const t = useTranslations("legal");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Cabecera con acento de marca */}
      <header className="overflow-hidden rounded-3xl border border-border/60 bg-surface-container-low shadow-soft">
        <div className="flex flex-col gap-4 px-6 py-10 sm:px-10">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">{titulo}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("updated")}</p>
          </div>
          {intro && <p className="max-w-2xl text-muted-foreground">{intro}</p>}
        </div>
      </header>

      {/* Cuerpo legible: columna constreñida dentro del ancho del panel */}
      <article className="mx-auto mt-10 flex max-w-3xl flex-col gap-8">
        {secciones.map((clave) => (
          <section key={clave} className="border-l-2 border-primary/30 pl-5">
            <h2 className="font-heading text-xl font-semibold text-foreground">
              {t(`${clave}Title`)}
            </h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{t(`${clave}Text`)}</p>
          </section>
        ))}
      </article>
    </div>
  );
}
