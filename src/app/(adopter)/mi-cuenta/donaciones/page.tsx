import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CuentaSeccionHeader } from "@/components/cuenta/CuentaSeccionHeader";
import { type Donacion } from "@/components/donaciones/DonacionForm";
import { MisDonacionesCliente } from "@/components/donaciones/MisDonacionesCliente";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("donaciones");
  return { title: t("title") };
}

/** Ofertas de donación del usuario: publicar, editar, entregar, renovar, borrar (FEATURE-032). */
export default async function DonacionesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getTranslations("donaciones");

  const { data } = await supabase
    .from("donation_offers")
    .select("id, categoria, descripcion, city, radius_km, status, renovada_at, created_at")
    .order("created_at", { ascending: false });
  const ofertas = (data as Donacion[] | null) ?? [];

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <CuentaSeccionHeader titulo={t("title")} subtitulo={t("subtitle")} />

      <MisDonacionesCliente userId={user.id} ofertas={ofertas} />
    </section>
  );
}
