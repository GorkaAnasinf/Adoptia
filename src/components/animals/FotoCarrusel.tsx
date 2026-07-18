"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { esImagenValida } from "@/lib/animal-search";
import { createClient } from "@/lib/supabase/client";

/**
 * Foto de la tarjeta con flechas para pasar las demás fotos del animal sin
 * entrar en su ficha. Las fotos se piden a `animal_media` la primera vez que
 * se pulsa una flecha (nada de tráfico extra si nadie las usa); si el animal
 * solo tiene una, las flechas se retiran.
 */
export function FotoCarrusel({
  animalId,
  coverUrl,
  alt,
  sizes,
}: {
  animalId: string;
  coverUrl: string;
  alt: string;
  sizes: string;
}) {
  const t = useTranslations("busqueda");
  const [fotos, setFotos] = useState<string[] | null>(null);
  const [indice, setIndice] = useState(0);
  const [cargando, setCargando] = useState(false);

  const cargarFotos = async (): Promise<string[]> => {
    if (fotos) return fotos;
    const { data } = await createClient()
      .from("animal_media")
      .select("url, is_cover, sort_order")
      .eq("animal_id", animalId)
      .eq("type", "photo")
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true });
    const urls = (data ?? [])
      .map((f: { url: string }) => f.url)
      .filter((u: string) => esImagenValida(u));
    const lista = urls.length > 0 ? urls : [coverUrl];
    setFotos(lista);
    return lista;
  };

  const mover = async (e: React.MouseEvent, delta: number) => {
    // dentro de un <Link>: la flecha nunca debe abrir la ficha
    e.preventDefault();
    e.stopPropagation();
    if (cargando) return;
    setCargando(true);
    try {
      const lista = await cargarFotos();
      if (lista.length > 1) {
        setIndice((i) => (i + delta + lista.length) % lista.length);
      }
    } finally {
      setCargando(false);
    }
  };

  const url = fotos?.[indice] ?? coverUrl;
  const sinMasFotos = fotos !== null && fotos.length <= 1;

  const claseFlecha =
    "absolute top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-surface-container-lowest/80 text-foreground shadow-sm backdrop-blur-sm transition hover:bg-surface-container-lowest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:active:scale-95";

  return (
    <>
      <Image
        src={url}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {!sinMasFotos && (
        <>
          <button
            type="button"
            aria-label={t("fotoAnterior")}
            onClick={(e) => mover(e, -1)}
            className={`${claseFlecha} left-2`}
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={t("fotoSiguiente")}
            onClick={(e) => mover(e, 1)}
            className={`${claseFlecha} right-2`}
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </>
      )}
    </>
  );
}
