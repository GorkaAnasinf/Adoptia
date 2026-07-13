"use client";

import { Bookmark, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

/**
 * Corazón de favorito (optimistic). Autocontenido: consulta sesión y estado
 * al montar; sin sesión, el clic lleva a /login.
 */
export function FavoritoButton({
  animalId,
  variant = "icon",
}: {
  animalId: string;
  variant?: "icon" | "wide";
}) {
  const t = useTranslations("ficha");
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [fav, setFav] = useState(false);

  useEffect(() => {
    let vivo = true;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!vivo || !user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("favorites")
        .select("animal_id")
        .eq("animal_id", animalId)
        .maybeSingle();
      if (vivo) setFav(Boolean(data));
    });
    return () => {
      vivo = false;
    };
  }, [animalId]);

  async function alternar() {
    if (!userId) {
      router.push("/login");
      return;
    }
    const supabase = createClient();
    const previo = fav;
    setFav(!previo); // optimistic
    const { error } = previo
      ? await supabase.from("favorites").delete().eq("user_id", userId).eq("animal_id", animalId)
      : await supabase.from("favorites").insert({ user_id: userId, animal_id: animalId });
    if (error) setFav(previo); // revierte si falla
  }

  const etiqueta = fav ? t("favQuitar") : t("favGuardar");

  if (variant === "wide") {
    const texto = fav ? t("favQuitar") : t("guardarLuego");
    return (
      <button
        type="button"
        onClick={alternar}
        aria-pressed={fav}
        className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors ${
          fav
            ? "border-rose-300 bg-rose-50 text-rose-600"
            : "border-input bg-card text-foreground hover:border-primary/50"
        }`}
      >
        <Bookmark className={`size-5 ${fav ? "fill-current" : ""}`} aria-hidden="true" />
        {texto}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={fav}
      aria-label={etiqueta}
      title={etiqueta}
      className={`flex size-11 items-center justify-center rounded-full border transition-colors ${
        fav
          ? "border-rose-300 bg-rose-50 text-rose-600"
          : "border-border bg-card text-muted-foreground hover:border-rose-300 hover:text-rose-600"
      }`}
    >
      <Heart className={`size-5 ${fav ? "fill-current" : ""}`} aria-hidden="true" />
    </button>
  );
}
