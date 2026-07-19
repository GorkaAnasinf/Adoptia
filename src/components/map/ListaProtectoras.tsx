"use client";

import { ArrowRight, MapPin, PawPrint } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatDistancia } from "./popup";

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
                "w-full rounded-2xl bg-surface-container-lowest p-4 text-left shadow-soft transition hover:ring-2 hover:ring-primary/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                (selectedId === s.id || hoveredId === s.id) && "ring-2 ring-primary",
              )}
            >
              <p className="font-heading font-semibold text-primary">{s.name}</p>
              {(s.city || distancia) && (
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4 shrink-0" aria-hidden="true" />
                  {[s.city, distancia].filter(Boolean).join(" · ")}
                </p>
              )}
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-tertiary/10 px-2.5 py-1 text-xs font-medium text-tertiary">
                <PawPrint className="size-3.5" aria-hidden="true" />
                {t("animales", { count: s.animal_count })}
              </p>
              <Link
                href={`/protectoras/${s.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                {t("verProtectora")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
