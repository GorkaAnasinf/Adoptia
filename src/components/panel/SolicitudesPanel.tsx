"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { EstadoSolicitud } from "@/lib/schemas/solicitud";

export type SolicitudRow = {
  id: string;
  status: EstadoSolicitud;
  created_at: string;
  message: string | null;
  shelter_notes: string | null;
  questionnaire: Record<string, unknown> | null;
  adopterName: string;
  animal: { id: string; name: string; slug: string; status: string };
};

const BADGE_CLASE: Record<EstadoSolicitud, string> = {
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-tertiary/10 text-tertiary",
  rejected: "bg-destructive/10 text-destructive",
  withdrawn: "bg-muted text-muted-foreground",
  completed: "bg-primary/10 text-primary",
};

const CAMPOS_CUESTIONARIO: [string, string][] = [
  ["vivienda", "qVivienda"],
  ["regimen", "qRegimen"],
  ["permiten_animales", "qPermitenAnimales"],
  ["convivientes", "qConvivientes"],
  ["ninos_edades", "qNinosEdades"],
  ["otros_animales", "qOtrosAnimales"],
  ["experiencia", "qExperiencia"],
  ["horas_solo", "qHorasSolo"],
  ["todos_de_acuerdo", "qTodosDeAcuerdo"],
];

function formatearValor(v: unknown, t: (k: string) => string): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? t("yes") : t("no");
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  return String(v);
}

export function SolicitudesPanel({ solicitudes }: { solicitudes: SolicitudRow[] }) {
  const t = useTranslations("solicitudesPanel");
  const router = useRouter();
  const [rows, setRows] = useState(solicitudes);
  const [seleccionId, setSeleccionId] = useState<string | null>(null);
  const [notas, setNotas] = useState("");
  const [motivo, setMotivo] = useState("");
  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(false);

  const seleccion = rows.find((r) => r.id === seleccionId) ?? null;

  function seleccionar(row: SolicitudRow) {
    setSeleccionId(row.id);
    setNotas(row.shelter_notes ?? "");
    setMotivo("");
    setMostrarRechazo(false);
    setError(false);
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
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h2 className="font-heading text-lg font-semibold">{t("emptyTitle")}</h2>
        <p className="mt-2 text-muted-foreground">{t("emptyText")}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <ul aria-label={t("title")} className="flex flex-col gap-4">
        {grupos.map((grupo) => (
          <li key={grupo.animal.id} className="rounded-xl border border-border bg-card p-3">
            <p className="mb-2 px-1 text-sm font-semibold text-foreground">{grupo.animal.name}</p>
            <ul className="flex flex-col divide-y divide-border">
              {grupo.items.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => seleccionar(row)}
                    aria-current={seleccionId === row.id ? "true" : undefined}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-accent/40 aria-[current=true]:bg-accent/60"
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">{row.adopterName}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(row.created_at).toLocaleDateString("es-ES")}
                      </span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${BADGE_CLASE[row.status]}`}>
                      {t(`status${capitaliza(row.status)}`)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border border-border bg-card p-5">
        {!seleccion ? (
          <p className="text-muted-foreground">{t("selectPrompt")}</p>
        ) : (
          <div className="flex flex-col gap-5">
            <header>
              <h2 className="font-heading text-lg font-semibold">
                {t("requestFrom", { nombre: seleccion.adopterName })}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("requestedOn", { fecha: new Date(seleccion.created_at).toLocaleDateString("es-ES") })}
              </p>
            </header>

            {seleccion.questionnaire && (
              <section>
                <h3 className="mb-2 text-sm font-semibold text-foreground">{t("questionnaireTitle")}</h3>
                <dl className="divide-y divide-border rounded-xl border border-border">
                  {CAMPOS_CUESTIONARIO.map(([campo, clave]) => (
                    <div key={campo} className="flex justify-between gap-3 px-3 py-2 text-sm">
                      <dt className="text-muted-foreground">{t(clave)}</dt>
                      <dd className="font-medium text-foreground">
                        {formatearValor(seleccion.questionnaire?.[campo], t)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            {seleccion.message && (
              <section>
                <h3 className="mb-1 text-sm font-semibold text-foreground">{t("messageTitle")}</h3>
                <p className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">{seleccion.message}</p>
              </section>
            )}

            <section>
              <h3 className="mb-1 text-sm font-semibold text-foreground">{t("notesTitle")}</h3>
              <textarea
                rows={3}
                placeholder={t("notesPlaceholder")}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                className="mt-2"
                disabled={guardando}
                onClick={() => accionar({ accion: "note", nota: notas })}
              >
                {t("saveNotes")}
              </Button>
            </section>

            {seleccion.status === "pending" && (
              <section className="flex flex-col gap-3 border-t border-border pt-4">
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
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
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
              <section className="border-t border-border pt-4">
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
          </div>
        )}
      </div>
    </div>
  );
}

function capitaliza(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
