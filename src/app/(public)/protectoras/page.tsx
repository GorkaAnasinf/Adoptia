import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ShelterDirectory } from "@/components/shelters/ShelterDirectory";
import { cargarProtectorasDirectorio } from "@/lib/shelters-directory";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("protectorasDir");
  return { title: t("seoTitle"), description: t("subtitle") };
}

export default async function ProtectorasPage() {
  const t = await getTranslations("protectorasDir");
  const supabase = await createClient();
  const shelters = await cargarProtectorasDirectorio(supabase);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8 text-center">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
      </header>
      <ShelterDirectory shelters={shelters} />
    </main>
  );
}
