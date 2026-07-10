"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface ShelterMapResult {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  distance_m: number | null;
  animal_count: number;
  lat: number;
  lng: number;
}

function formatDistancia(m: number | null): string | null {
  if (m === null) return null;
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

export function ListaProtectoras({
  shelters,
  selectedId,
  onSelect,
  hoveredId = null,
  onHover,
}: {
  shelters: ShelterMapResult[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
}) {
  const t = useTranslations("mapa");

  return (
    <ul className="space-y-3">
      {shelters.map((s) => {
        const distancia = formatDistancia(s.distance_m);
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect(s.id)}
              onMouseEnter={() => onHover?.(s.id)}
              onMouseLeave={() => onHover?.(null)}
              aria-pressed={selectedId === s.id}
              className={cn(
                "w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-primary hover:ring-1 hover:ring-primary",
                selectedId === s.id || hoveredId === s.id ? "border-primary ring-1 ring-primary" : "border-black/5",
              )}
            >
              <p className="font-heading font-semibold text-foreground">{s.name}</p>
              <p className="text-sm text-muted-foreground">
                {s.city}
                {distancia ? ` · ${distancia}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">{t("animales", { count: s.animal_count })}</p>
              <Link
                href={`/protectoras/${s.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="mt-2 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("verProtectora")}
              </Link>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
