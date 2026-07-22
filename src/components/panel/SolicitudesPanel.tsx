"use client";

import { GraduationCap, Home, MessageSquareText, PawPrint, StickyNote, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormSection } from "@/components/ui/FormSection";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/button";
import type { EstadoSolicitud } from "@/lib/schemas/solicitud";
import { cn } from "@/lib/utils";

export type SolicitudRow = {
  id: string;
  status: EstadoSolicitud;
  created_at: string;
  message: string | null;
  shelter_notes: string | null;
  questionnaire: Record<string, unknown> | null;
  adopterName: string;
  animal: { id: string; name: string; slug: string; status: string; cover: string | null };
};

const BADGE_CLASE: Record<EstadoSolicitud, string> = {
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-tertiary/10 text-tertiary",
  rejected: "bg-destructive/10 text-destructive",
  withdrawn: "bg-muted text-muted-foreground",
  completed: "bg-primary/10 text-primary",
};

// El cuestionario se agrupa en secciones temáticas (patrón FormSection). Cada
// entrada es [clave_en_questionnaire, clave_i18n_de_etiqueta].
const SECCIONES: { titulo: string; icon: LucideIcon; campos: [string, string][] }[] = [
  {
    titulo: "sectionVivienda",
    icon: Home,
    campos: [
      ["vivienda", "qVivienda"],
      ["regimen", "qRegimen"],
      ["permiten_animales", "qPermitenAnimales"],
    ],
  },
  {
    titulo: "sectionConvivencia",
    icon: Users,
    campos: [
      ["convivientes", "qConvivientes"],
      ["ninos_edades", "qNinosEdades"],
      ["otros_animales", "qOtrosAnimales"],
      ["todos_de_acuerdo", "qTodosDeAcuerdo"],
    ],
  },
  {
    titulo: "sectionExperiencia",
    icon: GraduationCap,
    campos: [
      ["experiencia", "qExperiencia"],
      ["horas_solo", "qHorasSolo"],
    ],
  },
];

// Enum → clave i18n del namespace `solicitud` (reutiliza las del formulario de alta).
const VIVIENDA_LABEL: Record<string, string> = {
  piso: "viviendaPiso",
  casa_jardin: "viviendaCasaJardin",
  otro: "viviendaOtro",
};
const REGIMEN_LABEL: Record<string, string> = {
  propiedad: "regimenPropiedad",
  alquiler: "regimenAlquiler",
};

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).slice(0, 2);
  const ini = partes.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return ini || "?";
}

