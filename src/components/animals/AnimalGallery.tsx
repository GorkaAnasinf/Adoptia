"use client";

import { PawPrint, Play } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { esImagenValida } from "@/lib/animal-search";
import { cn } from "@/lib/utils";
import { youtubeEmbedUrl, youtubeThumb } from "@/lib/youtube";

export type MediaType = "photo" | "video" | "youtube";
export type AnimalMedia = {
  url: string;
  is_cover: boolean;
  sort_order: number;
  type?: MediaType;
};

/** Cada cuántos ms avanza el carrusel solo (pausa mientras un vídeo se reproduce). */
const AUTO_MS = 5000;

function tipo(m: AnimalMedia): MediaType {
  return m.type ?? "photo";
}

function esVideoTipo(m: AnimalMedia): boolean {
  return tipo(m) === "youtube" || tipo(m) === "video";
}

/** Un medio es renderizable si es foto/vídeo con URL válida o YouTube con enlace válido. */
function esValido(m: AnimalMedia): boolean {
  return tipo(m) === "youtube" ? youtubeEmbedUrl(m.url) !== null : esImagenValida(m.url);
}

/** Portada (siempre foto) primero, resto por sort_order. */
function ordenar(media: AnimalMedia[]): AnimalMedia[] {
  return media
    .filter(esValido)
    .sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);
}

export function AnimalGallery({ name, media }: { name: string; media: AnimalMedia[] }) {
  const t = useTranslations("ficha");
  const fotos = ordenar(media);
  const [actual, setActual] = useState(0);
  // Un vídeo se está reproduciendo → pausa el auto-avance y no lo interrumpe.
  const [reproduciendo, setReproduciendo] = useState(false);

  // Auto-avance del carrusel (pausado si hay un vídeo en marcha o hay ≤1 medio).
  useEffect(() => {
    if (fotos.length <= 1 || reproduciendo) return;
    const id = setInterval(() => {
      setActual((p) => (p + 1) % fotos.length);
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [fotos.length, reproduciendo]);

  function irA(i: number) {
    setReproduciendo(false);
    setActual(i);
  }

  if (fotos.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <PawPrint className="size-12" aria-hidden="true" />
      </div>
    );
  }

  const activo = fotos[actual];
  const etiqueta = t("video", { n: actual + 1, total: fotos.length });

  return (
    <figure>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted">
        {tipo(activo) === "youtube" ? (
          reproduciendo ? (
            <iframe
              src={`${youtubeEmbedUrl(activo.url)}?autoplay=1&rel=0`}
              title={etiqueta}
              allow="autoplay; accelerometer; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 size-full border-0"
            />
          ) : (
            // Fachada: póster real del vídeo; al pulsar carga el reproductor.
            <button
              type="button"
              onClick={() => setReproduciendo(true)}
              aria-label={t("reproducirVideo")}
              className="group absolute inset-0 size-full"
            >
              <Image
                src={youtubeThumb(activo.url) ?? ""}
                alt={etiqueta}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition group-hover:bg-black/35">
                <span className="flex size-16 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg">
                  <Play className="size-7 translate-x-0.5 fill-current" aria-hidden="true" />
                </span>
              </span>
            </button>
          )
        ) : tipo(activo) === "video" ? (
          // biome-ignore lint/a11y/useMediaCaption: vídeo del animal sin pista de subtítulos.
          <video
            controls
            preload="metadata"
            aria-label={etiqueta}
            onPlay={() => setReproduciendo(true)}
            onPause={() => setReproduciendo(false)}
            onEnded={() => setReproduciendo(false)}
            className="absolute inset-0 size-full bg-black object-contain"
          >
            <source src={activo.url} type="video/mp4" />
          </video>
        ) : (
          <Image
            src={activo.url}
            alt={t("foto", { n: actual + 1, total: fotos.length })}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
          />
        )}
      </div>
      {fotos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label={name}>
          {fotos.map((foto, i) => {
            const esVideo = esVideoTipo(foto);
            const poster = tipo(foto) === "youtube" ? youtubeThumb(foto.url) : null;
            return (
              <button
                key={foto.url}
                type="button"
                aria-label={esVideo ? t("verVideo", { n: i + 1 }) : t("verFoto", { n: i + 1 })}
                aria-current={i === actual}
                onClick={() => irA(i)}
                className={cn(
                  "relative size-16 shrink-0 overflow-hidden rounded-lg ring-2 transition focus-visible:outline-2 focus-visible:outline-primary",
                  i === actual ? "ring-primary" : "ring-transparent hover:ring-primary/40",
                )}
              >
                {poster ? (
                  <Image src={poster} alt="" fill sizes="64px" className="object-cover" />
                ) : esVideo ? (
                  <span className="flex size-full items-center justify-center bg-foreground/80 text-background" />
                ) : (
                  <Image src={foto.url} alt="" fill sizes="64px" className="object-cover" />
                )}
                {esVideo && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Play className="size-6 fill-white text-white drop-shadow" aria-hidden="true" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </figure>
  );
}
