"use client";

import { BellPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { AlertaFiltros } from "@/components/alertas/AlertaCard";
import type { AnimalSearch } from "@/lib/animal-search";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NOMBRE_ESPECIE: Record<string, string> = {
  dog: "speciesDog",
  cat: "speciesCat",
  other: "speciesOther",
};
const NOMBRE_TAMANO: Record<string, string> = {
  small: "sizeSmall",
  medium: "sizeMedium",
  large: "sizeLarge",
};
const NOMBRE_SEXO: Record<string, string> = { male: "sexMale", female: "sexFemale" };

/**
 * Deriva los filtros que la alerta sabe guardar y casar en el cron:
 * especie, primer tamaño, primer sexo y ubicación+distancia. El resto de
 * filtros del listado (texto, edad, flags) no se guardan.
 */
function filtrosDeAlerta(s: AnimalSearch): AlertaFiltros {
  const f: AlertaFiltros = {};
  if (s.especie) f.especie = s.especie;
  if (s.tamanos[0]) f.tamano = s.tamanos[0];
  if (s.sexos[0]) f.sexo = s.sexos[0];
  if (s.lat !== undefined && s.lng !== undefined && s.distanciaKm !== undefined) {
    f.lat = s.lat;
    f.lng = s.lng;
    f.radio_km = s.distanciaKm;
  }
  return f;
}

/**
 * Crea una alerta (búsqueda guardada) con los filtros actuales del listado.
 * `variant`: "bloque" (estado vacío) o "compacto" (cabecera de resultados).
 */
export function CrearAlertaButton({
  search,
  variant = "bloque",
}: {
  search: AnimalSearch;
  variant?: "bloque" | "compacto";
}) {
  const t = useTranslations("busqueda");
  const tAnimales = useTranslations("animales");
  const router = useRouter();
  const [estado, setEstado] = useState<"idle" | "creando" | "ok" | "limite" | "error">("idle");

  const filtros = useMemo(() => filtrosDeAlerta(search), [search]);
  const hayFiltros = Object.keys(filtros).length > 0;

  const nombre = useMemo(() => {
    const partes: string[] = [];
    if (filtros.especie) partes.push(tAnimales(NOMBRE_ESPECIE[filtros.especie]));
    if (filtros.tamano) partes.push(tAnimales(NOMBRE_TAMANO[filtros.tamano]));
    if (filtros.sexo) partes.push(tAnimales(NOMBRE_SEXO[filtros.sexo]));
    if (filtros.radio_km) partes.push(t("distanciaDe", { km: filtros.radio_km }));
    return partes.length > 0 ? partes.join(" · ") : t("alertaNombreDefault");
  }, [filtros, t, tAnimales]);

  async function crear() {
    if (!hayFiltros) return;
    setEstado("creando");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { error } = await supabase
      .from("saved_searches")
      .insert({ user_id: user.id, name: nombre, filters: filtros });
    if (error) {
      setEstado(error.message.includes("saved_searches_limit") ? "limite" : "error");
      return;
    }
    setEstado("ok");
  }

  const compacto = variant === "compacto";

  if (estado === "ok") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-sm",
          compacto ? "flex-wrap" : "mt-2 flex-col justify-center",
        )}
      >
        <p className="font-medium text-secondary">{t("alertaCreada")}</p>
        <Link
          href="/mi-cuenta/alertas"
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          {t("alertaVerMis")}
        </Link>
      </div>
    );
  }

  const boton = (
    <button
      type="button"
      onClick={crear}
      disabled={estado === "creando" || !hayFiltros}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full bg-secondary px-5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50",
        compacto && "px-4",
      )}
    >
      <BellPlus className="size-4" aria-hidden="true" />
      {compacto ? t("crearAlertaCorto") : t("crearAlerta")}
    </button>
  );

  return (
    <div className={cn("flex gap-2", compacto ? "flex-wrap items-center" : "mt-2 flex-col items-center")}>
      {boton}
      {!hayFiltros && <span className="text-xs text-muted-foreground">{t("alertaSinFiltros")}</span>}
      {estado === "limite" && <p className="text-sm text-destructive">{t("alertaErrorLimite")}</p>}
      {estado === "error" && <p className="text-sm text-destructive">{t("alertaError")}</p>}
    </div>
  );
}
