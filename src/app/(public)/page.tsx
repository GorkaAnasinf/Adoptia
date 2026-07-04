import Link from "next/link";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations();

  return (
    <section className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24">
      <h1 className="font-heading text-4xl font-bold text-foreground sm:text-5xl">
        {t("home.title")}
      </h1>
      <p className="max-w-2xl text-lg text-muted-foreground">
        {t("home.subtitle")}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/animales"
          className="rounded-full bg-secondary px-6 py-3 font-medium text-secondary-foreground hover:opacity-90"
        >
          {t("home.cta")}
        </Link>
        <Link
          href="/protectoras/alta"
          className="rounded-full border border-primary px-6 py-3 font-medium text-primary hover:bg-primary hover:text-primary-foreground"
        >
          {t("home.ctaShelters")}
        </Link>
      </div>
    </section>
  );
}
