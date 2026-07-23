"use client";

import { ImagePlus, PawPrint, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { comprimirFoto, esImagen, rutaHistoria } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";

/**
 * El adoptante comparte su historia sobre un animal adoptado (FEATURE-059).
 * Frase + foto opcional (se sube a `story-media`) + consentimiento RGPD. Nace
 * pendiente: la protectora dueña la modera.
 */
export function CompartirHistoriaDialog({
  animalId,
  userId,
  animalName,
}: {
  animalId: string;
  userId: string;
  animalName: string;
}) {
  const t = useTranslations("historias");
  const router = useRouter();
  const inputFoto = useRef<HTMLInputElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [quote, setQuote] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok">("idle");
  const [error, setError] = useState<string>();

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    if (quote.trim().length < 10) {
      setError(t("errorFrase"));
      return;
    }
    if (!consent) {
      setError(t("errorConsent"));
      return;
    }
    setError(undefined);
    setEstado("enviando");
    try {
      let photoUrl: string | undefined;
      if (foto) {
        const supabase = createClient();
        const comprimida = await comprimirFoto(foto);
        const ruta = rutaHistoria(userId, foto);
        const { error: errUp } = await supabase.storage
          .from("story-media")
          .upload(ruta, comprimida, { upsert: false });
        if (errUp) {
          setError(t("errorFoto"));
          setEstado("idle");
          return;
        }
        photoUrl = supabase.storage.from("story-media").getPublicUrl(ruta).data.publicUrl;
      }

      const res = await fetch("/api/historias", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          animal_id: animalId,
          quote: quote.trim(),
          consent: true,
          ...(photoUrl ? { photo_url: photoUrl } : {}),
        }),
      });
      if (res.ok) {
        setEstado("ok");
        router.refresh();
        return;
      }
      const cuerpo = (await res.json().catch(() => null)) as { error?: { code?: string } } | null;
      setError(cuerpo?.error?.code === "story_exists" ? t("errorExiste") : t("errorGenerico"));
      setEstado("idle");
    } catch {
      setError(t("errorGenerico"));
      setEstado("idle");
    }
  }

  if (estado === "ok") {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-tertiary">
        <Sparkles className="size-4" aria-hidden="true" />
        {t("enviada")}
      </span>
    );
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Sparkles className="size-4" aria-hidden="true" />
        {t("compartir")}
      </button>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 rounded-2xl bg-surface-container-low p-4">
      <p className="text-sm font-semibold">{t("dialogoTitulo", { animal: animalName })}</p>

      <label className="flex flex-col gap-1 text-sm font-medium">
        {t("fraseLabel")}
        <textarea
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          rows={4}
          maxLength={600}
          placeholder={t("frasePlaceholder")}
          className="rounded-lg border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{t("fotoLabel")}</span>
        <input
          ref={inputFoto}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f && esImagen(f)) setFoto(f);
          }}
        />
        <button
          type="button"
          onClick={() => inputFoto.current?.click()}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm hover:bg-accent/50"
        >
          {foto ? <PawPrint className="size-4" aria-hidden="true" /> : <ImagePlus className="size-4" aria-hidden="true" />}
          {foto ? foto.name : t("fotoBoton")}
        </button>
        <span className="text-xs text-muted-foreground">{t("fotoAyuda")}</span>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 size-4 accent-primary"
        />
        <span>{t("consent")}</span>
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={estado === "enviando"}
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {estado === "enviando" ? t("enviando") : t("enviar")}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="rounded-full border border-border px-4 py-1.5 text-sm hover:bg-accent"
        >
          {t("cancelar")}
        </button>
      </div>
    </form>
  );
}
