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

// Variante para sobre foto: fondo sólido de color + texto blanco + sombra, para
// que el estado no se pierda contra el fondo de la imagen del animal.
const ESTILOS_IMAGEN: Record<AnimalStatus, string> = {
  available: "bg-tertiary text-white",
  reserved: "bg-amber-500 text-white",
  adopted: "bg-primary text-white",
  fostered: "bg-sky-600 text-white",
  not_listed: "bg-stone-600 text-white",
};

const CLAVE: Record<AnimalStatus, string> = {
  available: "statusAvailable",
  reserved: "statusReserved",
  adopted: "statusAdopted",
  fostered: "statusFostered",
  not_listed: "statusNot_listed",
};

export function AnimalStatusBadge({ status, onImage = false }: { status: AnimalStatus; onImage?: boolean }) {
  const t = useTranslations("animales");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        onImage ? cn(ESTILOS_IMAGEN[status], "shadow-sm") : cn("border", ESTILOS[status]),
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {t(CLAVE[status])}
    </span>
  );
}
