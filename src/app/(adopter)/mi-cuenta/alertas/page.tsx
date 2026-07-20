import type { Metadata } from "next";
import { BellPlus, ChevronRight, PawPrint, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AlertaCard, type AlertaFiltros, type AlertaVista } from "@/components/alertas/AlertaCard";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("alertasTitle") };
}

type Alerta = {
  id: string;
  name: string;
  filters: AlertaFiltros | null;
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

  const { data } = await supabase
    .from("saved_searches")
    .select("id, name, filters, active, created_at")
    .order("created_at", { ascending: false });
  const alertas = (data as Alerta[] | null) ?? [];

  const vistas: AlertaVista[] = alertas.map((a) => ({
    id: a.id,
    name: a.name,
    active: a.active,
    createdAt: a.created_at,
    filters: a.filters ?? {},
  }));

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/mi-cuenta" className="hover:text-foreground">
          {t("alertasMigaCuenta")}
        </Link>
        <ChevronRight className="size-4" aria-hidden="true" />
        <span className="font-semibold text-primary">{t("alertasTitle")}</span>
      </nav>

      <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-heading text-3xl font-bold">{t("alertasTitle")}</h1>
          <p className="mt-2 text-muted-foreground">{t("alertasSubtitle")}</p>
        </div>
        {vistas.length > 0 && (
          <Link
            href="/animales"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-primary-container px-6 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-md"
          >
            <BellPlus className="size-4" aria-hidden="true" />
            {t("alertaCrearNueva")}
          </Link>
        )}
      </div>

      {vistas.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-soft">
          <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BellPlus className="size-7" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-heading text-xl font-semibold">{t("alertasEmptyTitle")}</h2>
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
          {vistas.length >= 5 && (
            <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {t("alertaLimite")}
            </p>
          )}
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            {vistas.map((a) => (
              <AlertaCard key={a.id} alerta={a} />
            ))}
            {vistas.length < 5 && (
              <Link
                href="/animales"
                className="group flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-primary/30 p-8 text-primary transition-colors hover:border-primary hover:bg-primary/5"
              >
                <span className="flex size-16 items-center justify-center rounded-full bg-primary-container/10 transition-transform group-hover:scale-110">
                  <Plus className="size-9" aria-hidden="true" />
                </span>
                <span className="text-center">
                  <span className="block font-heading text-xl font-semibold">
                    {t("alertaNuevaTitulo")}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {t("alertaNuevaTexto")}
                  </span>
                </span>
              </Link>
            )}
          </div>

          <aside className="mt-12 flex flex-col gap-6 rounded-2xl bg-secondary-container/20 p-8 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h2 className="font-heading text-xl font-semibold text-on-secondary-container">
                {t("alertasAyudaTitulo")}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-on-secondary-container/80">
                {t("alertasAyudaTexto")}
              </p>
              <Link
                href="/animales"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline"
              >
                <PawPrint className="size-4" aria-hidden="true" />
                {t("alertasAyudaCta")}
              </Link>
            </div>
          </aside>
        </>
      )}
    </section>
  );
}
