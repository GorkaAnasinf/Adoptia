"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ZodType } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  experienciaSchema,
  hogarSchema,
  motivacionSchema,
  REGIMENES,
  viviendaSchema,
  VIVIENDAS,
  type EstadoSolicitud,
} from "@/lib/schemas/solicitud";
import { Stepper } from "@/components/shelters/Stepper";

type Vivienda = (typeof VIVIENDAS)[number];
type Regimen = (typeof REGIMENES)[number];

type Form = {
  vivienda?: Vivienda;
  regimen?: Regimen;
  permiten_animales?: boolean;
  convivientes?: number;
  ninos_edades: number[];
  otros_animales: string;
  experiencia: string;
  horas_solo?: number;
  todos_de_acuerdo: boolean;
  message: string;
  aceptaRgpd: boolean;
};

type Errores = Record<string, string>;
type Resultado = "ok" | "duplicate" | "not_available" | "error" | null;

const CLAVE_ERROR: Record<string, string> = {
  vivienda: "errGeneric",
  regimen: "errGeneric",
  permiten_animales: "errPermitenAnimales",
  convivientes: "errGeneric",
  horas_solo: "errHorasSolo",
  aceptaRgpd: "errAceptaRgpd",
};

const inicial: Form = {
  ninos_edades: [],
  otros_animales: "",
  experiencia: "",
  todos_de_acuerdo: false,
  message: "",
  aceptaRgpd: false,
};

