"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

/** El autor resuelve su aviso, con mini-historia opcional (RLS: solo él). */
export function ResolverAvisoButton({ avisoId }: { avisoId: string }) {
  const t = useTranslations("perdidos");
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [historia, setHistoria] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(false);

  async function resolver() {
    setEnviando(true);
    setError(false);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("lost_found_posts")
      .update({ status: "resolved", resolution_story: historia.trim() || null })
      .eq("id", avisoId);
    setEnviando(false);
    if (err) {
      setError(true);
      return;
    }
    router.refresh();
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-full bg-secondary px-5 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90"
      >
        {t("resolver")}
      </button>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <label className="text-sm font-medium" htmlFor={`historia-${avisoId}`}>
        {t("resolverHistoria")}
      </label>
      <textarea
        id={`historia-${avisoId}`}
        value={historia}
        onChange={(e) => setHistoria(e.target.value)}
        rows={3}
        maxLength={2000}
        className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
      />
      {error && <p className="text-xs text-destructive">{t("errResolver")}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={resolver}
          disabled={enviando}
          className="rounded-full bg-secondary px-5 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
        >
          {t("resolverConfirmar")}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-full border border-border px-5 py-2 text-sm hover:bg-accent"
        >
          {t("resolverCancelar")}
        </button>
      </div>
    </div>
  );
}
