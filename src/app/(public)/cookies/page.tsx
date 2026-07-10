import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { LegalArticle } from "@/components/legal/LegalArticle";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return { title: t("cookiesTitle") };
}

export default function CookiesPage() {
  const t = useTranslations("legal");

  return (
    <LegalArticle
      titulo={t("cookiesTitle")}
      intro={t("cookiesPage.intro")}
      secciones={["cookiesPage.s1", "cookiesPage.s2", "cookiesPage.s3"]}
    />
  );
}
