import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { LegalArticle } from "@/components/legal/LegalArticle";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return { title: t("noticeTitle") };
}

export default function AvisoLegalPage() {
  const t = useTranslations("legal");

  return (
    <LegalArticle
      titulo={t("noticeTitle")}
      secciones={["notice.s1", "notice.s2", "notice.s3", "notice.s4"]}
    />
  );
}
