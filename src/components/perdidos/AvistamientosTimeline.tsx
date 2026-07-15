"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { esImagenValida } from "@/lib/animal-search";
import { createClient } from "@/lib/supabase/client";
import type { Avistamiento } from "./tipos";

/**
 * Pistas de vecinos, de la más reciente a la más antigua. El autor del aviso
 * puede borrar spam de su ficha (RLS lo permite solo a él y al que reportó).
 */
export function AvistamientosTimeline({
  avistamientos,
  puedeBorrar = false,
}: {
  avistamientos: Avistamiento[];
  puedeBorrar?: boolean;
}) {
  const t = useTranslations("perdidos");
  const format = useFormatter();
  const router = useRouter();
  const [error, setError] = useState(false);

  async function borrar(id: string) {
    setError(false);
    const supabase = createClient();
    const { error: err } = await supabase.from("lost_found_sightings").delete().eq("id", id);
    if (err) {
      setError(true);
      return;
    }
    router.refresh();
  }

  if (avistamientos.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("avistamientosVacio")}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{t("avistamientoBorrarError")}</p>}
      <ol className="flex flex-col gap-4">
        {avistamientos.map((a) => (
          <li key={a.id} className="flex gap-3 rounded-2xl bg-muted/40 px-4 py-3">
            {esImagenValida(a.photo_url) && (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={a.photo_url!} alt="" fill sizes="64px" className="object-cover" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {t("avistamientoVistoEl", {
                  fecha: format.dateTime(new Date(a.seen_at), {
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                })}
              </p>
              {a.note && <p className="mt-1 whitespace-pre-line text-sm">{a.note}</p>}
            </div>
            {puedeBorrar && (
              <button
                type="button"
                onClick={() => borrar(a.id)}
                className="self-start text-xs text-muted-foreground underline-offset-4 hover:text-destructive hover:underline"
              >
                {t("avistamientoBorrar")}
              </button>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
