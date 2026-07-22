import type { Metadata } from "next";
import Link from "next/link";
import { PawPrint, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AnimalesGrid, type AnimalGridRow } from "@/components/panel/AnimalesGrid";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("animales");
  return { title: t("title") };
}

type Row = AnimalGridRow & { species: string; moderation_note: string | null };

export default async function AnimalesPage() {
  const t = await getTranslations("animales");
  const tm = await getTranslations("moderacion");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: shelter } = user
    ? await supabase.from("shelters").select("id, status").eq("owner_id", user.id).maybeSingle()
    : { data: null };

  let animales: Row[] = [];
  if (shelter) {
    const { data } = await supabase
      .from("animals")
      .select(
        "id,name,slug,species,sex,breed,birth_date_approx,status,published_at,moderation_note,animal_media(url,is_cover,sort_order)",
      )
      .eq("shelter_id", shelter.id)
      .order("updated_at", { ascending: false });
    animales = (data as Row[] | null) ?? [];
  }
  const shelterVerified = (shelter as { status?: string } | null)?.status === "verified";

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link
          href="/panel/animales/nueva"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("new")}
        </Link>
      </header>

      {/* Aviso de moderación (FEATURE-011): fichas despublicadas por un admin */}
      {animales
        .filter((a) => a.moderation_note)
        .map((a) => (
          <p
            key={`mod-${a.id}`}
            className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            <strong>{a.name}:</strong> {tm("avisoFichaModerada", { motivo: a.moderation_note ?? "" })}
          </p>
        ))}

      {animales.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border py-16 text-center">
          <PawPrint className="size-10 text-muted-foreground/60" aria-hidden="true" />
          <p className="text-muted-foreground">{t("empty")}</p>
          <Link
            href="/panel/animales/nueva"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("emptyCta")}
          </Link>
        </div>
      ) : (
        <AnimalesGrid animales={animales as AnimalGridRow[]} shelterVerified={shelterVerified} />
      )}
    </section>
  );
}
