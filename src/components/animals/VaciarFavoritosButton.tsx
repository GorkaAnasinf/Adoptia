"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

/** Vacía todos los favoritos del adoptante de una vez (RLS: solo los suyos). */
export function VaciarFavoritosButton() {
  const t = useTranslations("account");
  const router = useRouter();
  const [borrando, setBorrando] = useState(false);

  async function vaciar() {
    if (!window.confirm(t("favoritosVaciarConfirm"))) return;
    setBorrando(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    await supabase.from("favorites").delete().eq("user_id", user.id);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={vaciar}
      disabled={borrando}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50 motion-safe:active:scale-95"
    >
      <Trash2 className="size-4" aria-hidden="true" />
      {t("favoritosVaciar")}
    </button>
  );
}
