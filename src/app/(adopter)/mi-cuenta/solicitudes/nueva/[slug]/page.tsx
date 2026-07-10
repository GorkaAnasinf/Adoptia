import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SolicitudWizard } from "@/components/solicitudes/SolicitudWizard";
import { createClient } from "@/lib/supabase/server";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const t = await getTranslations("solicitud");
  return { title: t("title") };
}

export default async function NuevaSolicitudPage({ params }: { params: Params }) {
  const { slug } = await params;
  const t = await getTranslations("solicitud");

  const supabase = await createClient();
  const { data: animal } = await supabase
    .from("animals")
    .select("id, name, status")
    .eq("slug", slug)
    .maybeSingle();

  if (!animal) {
    notFound();
  }

  if (animal.status !== "available") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("notAvailableTitle")}</h1>
        <p className="text-muted-foreground">{t("notAvailableBody")}</p>
        <Link
          href="/animales"
          className="inline-flex min-h-11 items-center rounded-full bg-secondary px-6 text-sm font-semibold text-secondary-foreground hover:opacity-90"
        >
          {t("browseAnimals")}
        </Link>
      </div>
    );
  }

  return <SolicitudWizard animalId={animal.id} animalSlug={slug} animalName={animal.name} />;
}
