"use client";

import { PawPrint } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type AnimalMedia = { url: string; is_cover: boolean; sort_order: number };

/** Portada primero, resto por sort_order. */
function ordenar(media: AnimalMedia[]): AnimalMedia[] {
  return [...media].sort(
    (a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order,
  );
}

export function AnimalGallery({ name, media }: { name: string; media: AnimalMedia[] }) {
  const t = useTranslations("ficha");
  const fotos = ordenar(media);
  const [actual, setActual] = useState(0);

  if (fotos.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <PawPrint className="size-12" aria-hidden="true" />
      </div>
    );
  }

  return (
    <figure>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted">
        <Image
          src={fotos[actual].url}
          alt={t("foto", { n: actual + 1, total: fotos.length })}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
        />
      </div>
      {fotos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label={name}>
          {fotos.map((foto, i) => (
            <button
              key={foto.url}
              type="button"
              aria-label={t("verFoto", { n: i + 1 })}
              aria-current={i === actual}
              onClick={() => setActual(i)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-lg ring-2 transition focus-visible:outline-2 focus-visible:outline-primary",
                i === actual ? "ring-primary" : "ring-transparent hover:ring-primary/40",
              )}
            >
              <Image src={foto.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </figure>
  );
}
