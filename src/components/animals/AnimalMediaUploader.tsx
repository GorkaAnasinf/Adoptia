"use client";

import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { comprimirFoto, esImagen, rutaFoto } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type Media = { id: string; url: string; is_cover: boolean; sort_order: number };

const BUCKET = "animal-media";

function pathDesdeUrl(url: string): string | null {
  const marca = `/${BUCKET}/`;
  const i = url.indexOf(marca);
  return i === -1 ? null : url.slice(i + marca.length);
}

export function AnimalMediaUploader({
  shelterId,
  animalId,
  media,
  onChange,
}: {
  // null = la ficha aún no se ha guardado: no se puede subir (la política de
  // Storage exige la carpeta {shelterId}/, y necesitamos el animalId).
  shelterId: string | null;
  animalId: string | null;
  media: Media[];
  onChange: (m: Media[]) => void;
}) {
  const t = useTranslations("animales");
  const [error, setError] = useState<string>();
  const [subiendo, setSubiendo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const bloqueado = !shelterId || !animalId;

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0 || !shelterId || !animalId) return;
    setError(undefined);
    setSubiendo(true);
    const supabase = createClient();
    const nuevos: Media[] = [];
    try {
      let orden = media.length;
      for (const file of files) {
        if (!esImagen(file)) {
          setError(t("errNotImage"));
          continue;
        }
        const comprimido = await comprimirFoto(file);
        const ruta = rutaFoto(shelterId, animalId, file);
        // Orden importa: primero Storage, luego la fila. Si la subida falla,
        // no se crea fila → sin media huérfana referenciada.
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(ruta, comprimido, { contentType: comprimido.type || "image/jpeg" });
        if (upErr) {
          setError(t("errUpload"));
          continue;
        }
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(ruta);
        const esPrimera = media.length === 0 && nuevos.length === 0;
        const { data: fila, error: insErr } = await supabase
          .from("animal_media")
          .insert({
            animal_id: animalId,
            type: "photo",
            url: pub.publicUrl,
            is_cover: esPrimera,
            sort_order: orden,
          })
          .select("id,url,is_cover,sort_order")
          .single();
        if (insErr || !fila) {
          await supabase.storage.from(BUCKET).remove([ruta]); // limpia el huérfano
          setError(t("errUpload"));
          continue;
        }
        nuevos.push(fila as Media);
        orden += 1;
      }
      if (nuevos.length) onChange([...media, ...nuevos]);
    } finally {
      setSubiendo(false);
    }
  }

  async function marcarPortada(id: string) {
    const supabase = createClient();
    // El índice único parcial exige limpiar la portada previa antes de fijar la nueva.
    await supabase.from("animal_media").update({ is_cover: false }).eq("animal_id", animalId);
    await supabase.from("animal_media").update({ is_cover: true }).eq("id", id);
    onChange(media.map((m) => ({ ...m, is_cover: m.id === id })));
  }

  async function borrar(m: Media) {
    const supabase = createClient();
    const ruta = pathDesdeUrl(m.url);
    if (ruta) await supabase.storage.from(BUCKET).remove([ruta]);
    await supabase.from("animal_media").delete().eq("id", m.id);
    let resto = media.filter((x) => x.id !== m.id);
    // Si borramos la portada, ascendemos la primera restante.
    if (m.is_cover && resto.length > 0 && !resto.some((x) => x.is_cover)) {
      const primera = resto[0];
      await supabase.from("animal_media").update({ is_cover: true }).eq("id", primera.id);
      resto = resto.map((x) => (x.id === primera.id ? { ...x, is_cover: true } : x));
    }
    onChange(resto);
  }

  async function mover(index: number, delta: number) {
    const destino = index + delta;
    if (destino < 0 || destino >= media.length) return;
    const supabase = createClient();
    const a = media[index];
    const b = media[destino];
    await supabase.from("animal_media").update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from("animal_media").update({ sort_order: a.sort_order }).eq("id", b.id);
    const copia = [...media];
    copia[index] = { ...b, sort_order: a.sort_order };
    copia[destino] = { ...a, sort_order: b.sort_order };
    copia.sort((x, y) => x.sort_order - y.sort_order);
    onChange(copia);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t("photos")}</span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={bloqueado || subiendo}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          <ImagePlus className="size-4" aria-hidden="true" />
          {subiendo ? t("uploading") : t("addPhotos")}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={onSelect}
        />
      </div>

      {bloqueado && <p className="text-sm text-muted-foreground">{t("saveFirst")}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {media.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.map((m, i) => (
            <li key={m.id} className="group relative overflow-hidden rounded-xl border border-border">
              <Image
                src={m.url}
                alt=""
                width={200}
                height={150}
                className="aspect-[4/3] w-full object-cover"
              />
              {m.is_cover && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-tertiary px-2 py-0.5 text-xs font-semibold text-tertiary-foreground">
                  <Star className="size-3 fill-current" aria-hidden="true" />
                  {t("cover")}
                </span>
              )}
              <div className="flex items-center justify-between gap-1 p-1.5">
                <div className="flex gap-1">
                  <IconBtn label={t("moveUp")} onClick={() => mover(i, -1)} disabled={i === 0}>
                    <ArrowUp className="size-4" />
                  </IconBtn>
                  <IconBtn label={t("moveDown")} onClick={() => mover(i, 1)} disabled={i === media.length - 1}>
                    <ArrowDown className="size-4" />
                  </IconBtn>
                </div>
                <div className="flex gap-1">
                  <IconBtn label={t("makeCover")} onClick={() => marcarPortada(m.id)} disabled={m.is_cover}>
                    <Star className="size-4" />
                  </IconBtn>
                  <IconBtn label={t("deletePhoto")} onClick={() => borrar(m)} destructivo>
                    <Trash2 className="size-4" />
                  </IconBtn>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  destructivo,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructivo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg hover:bg-accent disabled:opacity-40",
        destructivo && "text-destructive hover:bg-destructive/10",
      )}
    >
      {children}
    </button>
  );
}
