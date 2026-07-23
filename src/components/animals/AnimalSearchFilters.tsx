"use client";

import { LocateFixed } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import {
  type AnimalSearch,
  buildQueryString,
  EDADES,
  type EdadBucket,
} from "@/lib/animal-search";
import { ESPECIES, TAMANOS } from "@/lib/schemas/animal";

const CLAVE_ESPECIE = { dog: "speciesDog", cat: "speciesCat", other: "speciesOther" } as const;
const CLAVE_TAMANO = { small: "sizeSmall", medium: "sizeMedium", large: "sizeLarge" } as const;
const CLAVE_EDAD: Record<EdadBucket, string> = {
  cachorro: "edadCachorro",
  joven: "edadJoven",
  adulto: "edadAdulto",
  senior: "edadSenior",
};

/** Borrador editable de los filtros (se aplica al pulsar «Aplicar filtros»). */
type Borrador = {
  texto: string;
  especie: string;
  tamano: string;
  edad: string;
  sexo: string;
  ninos: boolean;
  perros: boolean;
  gatos: boolean;
  piso: boolean;
  distanciaKm: number | undefined;
};

function Campo({
  etiqueta,
  children,
  htmlFor,
}: {
  etiqueta: string;
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-muted-foreground">
        {etiqueta}
      </label>
      {children}
    </div>
  );
}

