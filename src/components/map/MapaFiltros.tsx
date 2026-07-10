"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { buildQueryString, type SheltersSearch } from "@/lib/shelters-search";
import { cn } from "@/lib/utils";

function Chip({
  activo,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { activo?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      className={cn(
        "min-h-9 rounded-full border px-3.5 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50",
        activo
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-white text-foreground hover:border-primary/50",
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function MapaFiltros({ search }: { search: SheltersSearch }) {
  const t = useTranslations("mapa");
  const router = useRouter();
  const pathname = usePathname();
  const [errorUbicacion, setErrorUbicacion] = useState(false);
  const [ciudad, setCiudad] = useState("");
  const [estadoCiudad, setEstadoCiudad] = useState<"idle" | "buscando" | "no_encontrada" | "error">(
    "idle",
  );

  const conUbicacion = search.lat !== undefined && search.lng !== undefined;

  const navegar = (cambios: Partial<SheltersSearch>) => {
    const qs = buildQueryString({ ...search, ...cambios });
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const pedirUbicacion = () => {
    setErrorUbicacion(false);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 1000) / 1000;
        const lng = Math.round(pos.coords.longitude * 1000) / 1000;
        navegar({ lat, lng });
      },
      () => setErrorUbicacion(true),
    );
  };

  const buscarCiudad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ciudad.trim()) return;
    setEstadoCiudad("buscando");
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(ciudad.trim())}`);
      const json = await res.json();
      if (!res.ok || json.data?.lat === null || json.data?.lat === undefined) {
        setEstadoCiudad("no_encontrada");
        return;
      }
      setEstadoCiudad("idle");
      navegar({ lat: json.data.lat, lng: json.data.lng });
    } catch {
      setEstadoCiudad("error");
    }
  };

  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-foreground">{t("filtros")}</legend>
        <div className="flex flex-wrap gap-2">
          <Chip activo={search.perros} onClick={() => navegar({ perros: !search.perros })}>
            {t("perros")}
          </Chip>
          <Chip activo={search.gatos} onClick={() => navegar({ gatos: !search.gatos })}>
            {t("gatos")}
          </Chip>
          <Chip activo={search.acogida} onClick={() => navegar({ acogida: !search.acogida })}>
            {t("acogida")}
          </Chip>
          <Chip
            activo={search.voluntariado}
            onClick={() => navegar({ voluntariado: !search.voluntariado })}
          >
            {t("voluntariado")}
          </Chip>
        </div>
      </fieldset>

      <div className="space-y-2 border-t border-black/5 pt-3">
        {conUbicacion ? (
          <p className="text-sm text-tertiary">{t("ubicacionActiva")}</p>
        ) : (
          <Chip onClick={pedirUbicacion}>{t("usarUbicacion")}</Chip>
        )}
        {errorUbicacion && <p className="text-sm text-destructive">{t("ubicacionError")}</p>}

        <form onSubmit={buscarCiudad} className="flex gap-2">
          <label htmlFor="mapa-ciudad" className="sr-only">
            {t("ciudadLabel")}
          </label>
          <input
            id="mapa-ciudad"
            type="text"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            placeholder={t("ciudadPlaceholder")}
            className="min-h-9 flex-1 rounded-full border border-input bg-white px-3.5 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={estadoCiudad === "buscando"}
            className="min-h-9 rounded-full border border-input bg-white px-3.5 py-1.5 text-sm hover:border-primary/50 disabled:opacity-50"
          >
            {t("ciudadBuscar")}
          </button>
        </form>
        {estadoCiudad === "no_encontrada" && (
          <p className="text-sm text-destructive">{t("ciudadNoEncontrada")}</p>
        )}
        {estadoCiudad === "error" && <p className="text-sm text-destructive">{t("ciudadError")}</p>}
      </div>
    </div>
  );
}
