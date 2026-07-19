import { PlusCircle } from "lucide-react";
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
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Hero del wireframe: título terracota + CTA granate con icono. */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link
          href="/perdidos-encontrados/nuevo"
          className="inline-flex items-center gap-2 self-start rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft-lg transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:active:scale-95 md:self-auto"
        >
          <PlusCircle aria-hidden className="h-5 w-5" />
          {t("publicar")}
        </Link>
      </div>
      <div className="mt-8">
        <PerdidosView avisos={avisos} />
      </div>
    </section>
  );
}
