"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { comprimirFoto, esImagen, rutaPortada } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";

/**
 * Subida de la foto de portada del perfil público (FEATURE-028).
 * Comprime como foto (panorámica, ≤300 KB) y sobreescribe
 * `{shelterId}/cover.{ext}` en el bucket `shelter-media`.
 */
export function CoverUploader({
  shelterId,
  onChange,
  initialUrl,
}: {
  shelterId: string;
  onChange: (url: string | null) => void;
  initialUrl?: string;
}) {
  const t = useTranslations("perfil");
  const [preview, setPreview] = useState<string | undefined>(initialUrl);
  const [error, setError] = useState<string>();
  const [subiendo, setSubiendo] = useState(false);

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(undefined);

    if (!esImagen(file)) {
      setError(t("coverNotImage"));
      return;
    }

    setSubiendo(true);
    try {
      const comprimido = await comprimirFoto(file);
      const ruta = rutaPortada(shelterId, file);
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from("shelter-media")
        .upload(ruta, comprimido, { upsert: true });
      if (upErr) {
        setError(t("errUpload"));
        return;
      }
      const { data } = supabase.storage.from("shelter-media").getPublicUrl(ruta);
      setPreview(data.publicUrl);
      onChange(data.publicUrl);
    } catch {
      setError(t("errUpload"));
    } finally {
      setSubiendo(false);
    }
  }

  function quitar() {
    setPreview(undefined);
    onChange(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="cover-input">{t("cover")}</Label>
      {preview && (
        <div className="relative overflow-hidden rounded-xl border border-border">
          <Image
            src={preview}
            alt={t("cover")}
            width={640}
            height={214}
            className="aspect-[3/1] w-full object-cover"
          />
        </div>
      )}
      <div className="flex items-center gap-3">
        <input
          id="cover-input"
          type="file"
          accept="image/*"
          onChange={onSelect}
          className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-primary"
        />
        {preview && (
          <Button type="button" variant="outline" size="sm" onClick={quitar}>
            {t("coverRemove")}
          </Button>
        )}
        {subiendo && <span className="text-sm text-muted-foreground">{t("saving")}</span>}
      </div>
      <p className="text-xs text-muted-foreground">{t("coverHelp")}</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
