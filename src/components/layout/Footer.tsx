import Link from "next/link";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="bg-surface-container">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 text-sm md:flex-row md:items-start md:justify-between">
        <div className="flex max-w-xs flex-col gap-2 text-center md:text-left">
          <p className="font-heading text-xl font-bold text-primary">{t("common.appName")}</p>
          <p className="text-muted-foreground">{t("footer.tagline")}</p>
        </div>
        <nav
          aria-label={t("footer.navLabel")}
          className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-muted-foreground"
        >
          <Link href="/guias" className="py-1 underline-offset-4 hover:text-secondary hover:underline">
            {t("guias.footer")}
          </Link>
          <Link href="/acogida" className="py-1 underline-offset-4 hover:text-secondary hover:underline">
            {t("acogida.footer")}
          </Link>
          <Link href="/necesidades" className="py-1 underline-offset-4 hover:text-secondary hover:underline">
            {t("necesidades.footer")}
          </Link>
          <Link href="/privacidad" className="py-1 underline-offset-4 hover:text-secondary hover:underline">
            {t("footer.privacy")}
          </Link>
          <Link href="/aviso-legal" className="py-1 underline-offset-4 hover:text-secondary hover:underline">
            {t("footer.legalNotice")}
          </Link>
          <Link href="/cookies" className="py-1 underline-offset-4 hover:text-secondary hover:underline">
            {t("footer.cookies")}
          </Link>
          <Link href="/terminos" className="py-1 underline-offset-4 hover:text-secondary hover:underline">
            {t("footer.terms")}
          </Link>
        </nav>
        <p className="shrink-0 text-muted-foreground">{t("footer.rights")}</p>
      </div>
    </footer>
  );
}
