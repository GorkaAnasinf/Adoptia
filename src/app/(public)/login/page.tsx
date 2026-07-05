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
    <section className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16">
      <h1 className="font-heading text-3xl font-bold">{t("loginTitle")}</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
      <div className="flex w-full max-w-sm items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("orSeparator")}
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton />
      <p className="text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/registro" className="font-medium text-primary hover:underline">
          {t("registerTitle")}
        </Link>
      </p>
    </section>
  );
}
