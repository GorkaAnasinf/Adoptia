"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { comprimirFoto, esImagen, rutaMediaShelter } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";

export type ShelterMedia = { id: string; url: string; sort_order: number };

const BUCKET = "shelter-media";

function pathDesdeUrl(url: string): string | null {
  const marca = `/${BUCKET}/`;
  const i = url.indexOf(marca);
  return i === -1 ? null : url.slice(i + marca.length);
}

export function ShelterMediaUploader({
  shelterId,
  media,
  onChange,
}: {
  shelterId: string;
  media: ShelterMedia[];
  onChange: (m: ShelterMedia[]) => void;
}) {
  const t = useTranslations("perfil");
  const [error, setError] = useState<string>();
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError(undefined);
    setSubiendo(true);
    const supabase = createClient();
    const nuevos: ShelterMedia[] = [];
    try {
      let orden = media.length;
      for (const file of files) {
        if (!esImagen(file)) continue;
        const comprimido = await comprimirFoto(file);
        const ruta = rutaMediaShelter(shelterId, file);
        // Storage antes que la fila: si falla la subida, sin media huérfana.
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(ruta, comprimido, { contentType: comprimido.type || "image/jpeg" });
        if (upErr) {
          setError(t("errUpload"));
          continue;
        }
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(ruta);
        const { data: fila, error: insErr } = await supabase
          .from("shelter_media")
          .insert({ shelter_id: shelterId, type: "photo", url: pub.publicUrl, sort_order: orden })
          .select("id,url,sort_order")
          .single();
        if (insErr || !fila) {
          await supabase.storage.from(BUCKET).remove([ruta]);
          setError(t("errUpload"));
          continue;
        }
        nuevos.push(fila as ShelterMedia);
        orden += 1;
      }
      if (nuevos.length) onChange([...media, ...nuevos]);
    } finally {
      setSubiendo(false);
    }
  }

  async function borrar(m: ShelterMedia) {
    const supabase = createClient();
    const ruta = pathDesdeUrl(m.url);
    if (ruta) await supabase.storage.from(BUCKET).remove([ruta]);
    await supabase.from("shelter_media").delete().eq("id", m.id);
    onChange(media.filter((x) => x.id !== m.id));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-medium">{t("facilitiesTitle")}</span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          <ImagePlus className="size-4" aria-hidden="true" />
          {subiendo ? t("uploading") : t("addPhotos")}
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={onSelect} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {media.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((m) => (
            <li key={m.id} className="relative overflow-hidden rounded-xl border border-border">
              <Image
                src={m.url}
                alt=""
                width={200}
                height={150}
                className="aspect-4/3 w-full object-cover"
              />
              <button
                type="button"
                aria-label={t("deletePhoto")}
                title={t("deletePhoto")}
                onClick={() => borrar(m)}
                className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-lg bg-background/90 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
