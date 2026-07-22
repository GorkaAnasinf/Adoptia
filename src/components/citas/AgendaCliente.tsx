"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  diasEnRango,
  estadoAOverride,
  resolverDiaAgenda,
  validarFranjas,
  type EstadoDia,
  type FranjaDia,
  type FranjaSemanal,
  type IntentGuardar,
  type OverrideDia,
  type Plantilla,
} from "@/lib/agenda";
import { festivosNacionales } from "@/lib/festivos";
import { plantillaSchema, type RangoCierreInput } from "@/lib/schemas/agenda";
import { createClient } from "@/lib/supabase/client";
import { CalendarioMensual, type EstadoCalendario } from "./CalendarioMensual";
import { PanelDiaEditor } from "./PanelDiaEditor";
import { PlantillasPicker } from "./PlantillasPicker";
import { RangoCierreDialog } from "./RangoCierreDialog";
import { UtilidadesBar } from "./UtilidadesBar";

const FRANJA_DEFECTO: FranjaDia = { start: "10:00", end: "13:00", minutes: 30 };

/**
 * Orquestador de la Agenda de la protectora (FEATURE-053 F1 + FEATURE-054 F2a).
 * Mantiene el mes visible y el día seleccionado, resuelve el estado de cada día
 * combinando el patrón semanal con las excepciones, y traduce tanto las
 * intenciones del editor como las utilidades masivas (pintar días, cerrar
 * rangos) a escrituras en `availability_overrides` / `availability_slots`
 * (RLS: la dueña). Los batch son un único `upsert` de un array (atómico).
 */
