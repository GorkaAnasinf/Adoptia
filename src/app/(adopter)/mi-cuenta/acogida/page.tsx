import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AcogidaForm, type FosterHome } from "@/components/acogida/AcogidaForm";
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

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      <p className="mt-3 rounded-xl bg-secondary/10 px-4 py-3 text-sm text-secondary">
        {t("privacidad")}
      </p>

      <div className="mt-8">
        <AcogidaForm userId={user.id} existente={existente} />
      </div>
    </section>
  );
}
