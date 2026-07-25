import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JornadasView } from "@/components/jornadas/JornadasView";
import type { JornadaMapa } from "@/components/jornadas/tipos";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("jornadas");
  return { title: t("publicListTitle"), description: t("publicListSubtitle") };
}

/** Jornadas de adopción publicadas y futuras (RPC events_upcoming). */
export default async function JornadasPage() {
  const t = await getTranslations("jornadas");

  let jornadas: JornadaMapa[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("events_upcoming", {});
    jornadas = (data as JornadaMapa[] | null) ?? [];
  } catch {
    // Sin BD: la página sigue renderizando vacía.
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          {t("publicListTitle")}
        </h1>
        <p className="mt-3 text-muted-foreground">{t("publicListSubtitle")}</p>
      </div>
      <div className="mt-8">
        <JornadasView jornadas={jornadas} />
      </div>
    </section>
  );
}
