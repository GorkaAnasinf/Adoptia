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
    <section className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">
          {t("registerTitle")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("registerSubtitle")}</p>
      </div>
      <RegisterForm />
      <div className="flex w-full max-w-md items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("orSeparator")}
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton />
      <p className="text-sm text-muted-foreground">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("loginTitle")}
        </Link>
      </p>
    </section>
  );
}
