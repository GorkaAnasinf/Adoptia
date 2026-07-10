import { PawPrint } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

/** Estado vacío del mapa: ninguna protectora verificada en la zona/filtros actuales. */
export function MapaVacio() {
  const t = useTranslations("mapa");
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-black/5">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
        <PawPrint className="size-7 text-primary" aria-hidden="true" />
      </div>
      <h2 className="font-heading text-lg font-semibold text-foreground">{t("vacioTitulo")}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{t("vacioTexto")}</p>
      <Link
        href="/registro"
        className="mt-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:opacity-90"
      >
        {t("vacioCta")}
      </Link>
    </div>
  );
}