export function AgendaCliente({
  shelterId,
  franjas,
  overrides,
  citasPorDia,
  plantillas = [],
  hoyISO,
  anioInicial,
  mesInicial,
}: {
  shelterId: string;
  franjas: FranjaSemanal[];
  overrides: OverrideDia[];
  citasPorDia: string[];
  plantillas?: Plantilla[];
  hoyISO: string;
  anioInicial: number;
  mesInicial: number; // 0-indexado
}) {
  const t = useTranslations("agenda");
  const tc = useTranslations("citas");
  const router = useRouter();
  const [year, setYear] = useState(anioInicial);
  const [month, setMonth] = useState(mesInicial);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [franjasLocal, setFranjasLocal] = useState(franjas);
  const [overridesLocal, setOverridesLocal] = useState(() => {
    const m = new Map<string, OverrideDia>();
    for (const o of overrides) m.set(o.date, o);
    return m;
  });
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(false);

  // Utilidades masivas (F2a)
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [rangoAbierto, setRangoAbierto] = useState(false);
  const [franjaMasiva, setFranjaMasiva] = useState<FranjaDia | null>(null);
  const [portapapeles, setPortapapeles] = useState<EstadoDia | null>(null);
  const [plantillasLocal, setPlantillasLocal] = useState(plantillas);
  const [errorPlantilla, setErrorPlantilla] = useState(false);

  const citasSet = useMemo(() => new Set(citasPorDia), [citasPorDia]);

  function patronDe(iso: string): FranjaSemanal[] {
    const weekday = new Date(`${iso}T00:00:00`).getDay();
    return franjasLocal.filter((f) => f.weekday === weekday);
  }

  function estadoDe(iso: string): EstadoCalendario {
    const estado = resolverDiaAgenda(patronDe(iso), overridesLocal.get(iso) ?? null);
    return { tipo: estado.tipo, conCitas: citasSet.has(iso) };
  }

  const estadoSeleccion = seleccion
    ? resolverDiaAgenda(patronDe(seleccion), overridesLocal.get(seleccion) ?? null)
    : null;

  function navegar(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  function onDiaClick(iso: string) {
    if (!modoSeleccion) {
      setSeleccion(iso);
      return;
    }
    setSeleccionados((prev) => {
      const s = new Set(prev);
      if (s.has(iso)) s.delete(iso);
      else s.add(iso);
      return s;
    });
  }

  // ---------- Escritura de un día (editor) ----------

  async function persistir(intent: IntentGuardar): Promise<{ error: unknown }> {
    const supabase = createClient();
    const iso = seleccion!;
    if (intent.tipo === "cerrar") {
      return supabase
        .from("availability_overrides")
        .upsert(
          { shelter_id: shelterId, date: iso, closed: true, slots: [], note: intent.note },
          { onConflict: "shelter_id,date" },
        );
    }
    if (intent.tipo === "especial") {
      return supabase
        .from("availability_overrides")
        .upsert(
          { shelter_id: shelterId, date: iso, closed: false, slots: intent.slots, note: intent.note },
          { onConflict: "shelter_id,date" },
        );
    }
    // patron: reemplaza el patrón semanal del weekday y limpia el override.
    const weekday = new Date(`${iso}T00:00:00`).getDay();
    await supabase.from("availability_slots").delete().eq("shelter_id", shelterId).eq("weekday", weekday);
    const { error } = await supabase.from("availability_slots").insert(
      intent.slots.map((s) => ({
        shelter_id: shelterId,
        weekday,
        start_time: s.start,
        end_time: s.end,
        slot_minutes: s.minutes,
      })),
    );
    await supabase.from("availability_overrides").delete().eq("shelter_id", shelterId).eq("date", iso);
    return { error };
  }

  function aplicarLocal(intent: IntentGuardar) {
    if (!seleccion) return;
    const iso = seleccion;
    if (intent.tipo === "cerrar") {
      setOverridesLocal((prev) =>
        new Map(prev).set(iso, { date: iso, closed: true, slots: [], note: intent.note }),
      );
    } else if (intent.tipo === "especial") {
      setOverridesLocal((prev) =>
        new Map(prev).set(iso, { date: iso, closed: false, slots: intent.slots, note: intent.note }),
      );
    } else {
      const weekday = new Date(`${iso}T00:00:00`).getDay();
      setFranjasLocal([
        ...franjasLocal.filter((f) => f.weekday !== weekday),
        ...intent.slots.map((s) => ({
          weekday,
          start_time: s.start,
          end_time: s.end,
          slot_minutes: s.minutes,
          active: true,
        })),
      ]);
      setOverridesLocal((prev) => {
        const m = new Map(prev);
        m.delete(iso);
        return m;
      });
    }
  }

  async function guardar(intent: IntentGuardar) {
    setGuardando(true);
    setErrorGuardar(false);
    const { error } = await persistir(intent);
    setGuardando(false);
    if (error) {
      setErrorGuardar(true);
      return;
    }
    aplicarLocal(intent);
    router.refresh();
  }

  async function resetear() {
    if (!seleccion) return;
    setGuardando(true);
    setErrorGuardar(false);
    const supabase = createClient();
    const { error } = await supabase
      .from("availability_overrides")
      .delete()
      .eq("shelter_id", shelterId)
      .eq("date", seleccion);
    setGuardando(false);
    if (error) {
      setErrorGuardar(true);
      return;
    }
    setOverridesLocal((prev) => {
      const m = new Map(prev);
      m.delete(seleccion);
      return m;
    });
    router.refresh();
  }

  // ---------- Escritura masiva (utilidades) ----------

  /** Upsert de un array de overrides (una sentencia atómica); actualiza estado local. */
  async function ejecutarBatch(nuevos: OverrideDia[]) {
    if (nuevos.length === 0) return;
    setGuardando(true);
    setErrorGuardar(false);
    const supabase = createClient();
    const { error } = await supabase.from("availability_overrides").upsert(
      nuevos.map((o) => ({
        shelter_id: shelterId,
        date: o.date,
        closed: o.closed,
        slots: o.slots,
        note: o.note,
      })),
      { onConflict: "shelter_id,date" },
    );
    setGuardando(false);
    if (error) {
      setErrorGuardar(true);
      return;
    }
    setOverridesLocal((prev) => {
      const m = new Map(prev);
      for (const o of nuevos) m.set(o.date, o);
      return m;
    });
    setSeleccionados(new Set());
    setModoSeleccion(false);
    setFranjaMasiva(null);
    setRangoAbierto(false);
    router.refresh();
  }

  function cerrarSeleccion() {
    ejecutarBatch(
      [...seleccionados].map((date) => ({ date, closed: true, slots: [], note: null })),
    );
  }

  function aplicarFranjaSeleccion(franja: FranjaDia) {
    if (!validarFranjas([franja]).ok) return;
    ejecutarBatch(
      [...seleccionados].map((date) => ({ date, closed: false, slots: [franja], note: null })),
    );
  }

  function cerrarRango(datos: RangoCierreInput) {
    ejecutarBatch(
      diasEnRango(datos.desde, datos.hasta).map((date) => ({
        date,
        closed: true,
        slots: [],
        note: datos.nota ?? null,
      })),
    );
  }

  function cerrarFestivos() {
    ejecutarBatch(
      festivosNacionales(year).map((date) => ({
        date,
        closed: true,
        slots: [],
        note: t("notaFestivo"),
      })),
    );
  }

  function pegar() {
    if (!portapapeles) return;
    const nuevos = [...seleccionados]
      .map((date) => estadoAOverride(portapapeles, date))
      .filter((o): o is OverrideDia => o !== null);
    ejecutarBatch(nuevos);
  }

  function aplicarPlantilla(plantilla: Plantilla) {
    ejecutarBatch(
      [...seleccionados].map((date) => ({ date, closed: false, slots: plantilla.slots, note: null })),
    );
  }

  async function guardarPlantilla(nombre: string, slots: FranjaDia[]) {
    const parsed = plantillaSchema.safeParse({ nombre, slots });
    if (!parsed.success) {
      setErrorPlantilla(true);
      return;
    }
    setErrorPlantilla(false);
    const supabase = createClient();
    const { error } = await supabase
      .from("availability_templates")
      .insert({ shelter_id: shelterId, nombre: parsed.data.nombre, slots: parsed.data.slots });
    if (error) {
      setErrorPlantilla(true);
      return;
    }
    setPlantillasLocal((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nombre: parsed.data.nombre, slots: parsed.data.slots },
    ]);
    router.refresh();
  }

  async function borrarPlantilla(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("availability_templates").delete().eq("id", id);
    if (error) return;
    setPlantillasLocal((prev) => prev.filter((p) => p.id !== id));
    router.refresh();
  }

  const nSeleccionados = seleccionados.size;

  return (
    <div className="flex flex-col gap-4">
      <UtilidadesBar
        modoSeleccion={modoSeleccion}
        onToggleSeleccion={() => {
          setModoSeleccion((v) => !v);
          setSeleccionados(new Set());
          setFranjaMasiva(null);
          setSeleccion(null);
        }}
        onAbrirRango={() => setRangoAbierto(true)}
        onCerrarFestivos={cerrarFestivos}
      />

      {errorGuardar && modoSeleccion && (
        <p className="text-sm text-destructive">{t("errorBatch")}</p>
      )}
      {errorPlantilla && <p className="text-sm text-destructive">{t("errorPlantilla")}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <CalendarioMensual
          year={year}
          month={month}
          todayISO={hoyISO}
          seleccionadoISO={seleccion}
          estadoDe={estadoDe}
          onSelect={onDiaClick}
          onPrev={() => navegar(-1)}
          onNext={() => navegar(1)}
          modoSeleccion={modoSeleccion}
          seleccionados={seleccionados}
        />

        {modoSeleccion ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="font-heading text-lg font-semibold">
              {t("diasSeleccionados", { n: nSeleccionados })}
            </p>
            {portapapeles && !franjaMasiva && (
              <p className="text-sm text-muted-foreground">{t("diaCopiado")}</p>
            )}
            {franjaMasiva ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">{t("aplicarFranjaTitulo")}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="time"
                    aria-label={t("inicio")}
                    value={franjaMasiva.start}
                    onChange={(e) => setFranjaMasiva({ ...franjaMasiva, start: e.target.value })}
                    className="rounded-lg border border-input bg-white px-2 py-1.5 text-sm"
                  />
                  <span aria-hidden="true">–</span>
                  <input
                    type="time"
                    aria-label={t("fin")}
                    value={franjaMasiva.end}
                    onChange={(e) => setFranjaMasiva({ ...franjaMasiva, end: e.target.value })}
                    className="rounded-lg border border-input bg-white px-2 py-1.5 text-sm"
                  />
                  <select
                    aria-label={t("duracion")}
                    value={franjaMasiva.minutes}
                    onChange={(e) => setFranjaMasiva({ ...franjaMasiva, minutes: Number(e.target.value) })}
                    className="rounded-lg border border-input bg-white px-2 py-1.5 text-sm"
                  >
                    {[15, 30, 45, 60].map((d) => (
                      <option key={d} value={d}>
                        {tc("minutos", { n: d })}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => aplicarFranjaSeleccion(franjaMasiva)}
                  disabled={guardando || nSeleccionados === 0}
                  className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {t("aplicar")}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={cerrarSeleccion}
                  disabled={guardando || nSeleccionados === 0}
                  className="min-h-11 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-white hover:bg-destructive/90 disabled:opacity-50"
                >
                  {t("cerrarSeleccionados")}
                </button>
                <button
                  type="button"
                  onClick={() => setFranjaMasiva({ ...FRANJA_DEFECTO })}
                  disabled={nSeleccionados === 0}
                  className="min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50"
                >
                  {t("aplicarFranjaSeleccion")}
                </button>
                {portapapeles && (
                  <button
                    type="button"
                    onClick={pegar}
                    disabled={guardando || nSeleccionados === 0}
                    className="min-h-11 rounded-xl border border-secondary px-4 py-2 text-sm font-semibold text-secondary hover:bg-secondary/10 disabled:opacity-50"
                  >
                    {t("pegar")}
                  </button>
                )}
                <PlantillasPicker
                  plantillas={plantillasLocal}
                  nSeleccionados={nSeleccionados}
                  guardando={guardando}
                  onAplicar={aplicarPlantilla}
                  onBorrar={borrarPlantilla}
                />
              </div>
            )}
          </div>
        ) : (
          <PanelDiaEditor
            key={seleccion ?? "none"}
            fecha={seleccion}
            estadoInicial={estadoSeleccion}
            guardando={guardando}
            errorGuardar={errorGuardar}
            onGuardar={guardar}
            onResetear={resetear}
            onCopiar={setPortapapeles}
            onGuardarPlantilla={guardarPlantilla}
          />
        )}
      </div>

      <RangoCierreDialog
        abierto={rangoAbierto}
        guardando={guardando}
        errorGuardar={errorGuardar}
        onConfirmar={cerrarRango}
        onCerrar={() => setRangoAbierto(false)}
      />
    </div>
  );
}
