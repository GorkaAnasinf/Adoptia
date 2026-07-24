import { ClipboardList, Home, Lock, Mail, MapPinned } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AcogidaForm, type FosterHome } from "@/components/acogida/AcogidaForm";
import {
  PropuestasRecibidas,
  type PropuestaRecibida,
} from "@/components/acogida/PropuestasRecibidas";
import { Reveal } from "@/components/ui/Reveal";
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
        .select(
          "id, duracion, mensaje, status, created_at, relevo_pedido_at, relevo_motivo, relevo_fecha_limite, shelters (name, slug), animals (name)",
        )
        .eq("foster_user_id", user.id)
        .order("created_at", { ascending: false });
      propuestas = (dataPropuestas as unknown as PropuestaRecibida[] | null) ?? [];
    }
  }

  const pasos = [
    { icon: ClipboardList, titulo: t("paso1Title"), texto: t("paso1Text") },
    { icon: MapPinned, titulo: t("paso2Title"), texto: t("paso2Text") },
    { icon: Mail, titulo: t("paso3Title"), texto: t("paso3Text") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Cabecera con acento de marca */}
      <header className="flex flex-col items-center gap-4 rounded-3xl border border-border/60 bg-surface-container-low px-6 py-10 text-center shadow-soft">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Home className="size-7" aria-hidden="true" />
        </span>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">{t("title")}</h1>
        <p className="max-w-2xl text-muted-foreground">{t("subtitle")}</p>
      </header>

      {/* Cómo funciona la acogida */}
      <section className="mt-12">
        <h2 className="flex items-center gap-3 font-heading text-xl font-semibold">
          <span className="h-6 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          {t("comoFuncionaTitle")}
        </h2>
        <ol className="mt-5 grid gap-5 sm:grid-cols-3">
          {pasos.map(({ icon: Icono, titulo, texto }, i) => (
            <li key={titulo}>
              <Reveal
                delayMs={i * 120}
                className="flex h-full flex-col gap-3 rounded-3xl border border-border/60 bg-surface-container-lowest px-6 py-7 shadow-soft"
              >
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icono className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-heading text-lg font-semibold">
                  <span className="text-primary">{i + 1}. </span>
                  {titulo}
                </h3>
                <p className="text-sm text-muted-foreground">{texto}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {/* Garantía de privacidad — banda teal */}
      <p className="mt-8 flex items-start gap-3 rounded-2xl bg-secondary/10 px-5 py-4 text-sm text-secondary">
        <Lock className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <span>{t("privacidad")}</span>
      </p>

      {/* Propuestas recibidas (solo registrados) */}
      {user && existente && (
        <section className="mt-12">
          <h2 className="flex items-center gap-3 font-heading text-xl font-semibold">
            <span className="h-6 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            {t("recibidasTitulo")}
          </h2>
          <div className="mt-5">
            <PropuestasRecibidas propuestas={propuestas} />
          </div>
        </section>
      )}

      {/* Formulario / CTA — columna legible centrada */}
      <section className="mt-12">
        <h2 className="flex items-center gap-3 font-heading text-xl font-semibold">
          <span className="h-6 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          {t("formTitulo")}
        </h2>
        <div className="mx-auto mt-5 max-w-3xl">
          {user ? (
            <AcogidaForm userId={user.id} existente={existente} />
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-border bg-card px-6 py-14 text-center shadow-soft">
              <span aria-hidden className="text-5xl">
                🏡
              </span>
              <p className="max-w-md text-muted-foreground">{t("loginNecesario")}</p>
              <Link
                href="/login"
                className="rounded-full bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:active:scale-95"
              >
                {t("registrar")}
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
