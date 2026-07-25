"use client";

import { Check, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

/**
 * Confirmar / retirar asistencia a una jornada (FEATURE-062). Anónimo → enlace
 * a login. La escritura va directa por supabase-js amparada por RLS.
 */
export function RsvpButton({
  eventId,
  userId,
  asisteInicial,
}: {
  eventId: string;
  userId: string | null;
  asisteInicial: boolean;
}) {
  const t = useTranslations("jornadas");
  const router = useRouter();
  const [asiste, setAsiste] = useState(asisteInicial);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string>();

  if (!userId) {
    return (
      <Link
        href={`/login?next=/jornadas/${eventId}`}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        {t("confirmarLogin")}
      </Link>
    );
  }

  async function alternar() {
    setCargando(true);
    setError(undefined);
    const supabase = createClient();
    const { error: err } = asiste
      ? await supabase.from("event_attendees").delete().eq("event_id", eventId).eq("user_id", userId!)
      : await supabase.from("event_attendees").insert({ event_id: eventId, user_id: userId! });
    setCargando(false);
    if (err) {
      setError(t("rsvpError"));
      return;
    }
    setAsiste(!asiste);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={alternar}
        disabled={cargando}
        aria-pressed={asiste}
        className={
          asiste
            ? "inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/15 disabled:opacity-50"
            : "inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        }
      >
        {asiste ? (
          <>
            <Check className="size-4" aria-hidden="true" />
            {t("yaNoVoy")}
          </>
        ) : (
          <>
            <UserPlus className="size-4" aria-hidden="true" />
            {t("voyAIr")}
          </>
        )}
      </button>
      {error && <span className="text-center text-xs text-destructive">{error}</span>}
    </div>
  );
}
