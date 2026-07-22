# Rediseño de "Citas" de la protectora — Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development o executing-plans. Steps con checkbox.

**Goal:** Rediseñar `/panel/citas` según el wireframe (tarjetas con foto, pestañas Próximas/Pasadas, lateral con calendario + resumen), con las acciones reales.

**Architecture:** La página servidor deriva próximas/pasadas + métricas + datos de calendario y monta un client `CitasCliente` (pestañas + tarjetas, reutilizando `CitaAccionesPanel`) y un lateral presentacional (`CalendarioCitas`, resumen, consejo). Sin cambios de modelo/RLS.

**Tech Stack:** Next.js 15 RSC + client, TS, Supabase, next-intl, lucide, Tailwind, Vitest + TL.

## Global Constraints
- UI text en `messages/es.json` (namespace `citas`). Sin cambios de esquema.
- Acciones reales: Realizada/No-show/Cancelar (`CitaAccionesPanel`). Nada de reprogramar / perfil de adoptante / crear cita / modalidad.
- Botón de cabecera = "Agenda de disponibilidad" → `/panel/agenda` (reutiliza `disponibilidadTitle`).
- Fechas en `Europe/Madrid`. TDD.
- Mapeo de estado (chip): `pending→estadoPendiente` (gris), `confirmed→estadoConfirmada` (teal), `cancelled→estadoCancelada` (stone), `done→estadoRealizada` (sky), `no_show→estadoNoShow` (rose).

---

### Task 1: `CalendarioCitas` (presentacional)

**Files:** Create `src/components/citas/CalendarioCitas.tsx`, Test `src/components/citas/CalendarioCitas.test.tsx`.

**Interfaces:** `CalendarioCitas({ year, month, todayDay, diasConCitas }: { year: number; month: number /*0-11*/; todayDay: number | null; diasConCitas: number[] })`.

- [ ] **Step 1: Test (RED)**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CalendarioCitas } from "./CalendarioCitas";

describe("CalendarioCitas", () => {
  it("resalta hoy y marca los días con citas", () => {
    render(<CalendarioCitas year={2026} month={6} todayDay={16} diasConCitas={[17, 24]} />);
    // Cabecera del mes
    expect(screen.getByText(/julio de 2026/i)).toBeInTheDocument();
    // Hoy marcado con aria-current
    expect(screen.getByRole("gridcell", { name: "16" })).toHaveattribute?.("aria-current", "date");
    // Días con cita llevan un punto (marcados con data-cita)
    const d17 = screen.getByRole("gridcell", { name: "17" });
    expect(d17.querySelector("[data-cita]")).not.toBeNull();
  });
});
```

> Nota: si `toHaveattribute` no existe, usa `expect(screen.getByRole("gridcell",{name:"16"})).toHaveAttribute("aria-current","date")`. (Corrige el typo al escribir el test.)

- [ ] **Step 2: RED** — `npm run test -- "src/components/citas/CalendarioCitas.test.tsx"` → falla.

- [ ] **Step 3: Componente**

```tsx
import { cn } from "@/lib/utils";

const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

/**
 * Mini-calendario del mes indicado (presentacional). `todayDay` marca el día de
 * hoy si el mes mostrado es el actual; `diasConCitas` pinta un punto en los días
 * con alguna cita. Sin navegación ni interacción.
 */
