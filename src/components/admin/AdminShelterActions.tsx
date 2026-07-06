"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function AdminShelterActions({ shelterId }: { shelterId: string }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string>();

  async function llamar(body: Record<string, unknown>) {
    setEnviando(true);
    setError(undefined);
    try {
      const res = await fetch(`/api/admin/protectoras/${shelterId}/verificar`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(t("actionError"));
        return;
      }
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  if (rechazando) {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={`motivo-${shelterId}`}>{t("rejectReason")}</Label>
        <textarea
          id={`motivo-${shelterId}`}
          rows={2}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder={t("rejectReasonPlaceholder")}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={enviando}
            onClick={() => {
              if (motivo.trim().length === 0) return;
              llamar({ accion: "reject", motivo: motivo.trim() });
            }}
          >
            {t("rejectConfirm")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setRechazando(false)}>
            {t("cancel")}
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={enviando}
          onClick={() => llamar({ accion: "verify" })}
        >
          {t("verify")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setRechazando(true)}>
          {t("reject")}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
