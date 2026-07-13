import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Building2, PawPrint } from "lucide-react";
import { esImagenValida } from "@/lib/animal-search";

/** Entrada del directorio público de protectoras (solo campos públicos). */
export interface ShelterDirectoryEntry {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  city: string | null;
  province: string | null;
  description: string | null;
  available_count: number;
}

function ubicacion(shelter: ShelterDirectoryEntry): string | null {
  return [shelter.city, shelter.province].filter(Boolean).join(", ") || null;
}

export function ShelterDirectory({ shelters }: { shelters: ShelterDirectoryEntry[] }) {
  const t = useTranslations("protectorasDir");

  if (shelters.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-black/5">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <PawPrint className="size-7 text-primary" aria-hidden="true" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-foreground">{t("vacioTitulo")}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{t("vacioTexto")}</p>
        <Link
          href="/animales"
          className="mt-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          {t("vacioCta")}
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {shelters.map((shelter) => (
        <li key={shelter.id}>
          <Link
            href={`/protectoras/${shelter.slug}`}
            className="group flex h-full flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                {esImagenValida(shelter.logo_url) ? (
                  <Image
                    src={shelter.logo_url}
                    alt={shelter.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <Building2 className="size-7 text-primary" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-heading text-base font-semibold text-foreground">
                  {shelter.name}
                </h2>
                {ubicacion(shelter) && (
                  <p className="truncate text-sm text-muted-foreground">{ubicacion(shelter)}</p>
                )}
              </div>
            </div>
            {shelter.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">{shelter.description}</p>
            )}
            <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-tertiary/10 px-3 py-1 text-xs font-medium text-tertiary">
              <PawPrint className="size-3.5" aria-hidden="true" />
              {t("disponibles", { count: shelter.available_count })}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
