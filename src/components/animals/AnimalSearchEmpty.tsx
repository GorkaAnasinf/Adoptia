import { useTranslations } from "next-intl";
import { PawPrint } from "lucide-react";
import { CrearAlertaButton } from "@/components/alertas/CrearAlertaButton";
import type { AnimalSearch } from "@/lib/animal-search";

/** Estado vacío del listado público, con creación de alerta (FEATURE-010). */
export function AnimalSearchEmpty({ search }: { search: AnimalSearch }) {
  const t = useTranslations("busqueda");
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-black/5">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
        <PawPrint className="size-7 text-primary" aria-hidden="true" />
      </div>
      <h2 className="font-heading text-lg font-semibold text-foreground">{t("vacioTitulo")}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{t("vacioTexto")}</p>
      <CrearAlertaButton search={search} />
    </div>
  );
}
