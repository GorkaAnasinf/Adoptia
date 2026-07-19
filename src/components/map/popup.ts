import type { ShelterMapResult } from "./ListaProtectoras";

/** Distancia legible: metros por debajo del km, km con un decimal por encima. */
export function formatDistancia(m: number | null): string | null {
  if (m === null) return null;
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

export function escapeHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface PopupTextos {
  animales: string;
  verProtectora: string;
}

/**
 * Contenido del popup de una protectora en el mapa, con el lenguaje de la
 * tanda (nombre en Montserrat terracota, distancia, chip de animales y CTA).
 * Todo dato de la protectora pasa por escapeHtml — el popup es HTML crudo.
 */
export function popupHtml(s: ShelterMapResult, textos: PopupTextos): string {
  const distancia = formatDistancia(s.distance_m);
  const lugar = [s.city, distancia].filter(Boolean).join(" · ");
  return `
    <div class="space-y-2">
      <p class="font-heading text-base font-semibold text-primary">${escapeHtml(s.name)}</p>
      ${lugar ? `<p class="text-sm text-muted-foreground">${escapeHtml(lugar)}</p>` : ""}
      <p class="inline-flex items-center rounded-full bg-tertiary/10 px-2.5 py-1 text-xs font-medium text-tertiary">🐾 ${escapeHtml(textos.animales)}</p>
      <a href="/protectoras/${encodeURIComponent(s.slug)}" class="block rounded-xl bg-primary px-3 py-2 text-center text-sm font-semibold !text-primary-foreground no-underline transition hover:bg-primary/90">${escapeHtml(textos.verProtectora)}</a>
    </div>
  `;
}
