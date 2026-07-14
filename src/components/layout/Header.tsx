import { PawPrint } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/user-role";
import { PublicBreadcrumbs } from "./PublicBreadcrumbs";
import { PublicNav } from "./PublicNav";
import { UserMenu } from "./UserMenu";

export async function Header() {
  const t = await getTranslations();
  const supabase = await createClient();
  const role = await getUserRole(supabase);

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur">
      <div className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <PawPrint className="size-5" aria-hidden="true" />
            </span>
            <span className="font-heading text-xl font-bold text-primary">
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