export function CalendarioCitas({
  year,
  month,
  todayDay,
  diasConCitas,
}: {
  year: number;
  month: number;
  todayDay: number | null;
  diasConCitas: number[];
}) {
  const conCita = new Set(diasConCitas);
  const primero = new Date(year, month, 1);
  const desplazamiento = (primero.getDay() + 6) % 7; // Lunes = 0
  const totalDias = new Date(year, month + 1, 0).getDate();
  const celdas: (number | null)[] = [
    ...Array<null>(desplazamiento).fill(null),
    ...Array.from({ length: totalDias }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);
  const mesLabel = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(primero);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="mb-3 text-sm font-bold uppercase tracking-wide text-foreground">{mesLabel}</p>
      <div role="grid" className="grid grid-cols-7 gap-1 text-center text-xs">
        {DIAS_SEMANA.map((d, i) => (
          <span key={i} className="py-1 font-semibold text-muted-foreground">
            {d}
          </span>
        ))}
        {celdas.map((dia, i) => {
          if (dia === null) return <span key={`e${i}`} aria-hidden="true" />;
          const esHoy = dia === todayDay;
          return (
            <span
              key={dia}
              role="gridcell"
              aria-label={String(dia)}
              aria-current={esHoy ? "date" : undefined}
              className={cn(
                "relative mx-auto flex size-8 items-center justify-center rounded-full text-sm",
                esHoy ? "bg-primary font-bold text-primary-foreground" : "text-foreground",
              )}
            >
              {dia}
              {conCita.has(dia) && (
                <span
                  data-cita
                  className={cn(
                    "absolute bottom-1 size-1 rounded-full",
                    esHoy ? "bg-primary-foreground" : "bg-primary",
                  )}
                  aria-hidden="true"
                />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: GREEN** — test pasa. **Step 5:** `npx tsc --noEmit`. **Step 6:** commit `feat(citas): mini-calendario presentacional del mes`.

---

### Task 2: `CitasCliente` (pestañas + tarjetas)

**Files:** Create `src/components/citas/CitasCliente.tsx`, Test `src/components/citas/CitasCliente.test.tsx`, Modify `messages/es.json`.

**Interfaces:**
```ts
export type CitaVista = {
  id: string;
  status: "pending" | "confirmed" | "cancelled" | "done" | "no_show";
  starts_at: string;
  cancel_reason: string | null;
  adopterName: string | null;
  animal: { name: string; slug: string; cover: string | null } | null;
};
export function CitasCliente({ proximas, pasadas }: { proximas: CitaVista[]; pasadas: CitaVista[] }): JSX.Element;
```
Consume: `CitaAccionesPanel` (`@/components/citas/CitaAccionesPanel`), `Reveal`, `Image`, `Link`, `useTranslations("citas")`.

- [ ] **Step 1: i18n** — añade en `citas`:
```json
    "pasadas": "Pasadas",
    "sinPasadas": "No hay citas pasadas.",
    "cardTitle": "Cita para conocer a {nombre}",
    "hoy": "Hoy",
    "manana": "Mañana",
    "resumenTitle": "Resumen semanal",
    "resumenSemana": "Citas esta semana",
    "resumenSolicitudes": "Nuevas solicitudes",
    "resumenAsistencia": "Tasa de asistencia",
    "consejoTexto": "Preparar una pequeña guía de cuidados para el adoptante antes de la cita mejora la experiencia.",
    "verRecursos": "Ver recursos",
```

- [ ] **Step 2: Test (RED)** — `src/components/citas/CitasCliente.test.tsx`:
```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { CitasCliente, type CitaVista } from "./CitasCliente";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const prox: CitaVista = {
  id: "c1", status: "confirmed", starts_at: new Date(Date.now() + 3 * 86400000).toISOString(),
  cancel_reason: null, adopterName: "Sergio Montes",
  animal: { name: "Luna", slug: "luna", cover: null },
};
const pas: CitaVista = {
  id: "c2", status: "no_show", starts_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  cancel_reason: null, adopterName: "Familia García",
  animal: { name: "Oreo", slug: "oreo", cover: null },
};

function conIntl(ui: React.ReactElement) {
  return render(<NextIntlClientProvider locale="es" messages={messages}>{ui}</NextIntlClientProvider>);
}

describe("CitasCliente", () => {
  it("pestaña Próximas muestra la cita activa con acciones", () => {
    conIntl(<CitasCliente proximas={[prox]} pasadas={[pas]} />);
    expect(screen.getByText("Cita para conocer a Luna")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: messages.citas.marcarRealizada })).toBeInTheDocument();
    // La cita pasada no está en la pestaña activa
    expect(screen.queryByText("Cita para conocer a Oreo")).not.toBeInTheDocument();
  });

  it("al cambiar a Pasadas muestra el historial sin acciones", () => {
    conIntl(<CitasCliente proximas={[prox]} pasadas={[pas]} />);
    fireEvent.click(screen.getByRole("tab", { name: messages.citas.pasadas }));
    expect(screen.getByText("Cita para conocer a Oreo")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: messages.citas.marcarRealizada })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: RED** — falla (no existe el componente).

- [ ] **Step 4: Componente** — `src/components/citas/CitasCliente.tsx`:
```tsx
"use client";

import { Clock, PawPrint } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CitaAccionesPanel } from "@/components/citas/CitaAccionesPanel";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

export type CitaVista = {
  id: string;
  status: "pending" | "confirmed" | "cancelled" | "done" | "no_show";
  starts_at: string;
  cancel_reason: string | null;
  adopterName: string | null;
  animal: { name: string; slug: string; cover: string | null } | null;
};

const CLAVE_ESTADO: Record<CitaVista["status"], string> = {
  pending: "estadoPendiente",
  confirmed: "estadoConfirmada",
  cancelled: "estadoCancelada",
  done: "estadoRealizada",
  no_show: "estadoNoShow",
};
const BADGE_ESTADO: Record<CitaVista["status"], string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-secondary-container text-on-secondary-container",
  cancelled: "bg-stone-200 text-stone-700",
  done: "bg-sky-100 text-sky-800",
  no_show: "bg-rose-100 text-rose-800",
};

const HORA = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid" });
const DIA = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" });
const YMD = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Madrid" });

function iniciales(nombre: string): string {
  const p = nombre.trim().split(/\s+/).slice(0, 2);
  return p.map((s) => s[0]?.toUpperCase() ?? "").join("") || "?";
}

export function CitasCliente({ proximas, pasadas }: { proximas: CitaVista[]; pasadas: CitaVista[] }) {
  const t = useTranslations("citas");
  const [tab, setTab] = useState<"proximas" | "pasadas">("proximas");
  const lista = tab === "proximas" ? proximas : pasadas;

  // Etiqueta Hoy/Mañana/fecha corta + hora (Europe/Madrid).
  function cuando(startsAt: string): string {
    const d = new Date(startsAt);
    const hoy = YMD.format(new Date());
    const manana = YMD.format(new Date(Date.now() + 86400000));
    const dia = YMD.format(d);
    const etiqueta = dia === hoy ? t("hoy") : dia === manana ? t("manana") : DIA.format(d);
    return `${etiqueta}, ${HORA.format(d)}`;
  }

  return (
    <div>
      <div role="tablist" className="flex gap-6 border-b border-border">
        {(["proximas", "pasadas"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn(
              "-mb-px border-b-2 px-1 py-2.5 text-sm font-semibold transition-colors",
              tab === k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t(k)}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {tab === "proximas" ? t("dashboardEmpty") : t("sinPasadas")}
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-4">
          {lista.map((c, i) => {
            const activa = c.status === "pending" || c.status === "confirmed";
            return (
              <li key={c.id}>
                <Reveal delayMs={Math.min(i, 8) * 60}>
                  <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition duration-300 hover:shadow-md sm:flex-row">
                    <div className="relative aspect-video w-full shrink-0 bg-muted sm:aspect-square sm:w-44">
                      {c.animal?.cover ? (
                        <Image
                          src={c.animal.cover}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 100vw, 11rem"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-muted-foreground">
                          <PawPrint className="size-8" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-heading text-lg font-semibold">
                          {c.animal ? (
                            <Link href={`/animales/${c.animal.slug}`} className="hover:underline">
                              {t("cardTitle", { nombre: c.animal.name })}
                            </Link>
                          ) : (
                            t("cardTitle", { nombre: "—" })
                          )}
                        </h3>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_ESTADO[c.status]}`}>
                          {t(CLAVE_ESTADO[c.status])}
                        </span>
                      </div>
                      {c.adopterName && (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                            {iniciales(c.adopterName)}
                          </span>
                          {t("conQuien", { nombre: c.adopterName })}
                        </p>
                      )}
                      <p className="flex items-center gap-2 text-sm">
                        <Clock className="size-4 text-primary" aria-hidden="true" />
                        {cuando(c.starts_at)}
                      </p>
                      {activa ? (
                        <div className="mt-1">
                          <CitaAccionesPanel citaId={c.id} />
                        </div>
                      ) : (
                        c.cancel_reason && <p className="text-xs text-muted-foreground">{c.cancel_reason}</p>
                      )}
                    </div>
                  </article>
                </Reveal>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 5: GREEN** — test pasa. **Step 6:** `npx tsc --noEmit && npx eslint "src/components/citas/CitasCliente.tsx"`. **Step 7:** commit `feat(citas): pestañas Próximas/Pasadas con tarjetas de cita`.

---

### Task 3: Página `citas/page.tsx` + lateral + reescritura del test

**Files:** Modify `src/app/(shelter)/panel/citas/page.tsx`, Test `src/app/(shelter)/panel/citas/page.test.tsx`.

**Interfaces:** Consume `CitasCliente`/`CitaVista` (Task 2) y `CalendarioCitas` (Task 1).

- [ ] **Step 1: Test (RED)** — reescribe `page.test.tsx` conservando los mocks de supabase/admin/next-intl/navigation existentes. Casos:
  - cabecera `agendaTitle` + enlace `disponibilidadTitle` → `/panel/agenda`.
  - con la cita activa `c1` (confirmed, futura, Pipa), la pestaña Próximas por defecto muestra "Cita para conocer a Pipa" y el botón `marcarRealizada`.
  - el resumen semanal muestra el título `resumenTitle`.
  - sin citas → `agendaEmpty`.
  - El mock de `adoption_requests` (count de pendientes) debe devolver `{ count: 0 }` cuando se pide `head`; ajusta el `thenable` de `supabase/server` para soportar `.eq().select(...,{head:true})` devolviendo `{ count: state.pendientes ?? 0 }`. (Añade `state.pendientes = 0`.)

  Estructura del nuevo test (adáptala a los helpers del fichero actual):
```tsx
it("cabecera y enlace de disponibilidad", async () => {
  await renderPagina();
  expect(screen.getByText(messages.citas.agendaTitle)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: messages.citas.disponibilidadTitle })).toHaveAttribute("href", "/panel/agenda");
});
it("la pestaña Próximas muestra la cita activa con acción y el resumen semanal", async () => {
  await renderPagina();
  expect(screen.getByText("Cita para conocer a Pipa")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: messages.citas.marcarRealizada })).toBeInTheDocument();
  expect(screen.getByText(messages.citas.resumenTitle)).toBeInTheDocument();
});
it("sin citas muestra el estado vacío", async () => {
  state.citas = [];
  await renderPagina();
  expect(screen.getByText(messages.citas.agendaEmpty)).toBeInTheDocument();
});
```
  (Actualiza el fixture `c1.adoption_requests.animals` para incluir `animal_media: []`.)

- [ ] **Step 2: RED** — falla.

- [ ] **Step 3: Reescribe `page.tsx`** con esta lógica (mantén `createAdminClient` para nombres; añade cover, métricas y datos de calendario):

Puntos clave del cálculo (Europe/Madrid):
```tsx
const YMD = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Madrid" });
const ymd = (d: Date) => YMD.format(d);                    // "2026-07-16"
const ahora = new Date();
const [aa, mm, dd] = ymd(ahora).split("-").map(Number);    // año, mes(1-12), día

// Semana ISO (Lun-Dom) que contiene hoy, por fechas de calendario.
const hoyProxy = new Date(`${ymd(ahora)}T00:00:00Z`);
const offLun = (hoyProxy.getUTCDay() + 6) % 7;
const semana = new Set(
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoyProxy);
    d.setUTCDate(d.getUTCDate() - offLun + i);
    return d.toISOString().slice(0, 10);
  }),
);

const activa = (c: Cita) => c.status === "pending" || c.status === "confirmed";
const proximas = citas.filter((c) => activa(c) && new Date(c.starts_at).getTime() >= ahora.getTime());
const pasadas = citas
  .filter((c) => !(activa(c) && new Date(c.starts_at).getTime() >= ahora.getTime()))
  .reverse();

const citasEstaSemana = citas.filter((c) => activa(c) && semana.has(ymd(new Date(c.starts_at)))).length;
const done = citas.filter((c) => c.status === "done").length;
const noShow = citas.filter((c) => c.status === "no_show").length;
const tasaAsistencia = done + noShow > 0 ? Math.round((done / (done + noShow)) * 100) : null;

// Días del mes actual con cita.
const diasConCitas = [
  ...new Set(
    citas
      .map((c) => ymd(new Date(c.starts_at)))
      .filter((s) => Number(s.slice(0, 4)) === aa && Number(s.slice(5, 7)) === mm)
      .map((s) => Number(s.slice(8, 10))),
  ),
];
```

Cuenta de solicitudes pendientes (cliente de sesión; misma que el dashboard):
```tsx
const { count: nuevasSolicitudes } = await supabase
  .from("adoption_requests")
  .select("id", { count: "exact", head: true })
  .eq("status", "pending");
```

`Cita` amplía a `adoption_requests(animals(name, slug, animal_media(url,is_cover,sort_order)))`; añade `portada()` (como en otras vistas) y mapea `animal: { name, slug, cover }` a `CitaVista`.

Render:
```tsx
return (
  <section className="mx-auto max-w-6xl px-4 py-8">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-heading text-3xl font-bold">{t("agendaTitle")}</h1>
        <p className="mt-1 text-muted-foreground">{t("agendaSubtitle")}</p>
      </div>
      <Link href="/panel/agenda" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
        {t("disponibilidadTitle")}
      </Link>
    </header>

    {citas.length === 0 ? (
      <div className="mt-8 rounded-2xl border border-border bg-card px-6 py-14 text-center text-muted-foreground shadow-soft">
        {t("agendaEmpty")}
      </div>
    ) : (
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <CitasCliente proximas={proximas} pasadas={pasadas} />
        <aside className="flex flex-col gap-6">
          <CalendarioCitas year={aa} month={mm - 1} todayDay={dd} diasConCitas={diasConCitas} />
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-heading text-lg font-semibold">{t("resumenTitle")}</h2>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between"><dt className="text-muted-foreground">{t("resumenSemana")}</dt><dd className="font-heading text-lg font-bold tabular-nums">{citasEstaSemana}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-muted-foreground">{t("resumenSolicitudes")}</dt><dd className="font-heading text-lg font-bold tabular-nums">{nuevasSolicitudes ?? 0}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-muted-foreground">{t("resumenAsistencia")}</dt><dd className="font-heading text-lg font-bold tabular-nums text-tertiary">{tasaAsistencia === null ? "—" : `${tasaAsistencia}%`}</dd></div>
            </dl>
          </div>
          <div className="rounded-2xl border border-border bg-surface-container-low p-5 shadow-soft">
            <p className="text-sm italic text-muted-foreground">{t("consejoTexto")}</p>
            <Link href="/guias" className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-tertiary px-4 py-2 text-sm font-semibold text-on-tertiary transition-colors hover:bg-tertiary/90">
              {t("verRecursos")}
            </Link>
          </div>
        </aside>
      </div>
    )}
  </section>
);
```

- [ ] **Step 4: GREEN** — `npm run test -- "src/app/(shelter)/panel/citas/page.test.tsx"` pasa.
- [ ] **Step 5:** suite completa `npm run test` + `npx tsc --noEmit` + `npm run lint` (ignorar el warning preexistente `_fila`).
- [ ] **Step 6:** commit `feat(citas): rediseño de la agenda de citas de la protectora`.

---

## Self-Review
- Wireframe: tarjetas con foto + estado + adoptante + tiempo → Task 2. Pestañas → Task 2. Calendario → Task 1. Resumen + consejo → Task 3. ✔
- Descartes (modalidad, nueva cita, editar, ver perfil) → no se implementan; botón = disponibilidad. ✔
- Acciones reales vía `CitaAccionesPanel` → Task 2. ✔
- Métricas y calendario en Madrid → Task 3 (proxy UTC-midnight para aritmética de fechas). ✔
- i18n nuevas claves → Task 2 Step 1. ✔
- Tipos: `CitaVista` (Task 2) consumido por page (Task 3); `CalendarioCitas` props (Task 1) alimentadas por page. ✔