export function SolicitudesPanel({ solicitudes }: { solicitudes: SolicitudRow[] }) {
  const t = useTranslations("solicitudesPanel");
  const ts = useTranslations("solicitud");
  const router = useRouter();
  const [rows, setRows] = useState(solicitudes);
  const [seleccionId, setSeleccionId] = useState<string | null>(null);
  const [notas, setNotas] = useState("");
  const [motivo, setMotivo] = useState("");
  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(false);
  const [notasGuardadas, setNotasGuardadas] = useState(false);

  const seleccion = rows.find((r) => r.id === seleccionId) ?? null;

  // Humaniza un valor del cuestionario según su campo.
  function formatear(campo: string, v: unknown): string {
    if (campo === "vivienda" && typeof v === "string" && VIVIENDA_LABEL[v]) return ts(VIVIENDA_LABEL[v]);
    if (campo === "regimen" && typeof v === "string" && REGIMEN_LABEL[v]) return ts(REGIMEN_LABEL[v]);
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "boolean") return v ? t("yes") : t("no");
    if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
    return String(v);
  }

  function seleccionar(row: SolicitudRow) {
    setSeleccionId(row.id);
    setNotas(row.shelter_notes ?? "");
    setMotivo("");
    setMostrarRechazo(false);
    setError(false);
    setNotasGuardadas(false);
  }

  async function accionar(body: Record<string, unknown>) {
    if (!seleccion) return;
    setGuardando(true);
    setError(false);
    try {
      const res = await fetch(`/api/solicitudes/${seleccion.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      const { data } = await res.json();
      setRows((prev) =>
        prev.map((r) =>
          r.id === seleccion.id
            ? { ...r, status: data.status ?? r.status, shelter_notes: data.shelter_notes ?? r.shelter_notes }
            : r,
        ),
      );
      if (body.accion === "note") setNotasGuardadas(true);
      setMostrarRechazo(false);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setGuardando(false);
    }
  }

  // Agrupa por animal manteniendo el orden de llegada.
  const grupos: { animal: SolicitudRow["animal"]; items: SolicitudRow[] }[] = [];
  for (const row of rows) {
    let grupo = grupos.find((g) => g.animal.id === row.animal.id);
    if (!grupo) {
      grupo = { animal: row.animal, items: [] };
      grupos.push(grupo);
    }
    grupo.items.push(row);
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <PawPrint className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-heading text-lg font-semibold">{t("emptyTitle")}</h2>
        <p className="mt-2 text-muted-foreground">{t("emptyText")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr] lg:items-start">
      {/* Maestra: solicitudes agrupadas por animal */}
      <ul aria-label={t("title")} className="flex flex-col gap-4">
        {grupos.map((grupo, gi) => (
          <li key={grupo.animal.id}>
            <Reveal delayMs={Math.min(gi, 6) * 70}>
              <div className="rounded-2xl border border-border bg-card p-3 shadow-soft">
                <div className="mb-2 flex items-center gap-3 px-1">
                  <Miniatura url={grupo.animal.cover} alt={grupo.animal.name} />
                  <div className="min-w-0">
                    <p className="truncate font-heading font-semibold">{grupo.animal.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("requestsCount", { n: grupo.items.length })}
                    </p>
                  </div>
                </div>
                <ul className="flex flex-col divide-y divide-border">
                  {grupo.items.map((row) => {
                    const activo = seleccionId === row.id;
                    return (
                      <li key={row.id}>
                        <button
                          type="button"
                          onClick={() => seleccionar(row)}
                          aria-current={activo ? "true" : undefined}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent/40",
                            activo && "bg-accent/60",
                          )}
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {iniciales(row.adopterName)}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-medium">{row.adopterName}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(row.created_at).toLocaleDateString("es-ES")}
                            </span>
                          </span>
                          <StatusChip status={row.status} t={t} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>

      {/* Detalle de la solicitud seleccionada */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
        {!seleccion ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <MessageSquareText className="size-6" aria-hidden="true" />
            </span>
            <p className="text-muted-foreground">{t("selectPrompt")}</p>
          </div>
        ) : (
          <Reveal key={seleccion.id} className="flex flex-col gap-6">
            <header className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {iniciales(seleccion.adopterName)}
                </span>
                <div>
                  <h2 className="font-heading text-xl font-semibold">
                    {t("requestFrom", { nombre: seleccion.adopterName })}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("requestedOn", { fecha: new Date(seleccion.created_at).toLocaleDateString("es-ES") })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusChip status={seleccion.status} t={t} />
                <span className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3">
                  <Miniatura url={seleccion.animal.cover} alt={seleccion.animal.name} size={28} />
                  <span className="text-sm font-medium">{seleccion.animal.name}</span>
                </span>
              </div>
            </header>

            {/* Cuestionario en secciones */}
            {seleccion.questionnaire && (
              <div className="divide-y divide-border">
                {SECCIONES.map((sec) => (
                  <FormSection key={sec.titulo} icon={sec.icon} title={t(sec.titulo)} className="py-5 first:pt-0">
                    <dl className="divide-y divide-border rounded-xl border border-border">
                      {sec.campos.map(([campo, clave]) => (
                        <div key={campo} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                          <dt className="text-muted-foreground">{t(clave)}</dt>
                          <dd className="text-right font-medium text-foreground">
                            {formatear(campo, seleccion.questionnaire?.[campo])}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </FormSection>
                ))}
              </div>
            )}

            {/* Mensaje del adoptante */}
            {seleccion.message && (
              <section className="flex flex-col gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MessageSquareText className="size-4 text-primary" aria-hidden="true" />
                  {t("messageTitle")}
                </h3>
                <p className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed">
                  {seleccion.message}
                </p>
              </section>
            )}

            {/* Notas internas */}
            <section className="flex flex-col gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <StickyNote className="size-4 text-primary" aria-hidden="true" />
                {t("notesTitle")}
              </h3>
              <textarea
                rows={3}
                placeholder={t("notesPlaceholder")}
                value={notas}
                onChange={(e) => {
                  setNotas(e.target.value);
                  setNotasGuardadas(false);
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={guardando}
                  onClick={() => accionar({ accion: "note", nota: notas })}
                >
                  {t("saveNotes")}
                </Button>
                {notasGuardadas && <span className="text-sm text-tertiary">{t("notesSaved")}</span>}
              </div>
            </section>

            {/* Acciones sobre la solicitud */}
            {seleccion.status === "pending" && (
              <section className="flex flex-col gap-3 border-t border-border pt-5">
                {!mostrarRechazo ? (
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" disabled={guardando} onClick={() => accionar({ accion: "approve" })}>
                      {t("approve")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={guardando}
                      onClick={() => setMostrarRechazo(true)}
                    >
                      {t("reject")}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <textarea
                      rows={2}
                      placeholder={t("rejectReasonPlaceholder")}
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={guardando}
                        onClick={() => motivo.trim() && accionar({ accion: "reject", motivo })}
                      >
                        {t("confirmReject")}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setMostrarRechazo(false)}>
                        {t("cancel")}
                      </Button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {seleccion.status === "approved" && (
              <section className="border-t border-border pt-5">
                <Button
                  type="button"
                  disabled={guardando}
                  onClick={() => {
                    if (window.confirm(t("confirmComplete", { nombre: seleccion.animal.name }))) {
                      accionar({ accion: "complete" });
                    }
                  }}
                >
                  {t("complete")}
                </Button>
              </section>
            )}

            {error && <p className="text-sm text-destructive">{t("actionError")}</p>}
          </Reveal>
        )}
      </div>
    </div>
  );
}

function StatusChip({ status, t }: { status: EstadoSolicitud; t: (k: string) => string }) {
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE_CLASE[status]}`}>
      {t(`status${status.charAt(0).toUpperCase()}${status.slice(1)}`)}
    </span>
  );
}

function Miniatura({ url, alt, size = 40 }: { url: string | null; alt: string; size?: number }) {
  if (!url) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-lg bg-surface-container text-muted-foreground"
        style={{ width: size, height: size }}
      >
        <PawPrint className="size-5" aria-hidden="true" />
      </span>
    );
  }
  return (
    <Image
      src={url}
      alt={alt}
      width={size}
      height={size}
      className="shrink-0 rounded-lg object-cover"
      style={{ width: size, height: size }}
    />
  );
}
