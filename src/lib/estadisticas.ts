/** Utilidades puras de métricas del panel (FEATURE-014). */

export type AnimalMetrica = {
  status: string;
  published_at: string | null;
  updated_at: string;
};

/**
 * Días medios entre publicación y adopción, sobre los animales adoptados con
 * fecha de publicación. `updated_at` de un adoptado ≈ fecha de adopción (su
 * último cambio de estado); aproximación documentada mientras no exista
 * `adopted_at`. Devuelve null sin datos suficientes.
 */
export function tiempoMedioHastaAdopcion(animales: AnimalMetrica[]): number | null {
  const dias = animales
    .filter((a) => a.status === "adopted" && a.published_at)
    .map((a) => {
      const ms = new Date(a.updated_at).getTime() - new Date(a.published_at!).getTime();
      return ms / (24 * 3600 * 1000);
    })
    .filter((d) => d >= 0);
  if (dias.length === 0) return null;
  return Math.round(dias.reduce((s, d) => s + d, 0) / dias.length);
}

export type VistaDia = { day: string; views: number };

/** Serie continua de los últimos `dias` días (huecos a 0), para la gráfica. */
export function serieVisitas(filas: VistaDia[], dias = 30, hoy = new Date()): VistaDia[] {
  const porDia = new Map(filas.map((f) => [f.day, f.views]));
  const serie: VistaDia[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - i);
    const clave = d.toISOString().slice(0, 10);
    serie.push({ day: clave, views: porDia.get(clave) ?? 0 });
  }
  return serie;
}
