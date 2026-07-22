"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  resolverDiaAgenda,
  type FranjaSemanal,
  type IntentGuardar,
  type OverrideDia,
} from "@/lib/agenda";
import { createClient } from "@/lib/supabase/client";
import { CalendarioMensual, type EstadoCalendario } from "./CalendarioMensual";
import { PanelDiaEditor } from "./PanelDiaEditor";

/**
 * Orquestador de la Agenda de la protectora (FEATURE-053, F1). Mantiene el mes
 * visible y el día seleccionado, resuelve el estado de cada día combinando el
 * patrón semanal con las excepciones, y traduce las intenciones del editor a
 * escrituras en `availability_overrides` / `availability_slots` (RLS: la dueña).
 */
export function AgendaCliente({
  shelterId,
  franjas,
  overrides,
  citasPorDia,
  hoyISO,
  anioInicial,
  mesInicial,
}: {
  shelterId: string;
  franjas: FranjaSemanal[];
  overrides: OverrideDia[];
  citasPorDia: string[];
  hoyISO: string;
  anioInicial: number;
  mesInicial: number; // 0-indexado
}) {
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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
      <CalendarioMensual
        year={year}
        month={month}
        todayISO={hoyISO}
        seleccionadoISO={seleccion}
        estadoDe={estadoDe}
        onSelect={setSeleccion}
        onPrev={() => navegar(-1)}
        onNext={() => navegar(1)}
      />
      <PanelDiaEditor
        key={seleccion ?? "none"}
        fecha={seleccion}
        estadoInicial={estadoSeleccion}
        guardando={guardando}
        errorGuardar={errorGuardar}
        onGuardar={guardar}
        onResetear={resetear}
      />
    </div>
  );
}
