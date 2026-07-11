"use client";

import { BellPlus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

/**
 * Crea una alerta (búsqueda guardada) con los filtros actuales del listado.
 * Guarda especie/tamaño/sexo y, si hay ubicación, lat/lng/radio — lo que el
 * matching del cron sabe casar.
 */
export function CrearAlertaButton() {
  const t = useTranslations("busqueda");
  const tAnimales = useTranslations("animales");
  const router = useRouter();
  const params = useSearchParams();
  const [estado, setEstado] = useState<"idle" | "creando" | "ok" | "limite" | "error">("idle");

  async function crear() {
    setEstado("creando");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const filters: Record<string, unknown> = {};
    const especie = params.get("especie");
    if (especie) filters.especie = especie;
    const tamano = params.get("tamano")?.split(",")[0];
    if (tamano) filters.tamano = tamano;
    const sexo = params.get("sexo")?.split(",")[0];
    if (sexo) filters.sexo = sexo;
    const lat = params.get("lat");
    const lng = params.get("lng");
    const distancia = params.get("distancia");
    if (lat && lng && distancia) {
      filters.lat = Number(lat);
      filters.lng = Number(lng);
      filters.radio_km = Number(distancia);
    }

    const ESPECIE: Record<string, string> = {
      dog: tAnimales("speciesDog"),
      cat: tAnimales("speciesCat"),
      other: tAnimales("speciesOther"),
    };
    const nombre = especie && ESPECIE[especie] ? ESPECIE[especie] : t("alertaNombreDefault");

    const { error } = await supabase
      .from("saved_searches")
      .insert({ user_id: user.id, name: nombre, filters });
    if (error) {
      setEstado(error.message.includes("saved_searches_limit") ? "limite" : "error");
      return;
    }
    setEstado("ok");
  }

  if (estado === "ok") {
    return (
      <div className="mt-2 flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-secondary">{t("alertaCreada")}</p>
        <Link href="/mi-cuenta/alertas" className="text-sm text-primary underline-offset-4 hover:underline">
          {t("alertaVerMis")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={crear}
        disabled={estado === "creando"}
        className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 disabled:opacity-50"
      >
        <BellPlus className="size-4" aria-hidden="true" />
        {t("crearAlerta")}
      </button>
      {estado === "limite" && <p className="text-sm text-destructive">{t("alertaErrorLimite")}</p>}
      {estado === "error" && <p className="text-sm text-destructive">{t("alertaError")}</p>}
    </div>
  );
}
