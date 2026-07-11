"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/** La protectora propone una acogida: el aviso llega al acogedor por email. */
export function ContactarAcogedorButton({ fosterUserId }: { fosterUserId: string }) {
  const t = useTranslations("acogida");
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "error">("idle");

  async function contactar() {
    setEstado("enviando");
    try {
      const res = await fetch("/api/acogida/contactar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ foster_user_id: fosterUserId }),
      });
      setEstado(res.ok ? "ok" : "error");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "ok") {
    return <span className="text-sm font-medium text-secondary">{t("contactado")}</span>;
  }

  return (
    <span className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={contactar}
        disabled={estado === "enviando"}
        className="rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
      >
        {t("contactar")}
      </button>
      {estado === "error" && <span className="text-xs text-destructive">{t("errorContactar")}</span>}
    </span>
  );
}
