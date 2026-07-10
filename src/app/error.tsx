"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <span aria-hidden="true" className="text-7xl">
        🐾
      </span>
      <h1 className="font-heading text-3xl font-bold">{t("errorTitle")}</h1>
      <p className="max-w-md text-muted-foreground">{t("errorText")}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90"
        >
          {t("retry")}
        </button>
        <Link
          href="/"
          className="rounded-full border border-primary px-6 py-3 font-medium text-primary hover:bg-primary hover:text-primary-foreground"
        >
          {t("backHome")}
        </Link>
      </div>
    </main>
  );
}
