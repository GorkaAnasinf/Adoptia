import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
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
      <p className="text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/registro" className="font-medium text-primary hover:underline">
          {t("registerTitle")}
        </Link>
      </p>
    </section>
  );
}
