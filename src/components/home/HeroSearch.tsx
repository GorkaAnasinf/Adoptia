"use client";

import { LocateFixed, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Buscador del hero de la home: especie + ciudad/CP (geocodificada vía
 * /api/geocode) o la ubicación del navegador. Navega a /animales con los
 * filtros ya soportados por parseAnimalSearch.
 */
export function HeroSearch() {
  const t = useTranslations("home");
  const router = useRouter();
  const [especie, setEspecie] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);

  const irAlListado = (params: URLSearchParams) => {
    const qs = params.toString();
    router.push(qs ? `/animales?${qs}` : "/animales");
  };

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const params = new URLSearchParams();
    if (especie) params.set("especie", especie);

    const q = ciudad.trim();
    if (!q) {
      irAlListado(params);
      return;
    }

    setBuscando(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const body = res.ok ? await res.json() : null;
      const lat: number | null = body?.data?.lat ?? null;
      const lng: number | null = body?.data?.lng ?? null;
      if (lat === null || lng === null) {
        setError(t("searchCityNotFound"));
        return;
      }
      params.set("lat", String(lat));
      params.set("lng", String(lng));
      params.set("orden", "cercanos");
      irAlListado(params);
    } catch {
      setError(t("searchCityNotFound"));
    } finally {
      setBuscando(false);
    }
  };

  const usarUbicacion = () => {
    setError(null);
    if (!navigator.geolocation) {
      setError(t("searchGeoDenied"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const params = new URLSearchParams();
        if (especie) params.set("especie", especie);
        params.set("lat", String(coords.latitude));
        params.set("lng", String(coords.longitude));
        params.set("orden", "cercanos");
        irAlListado(params);
      },
      () => setError(t("searchGeoDenied")),
    );
  };

  return (
    <div className="w-full max-w-2xl">
      <form
        role="search"
        onSubmit={buscar}
        className="flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-md ring-1 ring-black/5 sm:flex-row sm:items-center sm:rounded-full sm:py-2 sm:pl-4 sm:pr-2"
      >
        <label className="flex min-h-11 flex-1 items-center gap-2 border-border max-sm:rounded-xl max-sm:border max-sm:px-3 sm:border-r sm:pr-3">
          <MapPin className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">{t("searchSpeciesLabel")}</span>
          <select
            value={especie}
            onChange={(e) => setEspecie(e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          >
            <option value="">{t("searchAllSpecies")}</option>
            <option value="dog">{t("quickDogs")}</option>
            <option value="cat">{t("quickCats")}</option>
            <option value="other">{t("quickOthers")}</option>
          </select>
        </label>
        <label className="flex min-h-11 flex-[1.4] items-center gap-2 border-border max-sm:rounded-xl max-sm:border max-sm:px-3 sm:pr-2">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            type="text"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            placeholder={t("searchCityPlaceholder")}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <button
          type="submit"
          disabled={buscando}
          className="min-h-11 shrink-0 rounded-xl bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 sm:rounded-full"
        >
          {t("searchButton")}
        </button>
      </form>
      <div className="mt-2 flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={usarUbicacion}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary underline-offset-4 hover:underline"
        >
          <LocateFixed className="size-4" aria-hidden="true" />
          {t("searchUseLocation")}
        </button>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
