import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { LegalArticle } from "@/components/legal/LegalArticle";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return { title: t("termsTitle") };
}

export default function TerminosPage() {
  const t = useTranslations("legal");

  return (
    <LegalArticle
      titulo={t("termsTitle")}
      secciones={["terms.s1", "terms.s2", "terms.s3", "terms.s4"]}
    />
  );
}
