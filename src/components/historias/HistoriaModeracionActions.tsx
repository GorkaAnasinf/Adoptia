"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * La protectora dueña modera un testimonio (FEATURE-059). Aprobar lo publica
 * (status=approved + published_at); rechazar lo oculta. RLS solo deja moderar
 * las historias de su propio refugio.
 */
export function HistoriaModeracionActions({ historiaId }: { historiaId: string }) {
  const t = useTranslations("historias");
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(false);

  async function moderar(status: "approved" | "rejected") {
    setGuardando(true);
    setError(false);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("adoption_stories")
      .update({
        status,
        published_at: status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", historiaId);
    setGuardando(false);
    if (err) {
      setError(true);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={guardando}
        onClick={() => moderar("approved")}
        className="rounded-full bg-tertiary px-4 py-1.5 text-sm font-semibold text-tertiary-foreground hover:bg-tertiary/90 disabled:opacity-50"
      >
        {t("aprobar")}
      </button>
      <button
        type="button"
        disabled={guardando}
        onClick={() => moderar("rejected")}
        className="rounded-full border border-border px-4 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
      >
        {t("rechazar")}
      </button>
      {error && <span className="text-xs text-destructive">{t("errorModerar")}</span>}
    </div>
  );
}
