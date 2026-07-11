import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { AlertaAcciones } from "@/components/alertas/AlertaAcciones";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("alertasTitle") };
}

type Alerta = {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  active: boolean;
  created_at: string;
};

/** Alertas (búsquedas guardadas) del adoptante. */
export default async function AlertasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getTranslations("account");
  const tAnimales = await getTranslations("animales");
  const tBusqueda = await getTranslations("busqueda");
  const format = await getFormatter();

  const { data } = await supabase
    .from("saved_searches")
    .select("id, name, filters, active, created_at")
    .order("created_at", { ascending: false });
  const alertas = (data as Alerta[] | null) ?? [];

  const ESPECIE: Record<string, string> = {
    dog: tAnimales("speciesDog"),
    cat: tAnimales("speciesCat"),
    other: tAnimales("speciesOther"),
  };

  function resumen(filters: Record<string, unknown>): string[] {
    const partes: string[] = [];
    if (typeof filters.especie === "string" && ESPECIE[filters.especie]) {
      partes.push(ESPECIE[filters.especie]);
    }
    if (typeof filters.radio_km === "number" || typeof filters.radio_km === "string") {
      partes.push(tBusqueda("distanciaDe", { km: Number(filters.radio_km) }));
    }
    return partes;
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold">{t("alertasTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("alertasSubtitle")}</p>

      {alertas.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-14 text-center">
          <h2 className="font-heading text-xl font-semibold">{t("alertasEmptyTitle")}</h2>
          <p className="mt-2 max-w-md text-muted-foreground">{t("alertasEmptyText")}</p>
          <Link
            href="/animales"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-secondary px-6 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90"
          >
            {t("alertasEmptyCta")}
          </Link>
        </div>
      ) : (
        <>
          {alertas.length >= 5 && (
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {t("alertaLimite")}
            </p>
          )}
          <ul className="mt-6 flex flex-col gap-3">
            {alertas.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
              >
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold">{a.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {[...resumen(a.filters), format.dateTime(new Date(a.created_at), { day: "numeric", month: "long" })].join(" · ")}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    a.active ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {a.active ? t("alertaActiva") : t("alertaPausada")}
                </span>
                <AlertaAcciones alertaId={a.id} activa={a.active} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
