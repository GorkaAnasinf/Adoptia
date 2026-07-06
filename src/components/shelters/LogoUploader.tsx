"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { comprimirLogo, esImagen, rutaLogo } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";

type Props = {
  // null = la fila del shelter aún no existe (borrador sin guardar): no se
  // puede subir porque la política de Storage exige la carpeta {shelter_id}/.
  shelterId: string | null;
  onUploaded: (url: string) => void;
  initialUrl?: string;
};

export function LogoUploader({ shelterId, onUploaded, initialUrl }: Props) {
  const t = useTranslations("onboarding");
  const [preview, setPreview] = useState<string | undefined>(initialUrl);
  const [error, setError] = useState<string>();
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !shelterId) return;
    setError(undefined);

    if (!esImagen(file)) {
      setError(t("logoNotImage"));
      return;
    }

    setSubiendo(true);
    try {
      const comprimido = await comprimirLogo(file);
      const ruta = rutaLogo(shelterId, file);
      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from("logos")
        .upload(ruta, comprimido, { upsert: true });
      if (upErr) {
        setError(t("errorGeneric"));
        return;
      }
      const { data } = supabase.storage.from("logos").getPublicUrl(ruta);
      setPreview(data.publicUrl);
      onUploaded(data.publicUrl);
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="logo-input">{t("logo")}</Label>
      <div className="flex items-center gap-3">
        {preview && (
          <Image
            src={preview}
            alt={t("logo")}
            width={64}
            height={64}
            className="size-16 rounded-full object-cover"
          />
        )}
        <input
          ref={inputRef}
          id="logo-input"
          type="file"
          accept="image/*"
          onChange={onSelect}
          disabled={!shelterId}
          className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-primary disabled:opacity-50"
        />
        {subiendo && <span className="text-sm text-muted-foreground">{t("saving")}</span>}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
