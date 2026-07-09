"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  type AnimalSearch,
  buildQueryString,
  EDADES,
  type EdadBucket,
} from "@/lib/animal-search";
import { ESPECIES, TAMANOS } from "@/lib/schemas/animal";
import { cn } from "@/lib/utils";

const CLAVE_ESPECIE = { dog: "speciesDog", cat: "speciesCat", other: "speciesOther" } as const;
const CLAVE_TAMANO = { small: "sizeSmall", medium: "sizeMedium", large: "sizeLarge" } as const;
const CLAVE_EDAD: Record<EdadBucket, string> = {
  cachorro: "edadCachorro",
  joven: "edadJoven",
  adulto: "edadAdulto",
  senior: "edadSenior",
};

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

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-foreground">{titulo}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

export function AnimalSearchFilters({ search }: { search: AnimalSearch }) {
  const t = useTranslations("busqueda");
  const tAnimal = useTranslations("animales");
  const router = useRouter();
  const pathname = usePathname();
  const [errorUbicacion, setErrorUbicacion] = useState(false);

  const conUbicacion = search.lat !== undefined && search.lng !== undefined;

  const navegar = (cambios: Partial<AnimalSearch>) => {
    // Cualquier cambio de filtro vuelve a la página 1
    const qs = buildQueryString({ ...search, pagina: 1, ...cambios });
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const toggleLista = <T extends string>(lista: T[], valor: T): T[] =>
    lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];

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

  const hayFiltros =
    Boolean(
      search.especie ||
        search.tamanos.length ||
        search.sexos.length ||
        search.edad ||
        search.ninos ||
        search.perros ||
        search.gatos ||
        search.distanciaKm !== undefined,
    ) ||
    conUbicacion ||
    search.orden !== "recientes";

  return (
    <div className="space-y-4">
      <Grupo titulo={t("especie")}>
        <Chip activo={!search.especie} onClick={() => navegar({ especie: undefined })}>
          {t("especieAll")}
        </Chip>
        {ESPECIES.map((e) => (
          <Chip
            key={e}
            activo={search.especie === e}
            onClick={() => navegar({ especie: search.especie === e ? undefined : e })}
          >
            {tAnimal(CLAVE_ESPECIE[e])}
          </Chip>
        ))}
      </Grupo>

      <Grupo titulo={t("tamano")}>
        {TAMANOS.map((tam) => (
          <Chip
            key={tam}
            activo={search.tamanos.includes(tam)}
            onClick={() => navegar({ tamanos: toggleLista(search.tamanos, tam) })}
          >
            {tAnimal(CLAVE_TAMANO[tam])}
          </Chip>
        ))}
      </Grupo>

      <Grupo titulo={t("sexo")}>
        {(["male", "female"] as const).map((s) => (
          <Chip
            key={s}
            activo={search.sexos.includes(s)}
            onClick={() => navegar({ sexos: toggleLista(search.sexos, s) })}
          >
            {tAnimal(s === "male" ? "sexMale" : "sexFemale")}
          </Chip>
        ))}
      </Grupo>

      <Grupo titulo={t("edad")}>
        {EDADES.map((e) => (
          <Chip
            key={e}
            activo={search.edad === e}
            onClick={() => navegar({ edad: search.edad === e ? undefined : e })}
          >
            {t(CLAVE_EDAD[e])}
          </Chip>
        ))}
      </Grupo>

      <Grupo titulo={t("compat")}>
        <Chip
          activo={search.ninos === true}
          onClick={() => navegar({ ninos: search.ninos ? undefined : true })}
        >
          {t("compatNinos")}
        </Chip>
        <Chip
          activo={search.perros === true}
          onClick={() => navegar({ perros: search.perros ? undefined : true })}
        >
          {t("compatPerros")}
        </Chip>
        <Chip
          activo={search.gatos === true}
          onClick={() => navegar({ gatos: search.gatos ? undefined : true })}
        >
          {t("compatGatos")}
        </Chip>
      </Grupo>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-foreground">
          {t("distancia")}:{" "}
          <span className="font-normal text-muted-foreground">
            {search.distanciaKm !== undefined
              ? t("distanciaKm", { km: search.distanciaKm })
              : t("distanciaSinLimite")}
          </span>
        </legend>
        <input
          type="range"
          min={25}
          max={500}
          step={25}
          value={search.distanciaKm ?? 500}
          disabled={!conUbicacion}
          aria-label={t("distancia")}
          onChange={(e) => {
            const km = Number(e.target.value);
            navegar({ distanciaKm: km >= 500 ? undefined : km });
          }}
          className="w-full accent-primary disabled:opacity-50"
        />
      </fieldset>

      <Grupo titulo={t("orden")}>
        <Chip
          activo={search.orden === "recientes"}
          onClick={() => navegar({ orden: "recientes" })}
        >
          {t("ordenRecientes")}
        </Chip>
        <Chip
          activo={search.orden === "cercanos"}
          disabled={!conUbicacion}
          title={conUbicacion ? undefined : t("necesitaUbicacion")}
          onClick={() => navegar({ orden: "cercanos" })}
        >
          {t("ordenCercanos")}
        </Chip>
      </Grupo>

      <div className="space-y-2 border-t border-black/5 pt-3">
        {conUbicacion ? (
          <p className="text-sm text-tertiary">{t("ubicacionActiva")}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{t("ubicacionAviso")}</p>
            <Chip onClick={pedirUbicacion}>{t("usarUbicacion")}</Chip>
          </>
        )}
        {errorUbicacion && <p className="text-sm text-destructive">{t("ubicacionError")}</p>}
        {hayFiltros && (
          <div>
            <button
              type="button"
              onClick={() => router.replace(pathname, { scroll: false })}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("limpiar")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
