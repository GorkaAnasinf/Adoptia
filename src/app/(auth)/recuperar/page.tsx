import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { RecoverForm } from "@/components/forms/RecoverForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("recoverTitle") };
}

export default function RecuperarPage() {
  const t = useTranslations("auth");

  return (
    <section className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold">{t("recoverTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("recoverSubtitle")}</p>
      </div>
      <RecoverForm />
      <Link href="/login" className="text-sm font-medium text-primary hover:underline">
        {t("backToLogin")}
      </Link>
    </section>
  );
}
