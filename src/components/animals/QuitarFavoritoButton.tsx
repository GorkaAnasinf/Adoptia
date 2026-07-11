"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

/** Quita un favorito desde la página de favoritos (RLS: solo el dueño). */
export function QuitarFavoritoButton({ animalId }: { animalId: string }) {
  const t = useTranslations("account");
  const router = useRouter();
  const [borrando, setBorrando] = useState(false);

  async function quitar() {
    setBorrando(true);
    const supabase = createClient();
    await supabase.from("favorites").delete().eq("animal_id", animalId);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={quitar}
      disabled={borrando}
      className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:bg-accent disabled:opacity-50"
    >
      {t("quitarFavorito")}
    </button>
  );
}
