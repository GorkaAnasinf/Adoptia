import { useTranslations } from "next-intl";

type Props = {
  titulo: string;
  intro?: string;
  /** Claves de sección dentro del namespace `legal` (p. ej. "privacy.s1"). */
  secciones: string[];
};

/** Maqueta común de los textos legales: título, fecha, intro y secciones. */
export function LegalArticle({ titulo, intro, secciones }: Props) {
  const t = useTranslations("legal");

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-heading text-3xl font-bold">{titulo}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("updated")}</p>
      {intro && <p className="mt-6 text-muted-foreground">{intro}</p>}
      {secciones.map((clave) => (
        <section key={clave} className="mt-8">
          <h2 className="font-heading text-xl font-semibold">{t(`${clave}Title`)}</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">{t(`${clave}Text`)}</p>
        </section>
      ))}
    </article>
  );
}
