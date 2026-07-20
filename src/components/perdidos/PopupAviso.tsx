"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { AvisoMapa } from "./tipos";

/**
 * Contenido del popup de un aviso en el mapa de perdidos, con el lenguaje de
 * la tanda (IMPROVEMENT-028): título terracota, línea muted, chip tonal y CTA
 * granate. Componente puro (sin Leaflet) para poder testearlo en jsdom.
 */
export function PopupAviso({ aviso }: { aviso: AvisoMapa }) {
  const t = useTranslations("perdidos");
  const format = useFormatter();

  const tipo = t(aviso.type === "lost" ? "tipoLost" : "tipoFound");
  const fecha = t(aviso.type === "lost" ? "perdidoEl" : "encontradoEl", {
    fecha: format.dateTime(new Date(aviso.occurred_on), {
      day: "numeric",
      month: "long",
    }),
  });
  const lugar = [aviso.city, fecha].filter(Boolean).join(" · ");

  return (
    <div className="space-y-2">
      <p data-testid="popup-titulo" className="font-heading text-base font-semibold text-primary">
        {aviso.name ?? tipo}
      </p>
      <p className="text-sm text-muted-foreground">{lugar}</p>
      <p
        data-testid="popup-chip"
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
          aviso.type === "lost" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary",
        )}
      >
        {`🐾 ${tipo}`}
      </p>
      <Link
        href={`/perdidos-encontrados/${aviso.id}`}
        className="block rounded-xl bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground! no-underline transition hover:bg-primary/90"
      >
        {t("verAviso")}
      </Link>
    </div>
  );
}
