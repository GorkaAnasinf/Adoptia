"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * CTA "Me interesa": sin sesión lleva al login con retorno; con sesión,
 * hasta FEATURE-007 (solicitudes) muestra un aviso de "próximamente".
 */
export function InterestButton({ slug }: { slug: string }) {
  const t = useTranslations("ficha");
  const router = useRouter();
  const [pronto, setPronto] = useState(false);

  const pulsar = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push(`/login?next=${encodeURIComponent(`/animales/${slug}`)}`);
      return;
    }
    setPronto(true);
  };

  return (
    <div className="flex flex-col items-stretch gap-2">
      <button
        type="button"
        onClick={pulsar}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-secondary px-6 py-2.5 font-semibold text-secondary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-secondary"
      >
        <Heart className="size-5" aria-hidden="true" />
        {t("interesa")}
      </button>
      {pronto && (
        <p role="status" className="text-center text-sm text-tertiary">
          {t("interesaPronto")}
        </p>
      )}
    </div>
  );
}
