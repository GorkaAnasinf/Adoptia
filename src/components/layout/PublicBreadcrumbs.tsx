"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { crumbsFromPathname } from "@/lib/breadcrumbs";
import { Breadcrumbs } from "./Breadcrumbs";

/**
 * Migas de pan de las páginas públicas. Se derivan del pathname y se
 * anteponen con "Inicio". En la home (sin segmentos) no se muestra nada.
 */
export function PublicBreadcrumbs() {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const segmentos = crumbsFromPathname(pathname, t);
  if (segmentos.length === 0) return null;

  const items = [{ label: t("crumbHome"), href: "/" }, ...segmentos];

  return (
    <div className="border-b border-border bg-background/80">
      <div className="mx-auto max-w-6xl px-4 py-2.5">
        <Breadcrumbs items={items} label={t("breadcrumb")} />
      </div>
    </div>
  );
}
