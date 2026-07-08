import { useTranslations } from "next-intl";
import type { AnimalStatus } from "@/lib/schemas/animal";
import { cn } from "@/lib/utils";

const ESTILOS: Record<AnimalStatus, string> = {
  available: "border-tertiary/40 bg-tertiary/10 text-tertiary",
  reserved: "border-amber-300 bg-amber-50 text-amber-800",
  adopted: "border-primary/40 bg-primary/10 text-primary",
  fostered: "border-sky-300 bg-sky-50 text-sky-800",
  not_listed: "border-muted-foreground/30 bg-muted text-muted-foreground",
};

const CLAVE: Record<AnimalStatus, string> = {
  available: "statusAvailable",
  reserved: "statusReserved",
  adopted: "statusAdopted",
  fostered: "statusFostered",
  not_listed: "statusNot_listed",
};

export function AnimalStatusBadge({ status }: { status: AnimalStatus }) {
  const t = useTranslations("animales");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        ESTILOS[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {t(CLAVE[status])}
    </span>
  );
}
