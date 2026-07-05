import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/components/forms/RegisterForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("registerTitle") };
}

export default function RegistroPage() {
  const t = useTranslations("auth");

  return (
    <section className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16">
      <h1 className="font-heading text-3xl font-bold">{t("registerTitle")}</h1>
      <RegisterForm />
      <p className="text-sm text-muted-foreground">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("loginTitle")}
        </Link>
      </p>
    </section>
  );
}
