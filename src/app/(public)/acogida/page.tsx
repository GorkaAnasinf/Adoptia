import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AcogidaForm, type FosterHome } from "@/components/acogida/AcogidaForm";
import {
  PropuestasRecibidas,
  type PropuestaRecibida,
} from "@/components/acogida/PropuestasRecibidas";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("acogida");
  return { title: t("title"), description: t("subtitle"), alternates: { canonical: "/acogida" } };
}

/** Registro público de casas de acogida (el alta exige cuenta). */
export default async function AcogidaPage() {
  const t = await getTranslations("acogida");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let existente: FosterHome | null = null;
  let propuestas: PropuestaRecibida[] = [];
  if (user) {
    const { data } = await supabase
      .from("foster_homes")
      .select("user_id, city, radius_km, condiciones, active")
      .eq("user_id", user.id)
      .maybeSingle();
    existente = (data as FosterHome | null) ?? null;

    if (existente) {
      const { data: dataPropuestas } = await supabase
        .from("foster_proposals")
        .select("id, duracion, mensaje, status, created_at, shelters (name), animals (name)")
        .eq("foster_user_id", user.id)
        .order("created_at", { ascending: false });
      propuestas = (dataPropuestas as unknown as PropuestaRecibida[] | null) ?? [];
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      <p className="mt-3 rounded-xl bg-secondary/10 px-4 py-3 text-sm text-secondary">
        {t("privacidad")}
      </p>

      {user && existente && <PropuestasRecibidas propuestas={propuestas} />}

      <div className="mt-8">
        {user ? (
          <AcogidaForm userId={user.id} existente={existente} />
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-12 text-center">
            <p className="text-muted-foreground">{t("loginNecesario")}</p>
            <Link
              href="/login"
              className="rounded-full bg-primary px-6 py-2.5 font-semibold text-primary-foreground hover:opacity-90"
            >
              {t("registrar")}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
