"use client";

import { Cat, Dog, Globe, MapPin, PawPrint, Ruler, Trash2, Venus, type LucideIcon, Mars } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type AlertaFiltros = {
  especie?: string;
  tamano?: string;
  sexo?: string;
  lat?: number;
  lng?: number;
  radio_km?: number;
};

export type AlertaVista = {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  filters: AlertaFiltros;
};

const CLAVE_ESPECIE: Record<string, { icon: LucideIcon; clave: string }> = {
  dog: { icon: Dog, clave: "speciesDog" },
  cat: { icon: Cat, clave: "speciesCat" },
  other: { icon: PawPrint, clave: "speciesOther" },
};
const CLAVE_TAMANO: Record<string, string> = {
  small: "sizeSmall",
  medium: "sizeMedium",
  large: "sizeLarge",
};
const CLAVE_SEXO: Record<string, { icon: LucideIcon; clave: string }> = {
  male: { icon: Mars, clave: "sexMale" },
  female: { icon: Venus, clave: "sexFemale" },
};

/** Construye la URL del listado con los filtros de la alerta ya aplicados. */
function urlResultados(f: AlertaFiltros): string {
  const p = new URLSearchParams();
  if (f.especie) p.set("especie", f.especie);
  if (f.tamano) p.set("tamano", f.tamano);
  if (f.sexo) p.set("sexo", f.sexo);
  if (typeof f.lat === "number" && typeof f.lng === "number" && f.radio_km) {
    p.set("lat", String(f.lat));
    p.set("lng", String(f.lng));
    p.set("distancia", String(f.radio_km));
  }
  const qs = p.toString();
  return qs ? `/animales?${qs}` : "/animales";
}

function Chip({ icon: Icon, children, apagado }: { icon: LucideIcon; children: React.ReactNode; apagado?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium",
        apagado ? "bg-muted text-muted-foreground" : "bg-secondary-container text-on-secondary-container",
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {children}
    </span>
  );
}

export function AlertaCard({ alerta }: { alerta: AlertaVista }) {
  const t = useTranslations("account");
  const tAnimales = useTranslations("animales");
  const tBusqueda = useTranslations("busqueda");
  const format = useFormatter();
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  const { filters: f, active } = alerta;

  async function alternar() {
    setEnviando(true);
    const supabase = createClient();
    await supabase.from("saved_searches").update({ active: !active }).eq("id", alerta.id);
    router.refresh();
  }

  async function borrar() {
    if (!window.confirm(t("alertaBorrarConfirm"))) return;
    setEnviando(true);
    const supabase = createClient();
    await supabase.from("saved_searches").delete().eq("id", alerta.id);
    router.refresh();
  }

  const especie = f.especie ? CLAVE_ESPECIE[f.especie] : undefined;
  const sexo = f.sexo ? CLAVE_SEXO[f.sexo] : undefined;
  const conUbicacion = typeof f.lat === "number" && typeof f.lng === "number" && !!f.radio_km;

  return (
    <article
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl p-6 transition-shadow",
        active ? "bg-card shadow-soft" : "bg-muted/40 grayscale",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 size-32 rounded-full",
          active ? "bg-primary/5" : "bg-transparent",
        )}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-heading text-xl font-semibold text-foreground">{alerta.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("alertaFechaCreada", {
              fecha: format.dateTime(new Date(alerta.createdAt), { day: "numeric", month: "long", year: "numeric" }),
            })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            {active ? t("alertaActiva") : t("alertaPausada")}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            aria-label={active ? t("alertaPausar") : t("alertaActivar")}
            disabled={enviando}
            onClick={alternar}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50",
              active ? "bg-primary-container" : "bg-muted-foreground/30",
            )}
          >
            <span
              className={cn(
                "inline-block size-4 rounded-full bg-white shadow transition-transform",
                active ? "translate-x-6" : "translate-x-1",
              )}
            />
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {especie && (
          <Chip icon={especie.icon} apagado={!active}>
            {tAnimales(especie.clave)}
          </Chip>
        )}
        {f.tamano && CLAVE_TAMANO[f.tamano] && (
          <Chip icon={Ruler} apagado={!active}>
            {tAnimales(CLAVE_TAMANO[f.tamano])}
          </Chip>
        )}
        {sexo && (
          <Chip icon={sexo.icon} apagado={!active}>
            {tAnimales(sexo.clave)}
          </Chip>
        )}
        <Chip icon={conUbicacion ? MapPin : Globe} apagado={!active}>
          {conUbicacion ? tBusqueda("distanciaDe", { km: Number(f.radio_km) }) : t("alertaTodaEspana")}
        </Chip>
      </div>

      <div className="mt-6 flex items-center gap-2 border-t border-border pt-5">
        <Link
          href={urlResultados(f)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-primary hover:bg-primary/5"
        >
          <PawPrint className="size-4" aria-hidden="true" />
          {t("alertaVerResultados")}
        </Link>
        <button
          type="button"
          onClick={borrar}
          disabled={enviando}
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          {t("alertaBorrar")}
        </button>
      </div>
    </article>
  );
}
