import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NecesidadForm, type Necesidad } from "@/components/necesidades/NecesidadForm";
import { NecesidadRow } from "@/components/necesidades/NecesidadRow";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("necesidades");
  return { title: t("panelTitle") };
}

/** Necesidades de la protectora: publicar, editar, cubrir y reabrir (FEATURE-031). */
export default async function NecesidadesPanelPage() {
  const t = await getTranslations("necesidades");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: shelter } = user
    ? await supabase.from("shelters").select("id, status").eq("owner_id", user.id).maybeSingle()
    : { data: null };
  const verificada = shelter?.status === "verified";

  let necesidades: Necesidad[] = [];
  if (shelter && verificada) {
    const { data } = await supabase
      .from("shelter_needs")
      .select("id, categoria, descripcion, urgencia, status, created_at")
      .eq("shelter_id", shelter.id)
      .order("created_at", { ascending: false });
    necesidades = (data as Necesidad[] | null) ?? [];
  }
  // Llaves y return explícito: el guardián de i18n confunde `=> x === "texto"` con texto JSX.
  const abiertas = necesidades.filter((n) => {
    return n.status === "abierta";
  });
  const cubiertas = necesidades.filter((n) => {
    return n.status === "cubierta";
  });

  return (
    <section className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold">{t("panelTitle")}</h1>
      <p className="mt-1 text-muted-foreground">{t("panelSubtitle")}</p>

      {!verificada || !shelter ? (
        <p className="mt-8 rounded-xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
          {t("panelSoloVerificadas")}
        </p>
      ) : (
        <>
          <div className="mt-6">
            <NecesidadForm shelterId={shelter.id as string} />
          </div>

          <h2 className="mt-10 flex items-center gap-2 font-heading text-xl font-bold">
            {t("abiertasTitulo")}
            {abiertas.length > 0 && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">
                {abiertas.length}
              </span>
            )}
          </h2>
          {abiertas.length === 0 ? (
            <p className="mt-3 rounded-2xl border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {t("panelEmpty")}
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {abiertas.map((n) => (
                <NecesidadRow key={n.id} need={n} shelterId={shelter.id as string} />
              ))}
            </ul>
          )}

          <h2 className="mt-10 flex items-center gap-2 font-heading text-xl font-bold">
            {t("historialTitulo")}
            {cubiertas.length > 0 && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-semibold text-muted-foreground">
                {cubiertas.length}
              </span>
            )}
          </h2>
          {cubiertas.length === 0 ? (
            <p className="mt-3 rounded-2xl border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {t("historialEmpty")}
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {cubiertas.map((n) => (
                <NecesidadRow key={n.id} need={n} shelterId={shelter.id as string} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
