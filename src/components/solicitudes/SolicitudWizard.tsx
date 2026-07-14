"use client";

import { Building2, House, PawPrint, Trees } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ZodType } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  experienciaSchema,
  hogarSchema,
  motivacionSchema,
  REGIMENES,
  viviendaSchema,
  VIVIENDAS,
  type EstadoSolicitud,
} from "@/lib/schemas/solicitud";

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

const VIVIENDA_ICONO = {
  piso: Building2,
  casa_jardin: Trees,
  otro: House,
} as const;

const TOTAL_PASOS = 4;

export function SolicitudWizard({
  animalId,
  animalSlug,
  animalName,
  animalPhoto = null,
}: {
  animalId: string;
  animalSlug: string;
  animalName: string;
  animalPhoto?: string | null;
}) {
  const t = useTranslations("solicitud");
  const router = useRouter();
  const [paso, setPaso] = useState(0);
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
    setPaso((p) => p + 1);
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
        <Button size="lg" asChild>
          <Link href="/mi-cuenta/solicitudes">{t("viewRequestStatus")}</Link>
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

  const phases = [t("phaseVivienda"), t("phaseHogar"), t("phaseExperiencia"), t("phaseMotivacion")];
  const headings = [
    t("headingVivienda"),
    t("headingHogar"),
    t("headingExperiencia"),
    t("headingMotivacion"),
  ];
  const progreso = Math.round(((paso + 1) / TOTAL_PASOS) * 100);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-8">
      {/* Cabecera con avatar del animal */}
      <div className="flex items-center gap-3">
        <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted ring-2 ring-primary/15">
          {animalPhoto ? (
            <Image src={animalPhoto} alt="" fill sizes="44px" className="object-cover" />
          ) : (
            <PawPrint className="size-5 text-primary" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-heading text-xl font-bold text-foreground sm:text-2xl">
            {t("appTitle", { nombre: animalName })}
          </h1>
          <Link
            href={`/animales/${animalSlug}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            {t("title")}
          </Link>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mt-6" aria-label={t("stepperLabel")}>
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold text-primary">
            {t("progress", { actual: paso + 1, total: TOTAL_PASOS })}
          </span>
          <span className="font-medium text-muted-foreground">{phases[paso]}</span>
        </div>
        <div
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={paso + 1}
          aria-valuemin={1}
          aria-valuemax={TOTAL_PASOS}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${progreso}%` }}
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
        <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">{headings[paso]}</h2>

        <div className="mt-5">
          {paso === 0 && (
            <fieldset className="flex flex-col gap-6">
              <div>
                <legend className="mb-2 text-sm font-medium text-foreground">{t("vivienda")}</legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {(
                    [
                      ["piso", "viviendaPiso"],
                      ["casa_jardin", "viviendaCasaJardin"],
                      ["otro", "viviendaOtro"],
                    ] as const
                  ).map(([valor, clave]) => {
                    const Icono = VIVIENDA_ICONO[valor];
                    const activo = form.vivienda === valor;
                    return (
                      <label
                        key={valor}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors",
                          "focus-within:ring-[3px] focus-within:ring-ring/40",
                          activo
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border bg-background text-foreground hover:border-primary/40",
                        )}
                      >
                        <input
                          type="radio"
                          name="vivienda"
                          className="sr-only"
                          checked={activo}
                          onChange={() => set("vivienda", valor)}
                        />
                        <Icono
                          className={cn("size-5 shrink-0", activo ? "text-primary" : "text-muted-foreground")}
                          aria-hidden="true"
                        />
                        {t(clave)}
                      </label>
                    );
                  })}
                </div>
                {errores.vivienda && <p className="mt-2 text-sm text-destructive">{errores.vivienda}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-end">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="regimen">{t("regimen")}</Label>
                  <div className="relative">
                    <select
                      id="regimen"
                      value={form.regimen ?? ""}
                      onChange={(e) => set("regimen", (e.target.value || undefined) as Regimen | undefined)}
                      className="h-11 w-full appearance-none rounded-md border border-input bg-muted px-3 pr-9 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <option value="" disabled>
                        {t("regimen")}
                      </option>
                      <option value="propiedad">{t("regimenPropiedad")}</option>
                      <option value="alquiler">{t("regimenAlquiler")}</option>
                    </select>
                    <svg
                      className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>

                {form.regimen === "alquiler" && (
                  <div>
                    <div className="flex items-center justify-between gap-3 rounded-md border border-input bg-background px-3 py-2.5">
                      <span id="permiten-animales-label" className="text-sm text-foreground">
                        {t("permitenAnimales")}
                      </span>
                      <Switch
                        checked={form.permiten_animales ?? false}
                        onCheckedChange={(v) => set("permiten_animales", v)}
                        aria-labelledby="permiten-animales-label"
                        aria-invalid={Boolean(errores.permiten_animales)}
                      />
                    </div>
                    {errores.permiten_animales && (
                      <p className="mt-1 text-sm text-destructive">{errores.permiten_animales}</p>
                    )}
                  </div>
                )}
              </div>
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
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
              </Campo>

              <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
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

        <div className="mt-7 flex items-center justify-between gap-3 border-t border-border pt-5">
          {paso > 0 ? (
            <Button type="button" variant="ghost" onClick={atras}>
              {t("back")}
            </Button>
          ) : (
            <span />
          )}
          {paso < TOTAL_PASOS - 1 ? (
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
