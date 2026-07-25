"use client";

import { CalendarClock, MapPin, PawPrint, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/Reveal";
import { esImagenValida } from "@/lib/animal-search";
import { MapaJornadas } from "./MapaJornadas";
import type { JornadaMapa } from "./tipos";

/** Listado + mapa de las jornadas publicadas y futuras (FEATURE-062). */
export function JornadasView({ jornadas }: { jornadas: JornadaMapa[] }) {
  const t = useTranslations("jornadas");
  const format = useFormatter();

  if (jornadas.length === 0) {
    return (
      <p className="rounded-3xl bg-surface-container-low px-6 py-12 text-center text-muted-foreground shadow-soft">
        {t("publicEmpty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative h-[360px] overflow-hidden rounded-3xl shadow-soft">
        <MapaJornadas jornadas={jornadas} />
      </div>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {jornadas.map((j, i) => (
          <li
            key={j.id}
            className="group relative flex flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-soft transition focus-within:ring-2 focus-within:ring-primary hover:shadow-soft-lg motion-safe:hover:-translate-y-1"
          >
            <Reveal delayMs={(i % 3) * 60} className="flex h-full flex-col">
              <div className="relative aspect-[16/9] bg-muted">
                {esImagenValida(j.poster_url) ? (
                  <Image
                    src={j.poster_url!}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <span aria-hidden className="flex h-full items-center justify-center text-4xl">
                    🐾
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-4">
                <Link
                  href={`/jornadas/${j.id}`}
                  className="font-heading text-lg font-semibold after:absolute after:inset-0 focus-visible:outline-none group-hover:text-primary"
                >
                  {j.title}
                </Link>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarClock aria-hidden className="h-4 w-4 shrink-0" />
                  {format.dateTime(new Date(j.starts_at), {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {j.city && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin aria-hidden className="h-4 w-4 shrink-0" />
                    {j.city}
                  </p>
                )}
                <p className="truncate text-sm font-medium text-primary">{j.shelter_name}</p>
                <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <PawPrint aria-hidden className="h-3.5 w-3.5" />
                    {t("rowAnimales", { count: j.animal_count })}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users aria-hidden className="h-3.5 w-3.5" />
                    {t("rowAsistentes", { count: j.attendee_count })}
                  </span>
                </div>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}
