"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MapPinPicker } from "@/components/shelters/MapPinPicker";
import { comprimirFoto, esImagen } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";

type Coords = { lat: number; lng: number };

/** Valor inicial de `datetime-local`: ahora, en hora local del navegador. */
function ahoraLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

/**
 * "He visto a este animal": pin + cuándo + nota + foto. Pensado para rellenarse
 * en la calle, con el animal a la vista. La coordenada la redondea BD (~200 m).
 */
export function NuevoAvistamientoForm({ avisoId, userId }: { avisoId: string; userId?: string }) {
  const t = useTranslations("perdidos");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [abierto, setAbierto] = useState(false);
  const [pin, setPin] = useState<Coords | null>(null);
  const [cuando, setCuando] = useState(ahoraLocal());
  const [nota, setNota] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok">("idle");
  const [error, setError] = useState<string>();

  async function subirFoto(): Promise<string | null> {
    if (!foto || !esImagen(foto) || !userId) return null;
    const comprimido = await comprimirFoto(foto);
    const supabase = createClient();
    const ruta = `${userId}/${crypto.randomUUID()}-${foto.name.replace(/[^\w.-]/g, "_")}`;
    const { error: upErr } = await supabase.storage
      .from("lost-found")
      .upload(ruta, comprimido, { contentType: comprimido.type || "image/jpeg" });
    if (upErr) return null;
    return supabase.storage.from("lost-found").getPublicUrl(ruta).data.publicUrl;
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!pin) {
      setError(t("avistamientoFaltaPin"));
      return;
    }
    if (!cuando) {
      setError(t("avistamientoFaltaFecha"));
      return;
    }
    const visto = new Date(cuando);
    if (visto.getTime() > Date.now() + 300_000) {
      setError(t("avistamientoFechaFutura"));
      return;
    }
    setError(undefined);
    setEstado("enviando");

    try {
      const photoUrl = await subirFoto();
      const res = await fetch(`/api/perdidos/${avisoId}/avistamientos`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lat: pin.lat,
          lng: pin.lng,
          seen_at: visto.toISOString(),
          nota: nota.trim() || undefined,
          photo_url: photoUrl ?? undefined,
        }),
      });
      if (!res.ok) {
        setError(res.status === 429 ? t("avistamientoLimite") : t("avistamientoError"));
        setEstado("idle");
        return;
      }
      setEstado("ok");
      router.refresh();
    } catch {
      setError(t("avistamientoError"));
      setEstado("idle");
    }
  }

  if (estado === "ok") {
    return (
      <p className="rounded-2xl bg-emerald-50 px-5 py-4 text-emerald-900">{t("avistamientoOk")}</p>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        {t("avistamiento")}
      </button>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4 rounded-2xl border border-border p-5">
      <h3 className="font-heading font-semibold">{t("avistamientoTitulo")}</h3>

      <label className="flex flex-col gap-1 text-sm font-medium">
        {t("avistamientoCuando")}
        {/* Sin `max`: el bloqueo nativo del navegador corta el submit con un
            aviso sin traducir. Validamos aquí (y en el servidor). */}
        <input
          type="datetime-local"
          value={cuando}
          onChange={(e) => setCuando(e.target.value)}
          className="rounded-lg border border-input bg-white px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        {t("avistamientoNota")}
        <textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder={t("avistamientoNotaHelp")}
          className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
        />
      </label>

      <div className="flex flex-col gap-1 text-sm font-medium">
        {t("avistamientoFoto")}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-border bg-card px-3 py-2 text-left hover:bg-accent"
        >
          {foto ? foto.name : t("fFotoSubir")}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">{t("avistamientoPin")}</p>
        <MapPinPicker value={pin ?? { lat: 40.4168, lng: -3.7038 }} onChange={setPin} />
        <p className="text-xs text-muted-foreground">{t("avistamientoPinHelp")}</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={estado === "enviando"}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {estado === "enviando" ? t("avistamientoEnviando") : t("avistamientoEnviar")}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-full border border-border px-5 py-2.5 text-sm hover:bg-accent"
        >
          {t("avistamientoCancelar")}
        </button>
      </div>
    </form>
  );
}
