"use client";

import { PawPrint, Play } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { esImagenValida } from "@/lib/animal-search";
import { cn } from "@/lib/utils";
import { youtubeEmbedUrl } from "@/lib/youtube";

export type MediaType = "photo" | "video" | "youtube";
export type AnimalMedia = {
  url: string;
  is_cover: boolean;
  sort_order: number;
  type?: MediaType;
};

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

  if (fotos.length === 0) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <PawPrint className="size-12" aria-hidden="true" />
      </div>
    );
  }

  const activo = fotos[actual];

  return (
    <figure>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted">
        {tipo(activo) === "youtube" ? (
          <iframe
            src={youtubeEmbedUrl(activo.url) ?? ""}
            title={t("video", { n: actual + 1, total: fotos.length })}
            allow="accelerometer; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 size-full border-0"
          />
        ) : tipo(activo) === "video" ? (
          // biome-ignore lint/a11y/useMediaCaption: vídeo del animal sin pista de subtítulos.
          <video
            controls
            aria-label={t("video", { n: actual + 1, total: fotos.length })}
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
            return (
              <button
                key={foto.url}
                type="button"
                aria-label={esVideo ? t("verVideo", { n: i + 1 }) : t("verFoto", { n: i + 1 })}
                aria-current={i === actual}
                onClick={() => setActual(i)}
                className={cn(
                  "relative size-16 shrink-0 overflow-hidden rounded-lg ring-2 transition focus-visible:outline-2 focus-visible:outline-primary",
                  i === actual ? "ring-primary" : "ring-transparent hover:ring-primary/40",
                )}
              >
                {esVideo ? (
                  <span className="flex size-full items-center justify-center bg-foreground/80 text-background">
                    <Play className="size-6 fill-current" aria-hidden="true" />
                  </span>
                ) : (
                  <Image src={foto.url} alt="" fill sizes="64px" className="object-cover" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </figure>
  );
}
