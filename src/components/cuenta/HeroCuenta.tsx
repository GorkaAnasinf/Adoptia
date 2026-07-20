import { PawPrint } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/** Bienvenida del área personal del adoptante (FEATURE-039). */
export function HeroCuenta({ nombre }: { nombre: string | null }) {
  const t = useTranslations("account");

  return (
    <section className="relative overflow-hidden rounded-2xl bg-secondary-container px-6 py-8 text-on-secondary-container shadow-soft sm:px-8 sm:py-10">
      <PawPrint
        className="pointer-events-none absolute -bottom-6 -right-6 size-48 text-on-secondary-container/10"
        aria-hidden="true"
        fill="currentColor"
      />
      <div className="relative max-w-xl">
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">
          {nombre ? t("saludo", { nombre }) : t("saludoSinNombre")}
        </h1>
        <p className="mt-3 text-base">{t("heroTexto")}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/animales"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:active:scale-95"
          >
            {t("heroCtaExplorar")}
          </Link>
          <Link
            href="/mi-cuenta/solicitudes"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-surface-container-lowest px-6 text-sm font-semibold text-on-secondary-container transition-colors hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:active:scale-95"
          >
            {t("heroCtaSolicitudes")}
          </Link>
        </div>
      </div>
    </section>
  );
}
