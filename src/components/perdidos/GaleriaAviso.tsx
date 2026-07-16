"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { esImagenValida } from "@/lib/animal-search";
import type { FotoAviso } from "./tipos";

function compararFotos(a: FotoAviso, b: FotoAviso): number {
  if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1;
  return a.sort_order - b.sort_order;
}

function tieneUrlValida(f: FotoAviso): boolean {
  return esImagenValida(f.url);
}

/**
 * Galería de un aviso (FEATURE-024): portada grande + tira de miniaturas. Al
 * pulsar una miniatura cambia la principal. Con una sola foto se ve como antes;
 * sin fotos no renderiza nada (ni deja hueco).
 */
export function GaleriaAviso({ fotos, alt }: { fotos: FotoAviso[]; alt: string }) {
  const t = useTranslations("perdidos");
  // Portada primero, luego por orden. El RPC ya las manda así, pero el
  // componente no depende de ello: la portada mandando es una garantía suya.
  const validas = fotos.filter(tieneUrlValida).toSorted(compararFotos);
  const [activa, setActiva] = useState(0);

  if (validas.length === 0) return null;

  const principal = validas[Math.min(activa, validas.length - 1)];

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-muted">
        <Image
          key={principal.url}
          data-testid="galeria-principal"
          src={principal.url}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="object-cover"
        />
      </div>

      {validas.length > 1 && (
        <ul className="flex flex-wrap gap-2">
          {validas.map((f, i) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => setActiva(i)}
                aria-label={t("galeriaFoto", { n: i + 1 })}
                aria-current={i === activa}
                className={`relative size-16 overflow-hidden rounded-lg ${
                  i === activa ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100"
                }`}
              >
                <Image src={f.url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
