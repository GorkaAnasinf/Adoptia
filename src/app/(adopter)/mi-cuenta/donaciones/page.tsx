import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DonacionForm, type Donacion } from "@/components/donaciones/DonacionForm";
import { DonacionRow } from "@/components/donaciones/DonacionRow";
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
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>

      <h2 className="mt-8 font-heading text-xl font-bold">{t("nuevaOferta")}</h2>
      <div className="mt-3">
        <DonacionForm userId={user.id} />
      </div>

      {ofertas.length === 0 ? (
        <p className="mt-8 rounded-xl border-2 border-dashed border-border p-8 text-center text-muted-foreground">
          {t("miEmpty")}
        </p>
      ) : (
        <>
          <ul className="mt-8 flex flex-col gap-2">
            {ofertas.map((o) => (
              <DonacionRow key={o.id} oferta={o} userId={user.id} />
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">{t("caducaInfo")}</p>
        </>
      )}
    </section>
  );
}
