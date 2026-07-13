"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

/**
 * CTA "Me interesa": sin sesión lleva al login con retorno a la ficha; con
 * sesión, abre el cuestionario de pre-adopción (FEATURE-007).
 */
export function InterestButton({ slug, full = false }: { slug: string; full?: boolean }) {
  const t = useTranslations("ficha");
  const router = useRouter();

  const pulsar = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push(`/login?next=${encodeURIComponent(`/animales/${slug}`)}`);
      return;
    }
    router.push(`/mi-cuenta/solicitudes/nueva/${slug}`);
  };

  return (
    <button
      type="button"
      onClick={pulsar}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-secondary px-6 py-2.5 font-semibold text-secondary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-secondary ${
        full ? "w-full" : ""
      }`}
    >
      <Heart className="size-5" aria-hidden="true" />
      {full ? t("interesaCta") : t("interesa")}
    </button>
  );
}
