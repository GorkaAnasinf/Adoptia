import type { Crumb } from "@/components/layout/Breadcrumbs";

/** Segmento de ruta → clave i18n (namespace `shell`). */
const ETIQUETAS: Record<string, string> = {
  panel: "crumbPanel",
  alta: "crumbAlta",
  admin: "crumbAdmin",
  protectoras: "crumbProtectoras",
  "mi-cuenta": "crumbCuenta",
};

/**
 * Deriva las migas de pan del pathname. Cada segmento se traduce con `t`
 * (namespace `shell`); el desconocido cae a su propio texto. El último no
 * lleva enlace.
 */
export function crumbsFromPathname(
  pathname: string,
  t: (key: string) => string,
): Crumb[] {
  const segmentos = pathname.split("/").filter(Boolean);
  return segmentos.map((seg, i) => {
    const clave = ETIQUETAS[seg];
    const label = clave ? t(clave) : seg;
    const ultimo = i === segmentos.length - 1;
    if (ultimo) return { label };
    return { label, href: "/" + segmentos.slice(0, i + 1).join("/") };
  });
}
