"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { type AnimalSearch, buildQueryString, ORDENES, type Orden } from "@/lib/animal-search";

/** Selector «Ordenar por» del listado: navega al cambiar conservando filtros. */
export function OrdenSelect({ search }: { search: AnimalSearch }) {
  const t = useTranslations("busqueda");
  const router = useRouter();
  const pathname = usePathname();
  const id = useId();

  const conUbicacion = search.lat !== undefined && search.lng !== undefined;
  const CLAVE: Record<Orden, string> = { recientes: "ordenRecientes", cercanos: "ordenCercanos" };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="shrink-0 text-sm text-muted-foreground">
        {t("orden")}
      </label>
      <select
        id={id}
        value={search.orden}
        onChange={(e) => {
          const qs = buildQueryString({ ...search, pagina: 1, orden: e.target.value as Orden });
          router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        }}
        className="min-h-10 rounded-lg border border-input bg-white px-2.5 text-sm font-medium text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {ORDENES.map((o) => (
          <option key={o} value={o} disabled={o === "cercanos" && !conUbicacion}>
            {t(CLAVE[o])}
          </option>
        ))}
      </select>
    </div>
  );
}
