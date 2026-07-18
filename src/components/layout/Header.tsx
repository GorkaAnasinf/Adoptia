import { PawPrint } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/user-role";
import { HeaderScrollEffect } from "./HeaderScrollEffect";
import { PublicBreadcrumbs } from "./PublicBreadcrumbs";
import { PublicNav } from "./PublicNav";
import { UserMenu } from "./UserMenu";

export async function Header() {
  const t = await getTranslations();
  const supabase = await createClient();
  const role = await getUserRole(supabase);

  return (
    <header
      data-app-header
      className="group sticky top-0 z-40 bg-background/80 backdrop-blur-md transition-shadow data-scrolled:shadow-md data-scrolled:shadow-black/5"
    >
      <HeaderScrollEffect />
      <div className="border-b border-border/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 transition-[height] duration-300 group-data-scrolled:h-13">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <PawPrint className="size-6 text-primary" aria-hidden="true" />
            <span className="font-heading text-2xl font-bold text-primary">
              {t("common.appName")}
            </span>
          </Link>

          <PublicNav />

          <div className="md:ml-auto">
            <UserMenu role={role} />
          </div>
        </div>
      </div>

      <PublicBreadcrumbs />
    </header>
  );
}
