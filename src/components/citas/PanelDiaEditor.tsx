"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { validarFranjas, type EstadoDia, type FranjaDia, type IntentGuardar } from "@/lib/agenda";
import { cn } from "@/lib/utils";

const DURACIONES = [15, 30, 45, 60];
const FRANJA_DEFECTO: FranjaDia = { start: "10:00", end: "13:00", minutes: 30 };

function franjasIniciales(estado: EstadoDia | null): FranjaDia[] {
  if (estado && (estado.tipo === "especial" || estado.tipo === "patron")) return estado.franjas;
  return [];
}

/**
 * Editor de la disponibilidad de un día concreto (FEATURE-053). No persiste:
 * emite una intención (`IntentGuardar`) que el orquestador traduce a escrituras
 * en `availability_overrides` / `availability_slots`. El padre debe montarlo con
 * `key={fecha}` para reiniciar el estado al cambiar de día.
 */
export function PanelDiaEditor({
  fecha,
  estadoInicial,
  guardando,
  errorGuardar,
  onGuardar,
  onResetear,
  onCopiar,
}: {
  fecha: string | null;
  estadoInicial: EstadoDia | null;
  guardando: boolean;
  errorGuardar: boolean;
  onGuardar: (intent: IntentGuardar) => void;
  onResetear: () => void;
  onCopiar?: (estado: EstadoDia) => void;
}) {
  const t = useTranslations("agenda");
  const tc = useTranslations("citas");
  const [cerrado, setCerrado] = useState(estadoInicial?.tipo === "cerrado");
  const [franjas, setFranjas] = useState<FranjaDia[]>(franjasIniciales(estadoInicial));
  const [nota, setNota] = useState(
    estadoInicial && "note" in estadoInicial ? (estadoInicial.note ?? "") : "",
  );
  const [repetir, setRepetir] = useState(false);
  const [errorLocal, setErrorLocal] = useState<"horas" | "solape" | null>(null);

  if (!fecha) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground shadow-soft">
        {t("sinSeleccion")}
      </div>
    );
  }

  const dt = new Date(`${fecha}T00:00:00`);
  const weekday = dt.getDay(); // 0 = domingo (claves diaN de citas)
  const fechaLarga = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(dt);

  function actualizarFranja(i: number, campo: keyof FranjaDia, valor: string | number) {
    setFranjas((prev) => prev.map((f, j) => (j === i ? { ...f, [campo]: valor } : f)));
    setErrorLocal(null);
  }

  function guardar() {
    if (cerrado) {
      onGuardar({ tipo: "cerrar", note: nota.trim() || null });
      return;
    }
    const v = validarFranjas(franjas);
    if (!v.ok) {
      setErrorLocal(v.error);
      return;
    }
    setErrorLocal(null);
    if (repetir) onGuardar({ tipo: "patron", slots: franjas });
    else onGuardar({ tipo: "especial", slots: franjas, note: nota.trim() || null });
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tc(`dia${weekday}`)}
          </p>
          <h2 className="font-heading text-2xl font-bold capitalize">{fechaLarga}</h2>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            cerrado ? "bg-destructive/10 text-destructive" : "bg-tertiary/10 text-tertiary",
          )}
        >
          {cerrado ? t("cerrado") : t("abierto")}
        </span>
      </div>

      <label className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-4 py-3">
        <span className="font-medium">{t("cerrarDia")}</span>
        <button
          type="button"
          role="switch"
          aria-checked={cerrado}
          aria-label={t("cerrarDia")}
          onClick={() => setCerrado((v) => !v)}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            cerrado ? "bg-destructive" : "bg-muted",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-white transition-transform",
              cerrado ? "translate-x-5" : "translate-x-0.5",
            )}
          />
        </button>
      </label>

      {!cerrado && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-foreground">{t("franjasTitulo")}</p>
          {franjas.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              {t("sinFranjas")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {franjas.map((f, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <input
                    type="time"
                    aria-label={t("inicio")}
                    value={f.start}
                    onChange={(e) => actualizarFranja(i, "start", e.target.value)}
                    className="rounded-lg border border-input bg-white px-2 py-1.5 text-sm"
                  />
                  <span aria-hidden="true">–</span>
                  <input
                    type="time"
                    aria-label={t("fin")}
                    value={f.end}
                    onChange={(e) => actualizarFranja(i, "end", e.target.value)}
                    className="rounded-lg border border-input bg-white px-2 py-1.5 text-sm"
                  />
                  <select
                    aria-label={t("duracion")}
                    value={f.minutes}
                    onChange={(e) => actualizarFranja(i, "minutes", Number(e.target.value))}
                    className="rounded-lg border border-input bg-white px-2 py-1.5 text-sm"
                  >
                    {DURACIONES.map((d) => (
                      <option key={d} value={d}>
                        {tc("minutos", { n: d })}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    aria-label={t("borrarFranja")}
                    onClick={() => setFranjas((prev) => prev.filter((_, j) => j !== i))}
                    className="ml-auto rounded-full border border-destructive/40 px-2.5 py-1 text-xs text-destructive hover:bg-destructive/10"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => setFranjas((prev) => [...prev, { ...FRANJA_DEFECTO }])}
            className="rounded-xl border border-dashed border-primary/40 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5"
          >
            + {t("anadirFranja")}
          </button>

          <label className="mt-1 flex cursor-pointer items-start gap-3 rounded-xl bg-tertiary/5 p-4">
            <input
              type="checkbox"
              checked={repetir}
              onChange={(e) => setRepetir(e.target.checked)}
              className="mt-0.5 size-4 accent-primary"
            />
            <span>
              <span className="font-medium">{t("repetirSemanal")}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {t("repetirSemanalAyuda", { dia: tc(`dia${weekday}`) })}
              </span>
            </span>
          </label>
        </div>
      )}

      {!repetir && (
        <input
          type="text"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder={t("notaPlaceholder")}
          className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
        />
      )}

      {errorLocal && (
        <p className="text-sm text-destructive">
          {errorLocal === "horas" ? t("errorHoras") : t("errorSolape")}
        </p>
      )}
      {errorGuardar && <p className="text-sm text-destructive">{t("errorGuardar")}</p>}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {guardando ? t("guardando") : t("guardar")}
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onResetear}
            disabled={guardando}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border px-5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            {t("resetear")}
          </button>
          {onCopiar && estadoInicial && (
            <button
              type="button"
              onClick={() => onCopiar(estadoInicial)}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              {t("copiarDia")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
