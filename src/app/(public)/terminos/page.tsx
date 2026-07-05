import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return { title: t("termsTitle") };
}

export default function TerminosPage() {
  const t = useTranslations("legal");

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-heading text-3xl font-bold">{t("termsTitle")}</h1>
      <p className="mt-4 text-muted-foreground">{t("placeholder")}</p>
    </section>
  );
}
