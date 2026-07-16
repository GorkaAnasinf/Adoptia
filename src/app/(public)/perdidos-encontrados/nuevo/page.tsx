import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { NuevoAvisoForm } from "@/components/perdidos/NuevoAvisoForm";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("perdidos");
  return { title: t("nuevoTitle") };
}

/** Publicar un aviso exige cuenta (anti-spam + contacto posible vía moderación). */
export default async function NuevoAvisoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getTranslations("perdidos");

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-center font-heading text-3xl font-bold">{t("nuevoTitle")}</h1>
      <p className="mt-1 text-center text-muted-foreground">{t("nuevoSubtitle")}</p>
      <div className="mt-8">
        <NuevoAvisoForm userId={user.id} />
      </div>
    </section>
  );
}