export function SolicitudWizard({
  animalId,
  animalSlug,
  animalName,
}: {
  animalId: string;
  animalSlug: string;
  animalName: string;
}) {
  const t = useTranslations("solicitud");
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [maxVisto, setMaxVisto] = useState(0);
  const [form, setForm] = useState<Form>(inicial);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Resultado>(null);

  function set<K extends keyof Form>(campo: K, valor: Form[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  const SCHEMAS: ZodType[] = [viviendaSchema, hogarSchema, experienciaSchema, motivacionSchema];

  function validar(schema: ZodType): boolean {
    const res = schema.safeParse(form);
    if (res.success) {
      setErrores({});
      return true;
    }
    const errs: Errores = {};
    for (const issue of res.error.issues) {
      const campo = String(issue.path[0]);
      errs[campo] = t(CLAVE_ERROR[campo] ?? "errGeneric");
    }
    setErrores(errs);
    return false;
  }

  function siguiente() {
    if (!validar(SCHEMAS[paso])) return;
    setPaso((p) => {
      const sig = p + 1;
      setMaxVisto((m) => Math.max(m, sig));
      return sig;
    });
  }

  function atras() {
    setPaso((p) => Math.max(0, p - 1));
  }

  async function enviar() {
    if (!validar(motivacionSchema)) return;
    setEnviando(true);
    setResultado(null);
    try {
      const res = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          animal_id: animalId,
          questionnaire: {
            vivienda: form.vivienda,
            regimen: form.regimen,
            permiten_animales: form.permiten_animales,
            convivientes: form.convivientes,
            ninos_edades: form.ninos_edades,
            otros_animales: form.otros_animales,
            experiencia: form.experiencia,
            horas_solo: form.horas_solo,
            todos_de_acuerdo: form.todos_de_acuerdo,
            message: form.message,
            aceptaRgpd: form.aceptaRgpd,
          },
          message: form.message,
        }),
      });
      if (res.status === 201) {
        setResultado("ok");
        return;
      }
      const body = await res.json().catch(() => null);
      if (res.status === 409) {
        setResultado("duplicate");
      } else if (res.status === 403) {
        setResultado("not_available");
      } else {
        setResultado("error");
      }
      void body;
    } catch {
      setResultado("error");
    } finally {
      setEnviando(false);
    }
  }

  const maxAlcanzable = maxVisto;

  function irAPaso(i: number) {
    if (i === paso || i > maxAlcanzable) return;
    if (i > paso && !validar(SCHEMAS[paso])) return;
    setPaso(i);
  }

  if (resultado === "ok") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground">{t("successTitle")}</h1>
        <p className="text-muted-foreground">{t("successBody")}</p>
        <Button size="lg" onClick={() => router.push("/mi-cuenta")}>
          {t("goToAccount")}
        </Button>
      </div>
    );
  }

  if (resultado === "duplicate") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("duplicateTitle")}</h1>
        <p className="text-muted-foreground">{t("duplicateBody")}</p>
        <Button size="lg" onClick={() => router.push("/mi-cuenta")}>
          {t("goToAccount")}
        </Button>
      </div>
    );
  }

  if (resultado === "not_available") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold text-foreground">{t("notAvailableTitle")}</h1>
        <p className="text-muted-foreground">{t("notAvailableBody")}</p>
        <Button size="lg" onClick={() => router.push("/animales")}>
          {t("browseAnimals")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">{t("title")}</h1>
      <Link href={`/animales/${animalSlug}`} className="mt-1 block text-muted-foreground hover:underline">
        {t("subtitleFor", { nombre: animalName })}
      </Link>

      <div className="mt-6">
        <Stepper
          pasos={[t("stepVivienda"), t("stepHogar"), t("stepExperiencia"), t("stepMotivacion")]}
          actual={paso}
          maxAlcanzable={maxAlcanzable}
          onStepClick={irAPaso}
          label={t("stepperLabel")}
        />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        {paso === 0 && (
          <fieldset className="flex flex-col gap-4">
            <div>
              <legend className="mb-2 text-sm font-medium text-foreground">{t("vivienda")}</legend>
              <div className="flex flex-col gap-2">
                {(
                  [
                    ["piso", "viviendaPiso"],
                    ["casa_jardin", "viviendaCasaJardin"],
                    ["otro", "viviendaOtro"],
                  ] as const
                ).map(([valor, clave]) => (
                  <label key={valor} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="vivienda"
                      checked={form.vivienda === valor}
                      onChange={() => set("vivienda", valor)}
                    />
                    {t(clave)}
                  </label>
                ))}
              </div>
              {errores.vivienda && <p className="mt-1 text-sm text-destructive">{errores.vivienda}</p>}
            </div>

            <div>
              <legend className="mb-2 text-sm font-medium text-foreground">{t("regimen")}</legend>
              <div className="flex flex-col gap-2">
                {(
                  [
                    ["propiedad", "regimenPropiedad"],
                    ["alquiler", "regimenAlquiler"],
                  ] as const
                ).map(([valor, clave]) => (
                  <label key={valor} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="regimen"
                      checked={form.regimen === valor}
                      onChange={() => set("regimen", valor)}
                    />
                    {t(clave)}
                  </label>
                ))}
              </div>
            </div>

            {form.regimen === "alquiler" && (
              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.permiten_animales ?? false}
                    onChange={(e) => set("permiten_animales", e.target.checked)}
                    aria-invalid={Boolean(errores.permiten_animales)}
                  />
                  {t("permitenAnimales")}
                </label>
                {errores.permiten_animales && (
                  <p className="mt-1 text-sm text-destructive">{errores.permiten_animales}</p>
                )}
              </div>
            )}
          </fieldset>
        )}

        {paso === 1 && (
          <div className="flex flex-col gap-4">
            <Campo id="convivientes" label={t("convivientes")} error={errores.convivientes}>
              <Input
                id="convivientes"
                type="number"
                min={0}
                value={form.convivientes ?? ""}
                aria-invalid={Boolean(errores.convivientes)}
                onChange={(e) => set("convivientes", e.target.value === "" ? undefined : Number(e.target.value))}
              />
            </Campo>
            <Campo id="ninos_edades" label={t("ninosEdades")}>
              <Input
                id="ninos_edades"
                placeholder={t("ninosEdadesPlaceholder")}
                value={form.ninos_edades.join(", ")}
                onChange={(e) =>
                  set(
                    "ninos_edades",
                    e.target.value
                      .split(",")
                      .map((s) => Number(s.trim()))
                      .filter((n) => !Number.isNaN(n)),
                  )
                }
              />
            </Campo>
            <Campo id="otros_animales" label={t("otrosAnimales")}>
              <textarea
                id="otros_animales"
                rows={3}
                placeholder={t("otrosAnimalesPlaceholder")}
                value={form.otros_animales}
                onChange={(e) => set("otros_animales", e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </Campo>
          </div>
        )}

        {paso === 2 && (
          <div className="flex flex-col gap-4">
            <Campo id="experiencia" label={t("experiencia")}>
              <textarea
                id="experiencia"
                rows={3}
                placeholder={t("experienciaPlaceholder")}
                value={form.experiencia}
                onChange={(e) => set("experiencia", e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </Campo>
            <Campo id="horas_solo" label={t("horasSolo")} error={errores.horas_solo}>
              <Input
                id="horas_solo"
                type="number"
                min={0}
                max={24}
                value={form.horas_solo ?? ""}
                aria-invalid={Boolean(errores.horas_solo)}
                onChange={(e) => set("horas_solo", e.target.value === "" ? undefined : Number(e.target.value))}
              />
            </Campo>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.todos_de_acuerdo}
                onChange={(e) => set("todos_de_acuerdo", e.target.checked)}
              />
              {t("todosDeAcuerdo")}
            </label>
          </div>
        )}

        {paso === 3 && (
          <div className="flex flex-col gap-4">
            <Campo id="message" label={t("message")}>
              <textarea
                id="message"
                rows={4}
                placeholder={t("messagePlaceholder")}
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </Campo>

            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <p className="mb-2 font-semibold text-foreground">{t("summaryTitle")}</p>
              <ul className="flex flex-col gap-1 text-muted-foreground">
                <li>
                  {t("vivienda")}: {form.vivienda ? t(vividendaClave(form.vivienda)) : "—"}
                </li>
                <li>
                  {t("convivientes")}: {form.convivientes ?? "—"}
                </li>
                <li>
                  {t("horasSolo")}: {form.horas_solo ?? "—"}
                </li>
              </ul>
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.aceptaRgpd}
                aria-invalid={Boolean(errores.aceptaRgpd)}
                onChange={(e) => set("aceptaRgpd", e.target.checked)}
              />
              {t("aceptaRgpd")}
            </label>
            {errores.aceptaRgpd && <p className="text-sm text-destructive">{errores.aceptaRgpd}</p>}
            {resultado === "error" && <p className="text-sm text-destructive">{t("errorGeneric")}</p>}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        {paso > 0 ? (
          <Button type="button" variant="ghost" onClick={atras}>
            {t("back")}
          </Button>
        ) : (
          <span />
        )}
        {paso < 3 ? (
          <Button type="button" size="lg" onClick={siguiente}>
            {t("next")}
          </Button>
        ) : (
          <Button type="button" size="lg" onClick={enviar} disabled={enviando}>
            {enviando ? t("sending") : t("submit")}
          </Button>
        )}
      </div>
    </div>
  );
}

function vividendaClave(v: Vivienda): "viviendaPiso" | "viviendaCasaJardin" | "viviendaOtro" {
  return v === "piso" ? "viviendaPiso" : v === "casa_jardin" ? "viviendaCasaJardin" : "viviendaOtro";
}

function Campo({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export type { EstadoSolicitud };
