import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { GoogleButton } from "@/components/forms/GoogleButton";
import { LoginForm } from "@/components/forms/LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("loginTitle") };
}

export default function LoginPage() {
  const t = useTranslations("auth");

  return (
    <div className="flex w-full max-w-md flex-col gap-8">
      <div>
        <h1 className="font-heading text-4xl font-bold text-foreground">
          {t("loginWelcome")}
        </h1>
        <p className="mt-3 text-muted-foreground">{t("loginSubtitle")}</p>
      </div>

      <Suspense>
        <LoginForm />
      </Suspense>

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("orSeparator")}
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton />

      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/registro" className="font-semibold text-primary hover:underline">
          {t("registerTitle")}
        </Link>
      </p>
    </div>
  );
}