const CLASE_SELECT =
  "min-h-10 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function AnimalSearchFilters({ search }: { search: AnimalSearch }) {
  const t = useTranslations("busqueda");
  const tAnimal = useTranslations("animales");
  const router = useRouter();
  const pathname = usePathname();
  const id = useId();
  const [errorUbicacion, setErrorUbicacion] = useState(false);
  const [borrador, setBorrador] = useState<Borrador>({
    texto: search.q ?? "",
    especie: search.especie ?? "",
    tamano: search.tamanos[0] ?? "",
    edad: search.edad ?? "",
    sexo: search.sexos[0] ?? "",
    ninos: search.ninos === true,
    perros: search.perros === true,
    gatos: search.gatos === true,
    piso: search.piso === true,
    distanciaKm: search.distanciaKm,
  });

  const conUbicacion = search.lat !== undefined && search.lng !== undefined;
  const editar = (cambios: Partial<Borrador>) => setBorrador((b) => ({ ...b, ...cambios }));

  const navegar = (destino: AnimalSearch) => {
    const qs = buildQueryString(destino);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const aplicar = (e: React.FormEvent) => {
    e.preventDefault();
    navegar({
      ...search,
      pagina: 1,
      q: borrador.texto.trim() || undefined,
      especie: (borrador.especie || undefined) as AnimalSearch["especie"],
      tamanos: (borrador.tamano ? [borrador.tamano] : []) as AnimalSearch["tamanos"],
      edad: (borrador.edad || undefined) as AnimalSearch["edad"],
      sexos: (borrador.sexo ? [borrador.sexo] : []) as AnimalSearch["sexos"],
      ninos: borrador.ninos ? true : undefined,
      perros: borrador.perros ? true : undefined,
      gatos: borrador.gatos ? true : undefined,
      piso: borrador.piso ? true : undefined,
      distanciaKm: conUbicacion ? borrador.distanciaKm : undefined,
    });
  };

  const pedirUbicacion = () => {
    setErrorUbicacion(false);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 1000) / 1000;
        const lng = Math.round(pos.coords.longitude * 1000) / 1000;
        navegar({ ...search, pagina: 1, lat, lng });
      },
      () => setErrorUbicacion(true),
    );
  };

  return (
    <form onSubmit={aplicar} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Campo etiqueta={t("texto")} htmlFor={`${id}-texto`}>
          <input
            id={`${id}-texto`}
            type="search"
            value={borrador.texto}
            onChange={(e) => editar({ texto: e.target.value })}
            placeholder={t("textoPlaceholder")}
            maxLength={60}
            className={CLASE_SELECT}
          />
        </Campo>

        <Campo etiqueta={t("especie")} htmlFor={`${id}-especie`}>
          <select
            id={`${id}-especie`}
            value={borrador.especie}
            onChange={(e) => editar({ especie: e.target.value })}
            className={CLASE_SELECT}
          >
            <option value="">{t("especieAll")}</option>
            {ESPECIES.map((e) => (
              <option key={e} value={e}>
                {tAnimal(CLAVE_ESPECIE[e])}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta={t("tamano")} htmlFor={`${id}-tamano`}>
          <select
            id={`${id}-tamano`}
            value={borrador.tamano}
            onChange={(e) => editar({ tamano: e.target.value })}
            className={CLASE_SELECT}
          >
            <option value="">{t("tamanoAll")}</option>
            {TAMANOS.map((tam) => (
              <option key={tam} value={tam}>
                {tAnimal(CLAVE_TAMANO[tam])}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta={t("edad")} htmlFor={`${id}-edad`}>
          <select
            id={`${id}-edad`}
            value={borrador.edad}
            onChange={(e) => editar({ edad: e.target.value })}
            className={CLASE_SELECT}
          >
            <option value="">{t("edadAll")}</option>
            {EDADES.map((e) => (
              <option key={e} value={e}>
                {t(CLAVE_EDAD[e])}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta={t("sexo")} htmlFor={`${id}-sexo`}>
          <select
            id={`${id}-sexo`}
            value={borrador.sexo}
            onChange={(e) => editar({ sexo: e.target.value })}
            className={CLASE_SELECT}
          >
            <option value="">{t("sexoAll")}</option>
            <option value="male">{tAnimal("sexMale")}</option>
            <option value="female">{tAnimal("sexFemale")}</option>
          </select>
        </Campo>

        <div className="flex min-w-0 flex-col gap-1">
          <label htmlFor={`${id}-distancia`} className="flex justify-between text-xs font-semibold text-muted-foreground">
            <span>{t("distancia")}</span>
            <span className="font-normal">
              {borrador.distanciaKm !== undefined
                ? t("distanciaKm", { km: borrador.distanciaKm })
                : t("distanciaSinLimite")}
            </span>
          </label>
          <input
            id={`${id}-distancia`}
            type="range"
            min={25}
            max={500}
            step={25}
            value={borrador.distanciaKm ?? 500}
            disabled={!conUbicacion}
            aria-label={t("distancia")}
            aria-describedby={conUbicacion ? undefined : `${id}-distancia-ayuda`}
            onChange={(e) => {
              const km = Number(e.target.value);
              editar({ distanciaKm: km >= 500 ? undefined : km });
            }}
            className="min-h-10 w-full accent-primary disabled:opacity-50"
          />
          {!conUbicacion && (
            <p id={`${id}-distancia-ayuda`} className="text-xs text-muted-foreground">
              {t("distanciaAyuda")}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {(
            [
              ["ninos", t("compatNinos")],
              ["perros", t("compatPerros")],
              ["gatos", t("compatGatos")],
              ["piso", t("compatPiso")],
            ] as const
          ).map(([campo, etiqueta]) => (
            <label key={campo} className="flex min-h-9 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={borrador[campo]}
                onChange={(e) => editar({ [campo]: e.target.checked })}
                className="size-4 accent-primary"
              />
              {etiqueta}
            </label>
          ))}
          {!conUbicacion ? (
            <button
              type="button"
              onClick={pedirUbicacion}
              className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-secondary underline-offset-4 hover:underline"
            >
              <LocateFixed className="size-4" aria-hidden="true" />
              {t("usarUbicacion")}
            </button>
          ) : (
            <span className="text-sm text-tertiary">{t("ubicacionActiva")}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.replace(pathname, { scroll: false })}
            className="min-h-10 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t("limpiar")}
          </button>
          <button
            type="submit"
            className="min-h-10 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-safe:active:scale-95"
          >
            {t("aplicar")}
          </button>
        </div>
      </div>

      {errorUbicacion && (
        <p role="alert" className="text-sm text-destructive">
          {t("ubicacionError")}
        </p>
      )}
    </form>
  );
}
