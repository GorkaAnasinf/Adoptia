import type { LucideIcon } from "lucide-react";
import Link from "next/link";

/** Tarjeta de métrica del dashboard del adoptante (FEATURE-039). */
export function TarjetaMetrica({
  icono: Icono,
  etiqueta,
  valor,
  href,
  tono,
}: {
  icono: LucideIcon;
  etiqueta: string;
  valor: number;
  href: string;
  tono: "primary" | "secondary" | "tertiary";
}) {
  const fondo = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary-container text-on-secondary-container",
    tertiary: "bg-tertiary/10 text-tertiary",
  }[tono];

  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-soft-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:active:scale-95"
    >
      <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${fondo}`}>
        <Icono className="size-6" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-muted-foreground">{etiqueta}</span>
        <span className="mt-0.5 block font-heading text-2xl font-bold tabular-nums">{valor}</span>
      </span>
    </Link>
  );
}
