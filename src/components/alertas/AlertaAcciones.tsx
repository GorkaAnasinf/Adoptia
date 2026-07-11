"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

/** Pausar/activar/eliminar una alerta (RLS: solo la dueña). */
export function AlertaAcciones({ alertaId, activa }: { alertaId: string; activa: boolean }) {
  const t = useTranslations("account");
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  async function alternar() {
    setEnviando(true);
    const supabase = createClient();
    await supabase.from("saved_searches").update({ active: !activa }).eq("id", alertaId);
    router.refresh();
  }

  async function borrar() {
    setEnviando(true);
    const supabase = createClient();
    await supabase.from("saved_searches").delete().eq("id", alertaId);
    router.refresh();
  }

  return (
    <span className="flex gap-2">
      <button
        type="button"
        onClick={alternar}
        disabled={enviando}
        className="rounded-full border border-border px-3 py-1 text-sm hover:bg-accent disabled:opacity-50"
      >
        {activa ? t("alertaPausar") : t("alertaActivar")}
      </button>
      <button
        type="button"
        onClick={borrar}
        disabled={enviando}
        className="rounded-full border border-destructive/40 px-3 py-1 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
      >
        {t("alertaBorrar")}
      </button>
    </span>
  );
}
