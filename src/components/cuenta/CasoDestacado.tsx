import { PawPrint } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { esImagenValida } from "@/lib/animal-search";

export type AnimalDestacado = {
  name: string;
  slug: string;
  published_at: string;
  foto: string | null;
};

/**
 * Animal que más tiempo lleva publicado sin encontrar hogar (FEATURE-039).
 *
 * El wireframe lo llamaba «caso urgente», pero no hay campo de urgencia en el
 * modelo: la etiqueta cuenta lo que sí sabemos, los días de espera.
 */
export function CasoDestacado({ animal }: { animal: AnimalDestacado | null }) {
  const t = useTranslations("account");
  if (!animal) return null;

  const dias = Math.max(1, Math.floor((Date.now() - new Date(animal.published_at).getTime()) / 86_400_000));
  const foto = esImagenValida(animal.foto) ? animal.foto : null;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="relative aspect-[4/3] w-full bg-surface-container">
        {foto ? (
          <Image src={foto} alt={animal.name} fill sizes="(max-width: 1024px) 100vw, 20rem" className="object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-muted-foreground">
            <PawPrint className="size-10" aria-hidden="true" />
          </span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          {t("destacadoBadge")}
        </span>
      </div>
      <div className="p-5">
        <h2 className="font-heading text-lg font-semibold">{t("destacadoTitulo", { nombre: animal.name })}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("destacadoTexto", { dias })}</p>
        <Link
          href={`/animales/${animal.slug}`}
          className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {t("destacadoCta", { nombre: animal.name })}
        </Link>
      </div>
    </section>
  );
}
