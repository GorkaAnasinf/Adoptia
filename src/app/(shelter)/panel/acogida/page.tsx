import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { GestionAcogidas } from "@/components/acogida/GestionAcogidas";
import type { AcogedorCard, PropuestaEnviada } from "@/components/acogida/GestionAcogidas";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("acogida");
  return { title: t("gestionTitle") };
}

/** Acogedores disponibles + propuestas enviadas de la protectora (FEATURE-029, rediseño FEATURE-058). */
export default async function AcogidaPanelPage() {
  const t = await getTranslations("acogida");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: shelter } = user
    ? await supabase.from("shelters").select("id, status").eq("owner_id", user.id).maybeSingle()
    : { data: null };

  let acogedores: AcogedorCard[] = [];
  let animales: { id: string; name: string }[] = [];
  let propuestas: PropuestaEnviada[] = [];
  const verificada = shelter?.status === "verified";
  if (shelter && verificada) {
    const { data } = await supabase.rpc("foster_homes_nearby", { p_shelter_id: shelter.id });
    acogedores = (data as AcogedorCard[] | null) ?? [];

    const { data: dataAnimales } = await supabase
      .from("animals")
      .select("id, name")
      .eq("shelter_id", shelter.id)
      .not("published_at", "is", null)
      .order("name");
    animales = (dataAnimales as { id: string; name: string }[] | null) ?? [];

    const { data: dataPropuestas } = await supabase
      .from("foster_proposals")
      .select(
        "id, foster_user_id, duracion, mensaje, status, created_at, relevo_pedido_at, relevo_motivo, relevo_fecha_limite, animals (name)",
      )
      .eq("shelter_id", shelter.id)
      .order("created_at", { ascending: false });
    propuestas = (dataPropuestas as unknown as PropuestaEnviada[] | null) ?? [];
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold">{t("gestionTitle")}</h1>
      <p className="mt-1 text-muted-foreground">{t("gestionSubtitle")}</p>

      {!verificada ? (
        <p className="mt-8 rounded-2xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
          {t("panelSoloVerificadas")}
        </p>
      ) : (
        <div className="mt-8">
          <GestionAcogidas acogedores={acogedores} animales={animales} propuestas={propuestas} />
        </div>
      )}
    </section>
  );
}
