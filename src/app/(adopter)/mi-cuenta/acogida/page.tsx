import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { type FosterHome } from "@/components/acogida/AcogidaForm";
import { MisAcogidasCliente } from "@/components/acogida/MisAcogidasCliente";
import { type PropuestaRecibida } from "@/components/acogida/PropuestasRecibidas";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("acogida");
  return { title: t("title") };
}

/** Gestión del registro de casa de acogida desde el área personal. */
export default async function MiAcogidaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getTranslations("acogida");
  const { data } = await supabase
    .from("foster_homes")
    .select("user_id, city, radius_km, condiciones, active")
    .eq("user_id", user.id)
    .maybeSingle();
  const existente = (data as FosterHome | null) ?? null;

  let propuestas: PropuestaRecibida[] = [];
  if (existente) {
    const { data: dataPropuestas } = await supabase
      .from("foster_proposals")
      .select(
        "id, duracion, mensaje, status, created_at, relevo_pedido_at, relevo_motivo, relevo_fecha_limite, shelters (name, slug), animals (name)",
      )
      .eq("foster_user_id", user.id)
      .order("created_at", { ascending: false });
    propuestas = (dataPropuestas as unknown as PropuestaRecibida[] | null) ?? [];
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      <p className="mt-3 rounded-xl bg-secondary/10 px-4 py-3 text-sm text-secondary">
        {t("privacidad")}
      </p>

      <MisAcogidasCliente userId={user.id} existente={existente} propuestas={propuestas} />
    </section>
  );
}
