import { Heart } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("title") };
}

export default function MiCuentaPage() {
  const t = useTranslations("account");

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>

      <div className="mt-8 flex flex-col items-center rounded-2xl border border-border bg-card px-6 py-14 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Heart className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-heading text-xl font-semibold">{t("emptyTitle")}</h2>
        <p className="mt-2 max-w-md text-muted-foreground">{t("emptyText")}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/mi-cuenta/solicitudes"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-secondary px-6 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t("solicitudesLink")}
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-primary px-6 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t("emptyCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
