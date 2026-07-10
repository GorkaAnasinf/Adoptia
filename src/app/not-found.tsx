import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("errors");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <span aria-hidden="true" className="text-7xl">
        🐾
      </span>
      <h1 className="font-heading text-3xl font-bold">{t("notFoundTitle")}</h1>
      <p className="max-w-md text-muted-foreground">{t("notFoundText")}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/animales"
          className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90"
        >
          {t("seeAnimals")}
        </Link>
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
