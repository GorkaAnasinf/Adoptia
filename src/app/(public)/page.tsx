import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 300;

async function contarAnimales(): Promise<number | null> {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("animals")
      .select("*", { count: "exact", head: true });
    return error ? null : count;
  } catch {
    // Sin conexión o sin .env: la home sigue funcionando
    return null;
  }
}

export default async function HomePage() {
  const t = await getTranslations();
  const animalCount = await contarAnimales();

  return (
    <section className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24">
      <h1 className="font-heading text-4xl font-bold text-foreground sm:text-5xl">
        {t("home.title")}
      </h1>
      <p className="max-w-2xl text-lg text-muted-foreground">
        {t("home.subtitle")}
      </p>
      {animalCount !== null && animalCount > 0 && (
        <p data-testid="animal-count" className="font-medium text-tertiary">
          {t("home.animalsCount", { count: animalCount })}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/animales"
          className="rounded-full bg-secondary px-6 py-3 font-medium text-secondary-foreground hover:opacity-90"
        >
          {t("home.cta")}
        </Link>
        <Link
          href="/protectoras/alta"
          className="rounded-full border border-primary px-6 py-3 font-medium text-primary hover:bg-primary hover:text-primary-foreground"
        >
          {t("home.ctaShelters")}
        </Link>
      </div>
    </section>
  );
}
