import { CalendarClock, HeartHandshake, type LucideIcon, TicketCheck } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Recordatorio } from "@/lib/cuenta/recordatorios";

const ICONO: Record<Recordatorio["tipo"], LucideIcon> = {
  cita: CalendarClock,
  reservar: TicketCheck,
  acogida: HeartHandshake,
};

/** Día y hora de la cita en la zona del usuario final, no la del servidor. */
const CUANDO_MADRID = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Madrid",
});

/**
 * Bloque lateral del dashboard del adoptante (FEATURE-039). Componente puro:
 * la lista llega ya compuesta por `componerRecordatorios`.
 */
export function Recordatorios({ recordatorios }: { recordatorios: Recordatorio[] }) {
  const t = useTranslations("account");
  if (recordatorios.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="font-heading text-lg font-semibold">{t("recordatoriosTitulo")}</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {recordatorios.map((r) => {
          const Icono = ICONO[r.tipo];
          const animal = r.animal ?? t("animalSinNombre");
          const protectora = r.protectora ?? "—";
          const titulo =
            r.tipo === "cita"
              ? t("recordatorioCita", { animal })
              : r.tipo === "reservar"
                ? t("recordatorioReservar")
                : t("recordatorioAcogida");
          const detalle =
            r.tipo === "cita"
              ? t("recordatorioCitaDetalle", {
                  fecha: CUANDO_MADRID.format(new Date(r.fecha ?? "")),
                  protectora,
                })
              : r.tipo === "reservar"
                ? t("recordatorioReservarDetalle", { animal })
                : t("recordatorioAcogidaDetalle", { protectora, animal });

          return (
            <li key={`${r.tipo}-${r.id}`}>
              <Link
                href={r.href}
                className="flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:active:scale-95"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                  <Icono className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{titulo}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{detalle}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
