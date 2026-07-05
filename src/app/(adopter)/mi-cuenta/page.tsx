import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("title") };
}

export default function MiCuentaPage() {
  const t = useTranslations("account");

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("placeholder")}</p>
    </section>
  );
}
