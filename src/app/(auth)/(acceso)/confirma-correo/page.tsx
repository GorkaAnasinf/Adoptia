import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("confirmTitle") };
}

export default function ConfirmaCorreoPage() {
  const t = useTranslations("auth");

  return (
    <div className="flex w-full max-w-md flex-col gap-6 text-center">
      <h1 className="font-heading text-3xl font-bold text-foreground">
        {t("confirmTitle")}
      </h1>
      <p className="text-muted-foreground">{t("confirmBody")}</p>
      <p className="text-sm text-muted-foreground">{t("confirmSpam")}</p>
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </div>
  );
}
