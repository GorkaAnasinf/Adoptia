import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ShelterDirectory } from "@/components/shelters/ShelterDirectory";
import { cargarProtectorasDirectorio } from "@/lib/shelters-directory";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("protectorasDir");
  return { title: t("title"), description: t("subtitle") };
}

export default async function ProtectorasPage() {
  const t = await getTranslations("protectorasDir");
  const supabase = await createClient();
  const shelters = await cargarProtectorasDirectorio(supabase);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link
          href="/mapa"
          className="rounded-full border border-input bg-white px-4 py-2 text-sm hover:border-primary/50"
        >
          {t("verMapa")}
        </Link>
      </header>
      <ShelterDirectory shelters={shelters} />
    </main>
  );
}
