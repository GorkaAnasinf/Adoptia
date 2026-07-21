import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>

      <MisDonacionesCliente userId={user.id} ofertas={ofertas} />
    </section>
  );
}
