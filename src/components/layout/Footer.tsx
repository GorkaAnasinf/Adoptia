import { PawPrint } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/** Columna de enlaces del pie con su encabezado. */
function ColumnaEnlaces({
  titulo,
  enlaces,
}: {
  titulo: string;
  enlaces: { href: string; label: string }[];
}) {
  return (
    <nav aria-label={titulo} className="flex flex-col gap-3">
      <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/70">{titulo}</h2>
      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        {enlaces.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  const explorar = [
    { href: "/animales", label: t("nav.animals") },
    { href: "/protectoras", label: t("nav.shelters") },
    { href: "/mapa", label: t("nav.map") },
    { href: "/perdidos-encontrados", label: t("nav.lostFound") },
    { href: "/guias", label: t("guias.footer") },
  ];
  const legal = [
    { href: "/privacidad", label: t("footer.privacy") },
    { href: "/aviso-legal", label: t("footer.legalNotice") },
    { href: "/cookies", label: t("footer.cookies") },
    { href: "/terminos", label: t("footer.terms") },
  ];

  return (
    <footer className="mt-16 border-t border-border/60 bg-surface-container">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Marca */}
          <div className="flex max-w-xs flex-col gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <PawPrint className="size-5" aria-hidden="true" />
              </span>
              <span className="font-heading text-xl font-bold text-primary">
                {t("common.appName")}
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("footer.tagline")}</p>
          </div>

          <ColumnaEnlaces titulo={t("footer.exploreTitle")} enlaces={explorar} />
          <ColumnaEnlaces titulo={t("footer.legalTitle")} enlaces={legal} />
        </div>

        {/* Barra inferior */}
        <div className="mt-10 flex flex-col items-center gap-2 border-t border-border/50 pt-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <p>{t("footer.copyright", { year })}</p>
          <p className="flex items-center gap-1.5">
            <PawPrint className="size-4 text-primary" aria-hidden="true" />
            {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
