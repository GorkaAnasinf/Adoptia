import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type ShelterStatus = "verified" | "pending" | "suspended";

const ESTILOS: Record<ShelterStatus, string> = {
  verified: "border-tertiary/40 bg-tertiary/10 text-tertiary",
  pending: "border-amber-300 bg-amber-50 text-amber-800",
  suspended: "border-destructive/40 bg-destructive/10 text-destructive",
};

const CLAVE: Record<ShelterStatus, string> = {
  verified: "statusVerified",
  pending: "statusPending",
  suspended: "statusSuspended",
};

export function StatusBadge({ status }: { status: ShelterStatus | null }) {
  const t = useTranslations("shell");
  if (!status) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
        ESTILOS[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {t(CLAVE[status])}
    </span>
  );
}
