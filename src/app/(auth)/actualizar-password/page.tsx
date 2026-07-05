import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { NewPasswordForm } from "@/components/forms/NewPasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("newPasswordTitle") };
}

export default function ActualizarPasswordPage() {
  const t = useTranslations("auth");

  return (
    <section className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16">
      <h1 className="font-heading text-3xl font-bold">{t("newPasswordTitle")}</h1>
      <NewPasswordForm />
    </section>
  );
}
