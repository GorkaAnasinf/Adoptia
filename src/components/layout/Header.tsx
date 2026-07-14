import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/user-role";
import { UserMenu } from "./UserMenu";

export async function Header() {
  const t = await getTranslations();
  const supabase = await createClient();
  const role = await getUserRole(supabase);

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
          <Link href="/mapa" className="hidden text-foreground hover:text-primary sm:block">
            {t("nav.map")}
          </Link>
          <Link
            href="/perdidos-encontrados"
            className="hidden text-foreground hover:text-primary sm:block"
          >
            {t("nav.lostFound")}
          </Link>
          <UserMenu role={role} />
        </nav>
      </div>
    </header>
  );
}
