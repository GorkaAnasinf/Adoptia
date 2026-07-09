import type { OpeningHours } from "@/lib/schemas/shelter";

export const DIAS_SEMANA = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"] as const;
export type DiaSemana = (typeof DIAS_SEMANA)[number];

type Franja = { open: string; close: string };

/**
 * Resume el horario en una fila por día: la cadena de franjas ("10:00–14:00,
 * 16:00–18:00") o null si ese día está cerrado.
 */
export function resumenHorario(
  oh: OpeningHours | null | undefined,
): { dia: DiaSemana; franjas: string | null }[] {
  return DIAS_SEMANA.map((dia) => {
    const fr = ((oh?.[dia] as Franja[] | undefined) ?? []).filter((f) => f.open && f.close);
    return { dia, franjas: fr.length ? fr.map((f) => `${f.open}–${f.close}`).join(", ") : null };
  });
}

/** ¿Hay al menos una franja definida en toda la semana? */
export function tieneHorario(oh: OpeningHours | null | undefined): boolean {
  return DIAS_SEMANA.some((d) => ((oh?.[d] as Franja[] | undefined) ?? []).length > 0);
}
