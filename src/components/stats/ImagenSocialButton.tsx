"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Preview + descarga de la imagen social de una ficha (FEATURE-014).
 * La imagen la genera /api/og/social/[slug]; descargable en ambos formatos.
 */
export function ImagenSocialButton({ slug }: { slug: string }) {
  const t = useTranslations("stats");
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-full border border-primary px-3 py-1 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground"
      >
        {t("generarImagen")}
      </button>
    );
  }

  return (
    <div className="flex w-64 flex-col gap-2">
      {/* Preview de la versión cuadrada (next/image no aplica a imágenes generadas al vuelo) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/og/social/${slug}`}
        alt=""
        width={256}
        height={256}
        className="w-full rounded-xl border border-border"
      />
      <div className="flex flex-col gap-1.5">
        <a
          href={`/api/og/social/${slug}`}
          download={`${slug}-1080x1080.png`}
          className="rounded-full bg-primary px-3 py-1.5 text-center text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          {t("descargarCuadrada")}
        </a>
        <a
          href={`/api/og/social/${slug}?f=story`}
          download={`${slug}-1080x1920.png`}
          className="rounded-full border border-primary px-3 py-1.5 text-center text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground"
        >
          {t("descargarStory")}
        </a>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("cerrarImagen")}
        </button>
      </div>
    </div>
  );
}
