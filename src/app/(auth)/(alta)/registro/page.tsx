import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { GoogleButton } from "@/components/forms/GoogleButton";
import { RegisterForm } from "@/components/forms/RegisterForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("registerTitle") };
}

export default function RegistroPage() {
  const t = useTranslations("auth");

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          {t("registerTitle")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("registerSubtitle")}</p>
      </div>

      <RegisterForm />

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("orSeparator")}
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton />

      <p className="text-center text-sm text-muted-foreground">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          {t("loginTitle")}
        </Link>
      </p>
    </div>
  );
}
