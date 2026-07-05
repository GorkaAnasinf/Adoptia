import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("panel");
  return { title: t("title") };
}

export default function PanelPage() {
  const t = useTranslations("panel");

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("placeholder")}</p>
    </section>
  );
}
