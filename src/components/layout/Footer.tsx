import Link from "next/link";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="border-t border-border bg-muted">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <p>{t("footer.rights")}</p>
        <nav className="flex gap-4">
          <Link href="/privacidad" className="hover:text-primary">
            {t("footer.privacy")}
          </Link>
          <Link href="/terminos" className="hover:text-primary">
            {t("footer.terms")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
