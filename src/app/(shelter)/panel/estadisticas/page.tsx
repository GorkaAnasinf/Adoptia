import type { Metadata } from "next";
import { Clock, Eye, Inbox, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { serieVisitas, tiempoMedioHastaAdopcion, type VistaDia } from "@/lib/estadisticas";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("stats");
  return { title: t("title") };
}

type AnimalFila = {
  id: string;
  name: string;
  slug: string;
  status: string;
  published_at: string | null;
  updated_at: string;
};

/** Métricas de la protectora: visitas agregadas (sin PII), solicitudes y ritmo. */
export default async function EstadisticasPage() {
  const t = await getTranslations("stats");
  const format = await getFormatter();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: shelter } = user
    ? await supabase.from("shelters").select("id").eq("owner_id", user.id).maybeSingle()
    : { data: null };

  let animales: AnimalFila[] = [];
  let vistas: (VistaDia & { animal_id: string })[] = [];
  const solicitudesPorAnimal = new Map<string, number>();

  if (shelter) {
    const { data: a } = await supabase
      .from("animals")
      .select("id,name,slug,status,published_at,updated_at")
      .eq("shelter_id", shelter.id)
      .order("updated_at", { ascending: false });
    animales = (a as AnimalFila[] | null) ?? [];

    if (animales.length > 0) {
      const ids = animales.map((x) => x.id);
      const desde = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
      const [{ data: v }, { data: s }] = await Promise.all([
        supabase
          .from("page_views")
          .select("animal_id, day, views")
          .in("animal_id", ids)
          .gte("day", desde),
        supabase.from("adoption_requests").select("animal_id").in("animal_id", ids),
      ]);
      vistas = (v as (VistaDia & { animal_id: string })[] | null) ?? [];
      for (const fila of (s as { animal_id: string }[] | null) ?? []) {
        solicitudesPorAnimal.set(fila.animal_id, (solicitudesPorAnimal.get(fila.animal_id) ?? 0) + 1);
      }
    }
  }

  const totalVisitas = vistas.reduce((n, f) => n + f.views, 0);
  const totalSolicitudes = [...solicitudesPorAnimal.values()].reduce(function (a, b) {
    return a + b;
  }, 0);
  const media = tiempoMedioHastaAdopcion(animales);

  // Serie diaria agregada (todas las fichas) para la gráfica de barras
  const porDia = new Map<string, number>();
  for (const f of vistas) porDia.set(f.day, (porDia.get(f.day) ?? 0) + f.views);
  const serie = serieVisitas([...porDia.entries()].map(([day, views]) => ({ day, views })));
  const maxDia = Math.max(1, ...serie.map((d) => d.views));

  function visitasDeAnimal(id: string): number {
    return vistas.filter((f) => f.animal_id === id).reduce(function (n, f) {
      return n + f.views;
    }, 0);
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
      <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
      <p className="mt-2 text-xs text-muted-foreground">{t("sinPII")}</p>

      {animales.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-soft">
          <h2 className="font-heading text-xl font-semibold">{t("vacioTitle")}</h2>
          <p className="mt-2 max-w-md text-muted-foreground">{t("vacioText")}</p>
          <Link
            href="/panel/animales"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            {t("vacioCta")}
          </Link>
        </div>
      ) : (
        <>
          {/* Resumen */}
          <dl data-testid="stats-resumen" className="mt-8 grid gap-4 sm:grid-cols-3">
            {(
              [
                { icono: Eye, valor: String(totalVisitas), etiqueta: t("visitas30"), tono: "bg-primary/10 text-primary" },
                { icono: Inbox, valor: String(totalSolicitudes), etiqueta: t("solicitudesTotales"), tono: "bg-secondary-container text-on-secondary-container" },
                { icono: Clock, valor: media === null ? t("tiempoMedioVacio") : String(media), etiqueta: t("tiempoMedio"), tono: "bg-tertiary/10 text-tertiary" },
              ] as { icono: LucideIcon; valor: string; etiqueta: string; tono: string }[]
            ).map(({ icono: Icono, valor, etiqueta, tono }) => (
              <div
                key={etiqueta}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft"
              >
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${tono}`}>
                  <Icono className="size-6" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <dd className="font-heading text-3xl font-bold tabular-nums">{valor}</dd>
                  <dt className="mt-0.5 text-sm text-muted-foreground">{etiqueta}</dt>
                </div>
              </div>
            ))}
          </dl>

          {/* Gráfica de barras (30 días) */}
          <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-heading text-lg font-semibold">{t("graficaTitle")}</h2>
            {totalVisitas === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t("graficaVacia")}</p>
            ) : (
              <div
                data-testid="stats-grafica"
                className="mt-4 flex h-32 items-end gap-0.5"
                role="img"
                aria-label={t("graficaTitle")}
              >
                {serie.map((d) => (
                  <div
                    key={d.day}
                    title={`${format.dateTime(new Date(d.day), { day: "numeric", month: "short" })}: ${d.views}`}
                    className="flex-1 rounded-t-sm bg-primary/70 transition-colors hover:bg-primary"
                    style={{ height: `${Math.max(2, Math.round((d.views / maxDia) * 100))}%` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Por animal */}
          <h2 className="mt-10 font-heading text-xl font-semibold">{t("porAnimalTitle")}</h2>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t("colAnimal")}</th>
                  <th className="px-4 py-3 font-medium">{t("colVisitas")}</th>
                  <th className="px-4 py-3 font-medium">{t("colSolicitudes")}</th>
                </tr>
              </thead>
              <tbody>
                {animales.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-2.5">
                      <Link href={`/animales/${a.slug}`} className="font-medium text-primary hover:underline">
                        {a.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums">{visitasDeAnimal(a.id)}</td>
                    <td className="px-4 py-2.5 tabular-nums">{solicitudesPorAnimal.get(a.id) ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
