import Link from "next/link";
import { useTranslations } from "next-intl";
import { UserMenu } from "./UserMenu";

export function Header() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-heading text-xl font-bold text-primary"
        >
          {t("common.appName")}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/animales" className="hidden text-foreground hover:text-primary sm:block">
            {t("nav.animals")}
          </Link>
          <Link href="/protectoras" className="hidden text-foreground hover:text-primary sm:block">
            {t("nav.shelters")}
          </Link>
          <UserMenu />
        </nav>
      </div>
    </header>
  );
}
