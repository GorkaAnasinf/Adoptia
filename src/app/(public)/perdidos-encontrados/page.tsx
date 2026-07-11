import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PerdidosView } from "@/components/perdidos/PerdidosView";
import type { AvisoMapa } from "@/components/perdidos/tipos";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("perdidos");
  return { title: t("title"), description: t("subtitle") };
}

/** Avisos abiertos de perdidos/encontrados (RPC con ubicación ya redondeada). */
export default async function PerdidosPage() {
  const t = await getTranslations("perdidos");

  let avisos: AvisoMapa[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("lost_found_list");
    avisos = (data as AvisoMapa[] | null) ?? [];
  } catch {
    // Sin BD: la página sigue renderizando vacía.
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link
          href="/perdidos-encontrados/nuevo"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          {t("publicar")}
        </Link>
      </div>
      <div className="mt-8">
        <PerdidosView avisos={avisos} />
      </div>
    </section>
  );
}
