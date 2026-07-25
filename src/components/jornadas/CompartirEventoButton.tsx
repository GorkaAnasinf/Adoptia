"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Compartir la jornada (FEATURE-062): Web Share API si existe (móvil), y si no,
 * copia el enlace al portapapeles con confirmación. Cancelar el share nativo no
 * es un error. Mismo patrón que CompartirAvisoButton.
 */
export function CompartirEventoButton({ titulo }: { titulo: string }) {
  const t = useTranslations("jornadas");
  const [copiado, setCopiado] = useState(false);

  async function compartir() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: titulo, url });
      } catch {
        // Cancelado por el usuario: no hay nada que arreglar.
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={compartir}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:border-primary/50"
      >
        <Share2 className="size-4" aria-hidden="true" />
        {t("compartir")}
      </button>
      <span role="status" className="text-center text-xs text-tertiary">
        {copiado ? t("compartirCopiado") : null}
      </span>
    </div>
  );
}
