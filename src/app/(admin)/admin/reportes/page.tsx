import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { ReporteAcciones } from "@/components/moderacion/ReporteAcciones";
import type { EstadoReporte, RazonReporte } from "@/lib/schemas/moderacion";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("moderacion");
  return { title: t("colaTitle") };
}

type Reporte = {
  id: string;
  reason: RazonReporte;
  details: string | null;
  status: EstadoReporte;
  created_at: string;
  animals: { id: string; name: string; slug: string; published_at: string | null } | null;
};

const RAZON_CLAVE: Record<RazonReporte, string> = {
  contenido_inapropiado: "razonContenido_inapropiado",
  posible_fraude: "razonPosible_fraude",
  spam: "razonSpam",
  maltrato: "razonMaltrato",
  otro: "razonOtro",
};

/** Cola de reportes para admins (RLS: is_admin). */
export default async function AdminReportesPage() {
  const t = await getTranslations("moderacion");
  const format = await getFormatter();
  const supabase = await createClient();

  const { data } = await supabase
    .from("reports")
    .select("id, reason, details, status, created_at, animals(id, name, slug, published_at)")
    .order("created_at", { ascending: false })
    .limit(100);
  const reportes = (data as unknown as Reporte[] | null) ?? [];
  const pendientes = reportes.filter((r) => r.status === "pending");
  const resueltos = reportes.filter((r) => r.status !== "pending").slice(0, 20);

  const tarjeta = (r: Reporte, conAcciones: boolean) => (
    <li key={r.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
          {t(RAZON_CLAVE[r.reason])}
        </span>
        {r.animals && (
          <Link href={`/animales/${r.animals.slug}`} className="font-semibold text-primary hover:underline">
            {r.animals.name}
          </Link>
        )}
        <span className="text-sm text-muted-foreground">
          {format.dateTime(new Date(r.created_at), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
        {!conAcciones && (
          <span className="ml-auto rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
            {t(r.status === "reviewed" ? "estadoReviewed" : "estadoDismissed")}
          </span>
        )}
      </div>
      {r.details && <p className="text-sm text-muted-foreground">{r.details}</p>}
      {conAcciones && r.animals && (
        <ReporteAcciones
          reporteId={r.id}
          animalId={r.animals.id}
          publicada={r.animals.published_at !== null}
        />
      )}
    </li>
  );

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold">{t("colaTitle")}</h1>
      <p className="mt-1 text-muted-foreground">{t("colaSubtitle")}</p>

      {pendientes.length === 0 ? (
        <p className="mt-8 rounded-xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
          {t("colaEmpty")}
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">{pendientes.map((r) => tarjeta(r, true))}</ul>
      )}

      {resueltos.length > 0 && (
        <>
          <h2 className="mt-10 font-heading text-xl font-semibold">{t("resueltos")}</h2>
          <ul className="mt-3 flex flex-col gap-2">{resueltos.map((r) => tarjeta(r, false))}</ul>
        </>
      )}
    </section>
  );
}
