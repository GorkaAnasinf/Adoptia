"use client";

import { Building2, Check, Lightbulb, MapPin, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ZodType } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Sugerencia } from "@/lib/geocoding";
import {
  entidadSchema,
  perfilSchema,
  ubicacionSchema,
} from "@/lib/schemas/shelter";
import { formToShelterRow, type ShelterForm } from "@/lib/shelter-mapping";
import { createClient } from "@/lib/supabase/client";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { LogoUploader } from "./LogoUploader";
import { MapPinPicker } from "./MapPinPicker";
import { OpeningHoursEditor } from "./OpeningHoursEditor";
import { Stepper } from "./Stepper";

type Form = Partial<ShelterForm>;
type Errores = Record<string, string>;

const CLAVE_ERROR: Record<string, string> = {
  name: "errorName",
  cif: "errorCif",
  email: "errorEmail",
  phone: "errorPhone",
  website: "errorWebsite",
  postalCode: "errorPostalCode",
  lat: "errorNoPin",
  lng: "errorNoPin",
};

export function WizardAlta({
  ownerId,
  shelterId,
  initial,
  mode = "alta",
}: {
  ownerId: string;
  shelterId: string | null;
  initial: Form;
  /** "edicion" = alta ya enviada, la protectora corrige datos en revisión. */
  mode?: "alta" | "edicion";
}) {
  const t = useTranslations("onboarding");
  const esEdicion = mode === "edicion";
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [maxVisto, setMaxVisto] = useState(0);
  const [form, setForm] = useState<Form>({
    openingHours: {},
    socialLinks: {},
    acceptsVolunteers: false,
    acceptsFostering: false,
    ...initial,
  });
  const [errores, setErrores] = useState<Errores>({});
  const [currentId, setCurrentId] = useState<string | null>(shelterId);
  const [enviado, setEnviado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  function set<K extends keyof Form>(campo: K, valor: Form[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function validar(schema: ZodType): boolean {
    const res = schema.safeParse(form);
    if (res.success) {
      setErrores({});
      return true;
    }
    const errs: Errores = {};
    for (const issue of res.error.issues) {
      const campo = String(issue.path[0]);
      errs[campo] = t(CLAVE_ERROR[campo] ?? "errorGeneric");
    }
    setErrores(errs);
    return false;
  }

  async function guardarBorrador(submit: boolean) {
    setGuardando(true);
    try {
      const row = formToShelterRow(form, ownerId, { submit });
      if (currentId) row.id = currentId;
      const supabase = createClient();
      const { data, error } = await supabase
        .from("shelters")
        .upsert(row)
        .select("id")
        .single();
      if (error) {
        // 23505 = unique_violation: CIF o email de entidad ya registrados
        setErrores({ _: t(error.code === "23505" ? "errorDuplicado" : "errorGeneric") });
        return false;
      }
      if (data?.id) setCurrentId(data.id);
      return true;
    } finally {
      setGuardando(false);
    }
  }

  const SCHEMAS = [entidadSchema, ubicacionSchema, perfilSchema];

  async function siguiente() {
    if (!validar(SCHEMAS[paso])) return;
    const ok = await guardarBorrador(false);
    if (ok)
      setPaso((p) => {
        const sig = p + 1;
        setMaxVisto((m) => Math.max(m, sig));
        return sig;
      });
  }

  /** Navegación por el stepper: solo a pasos ya visitados; guarda el borrador. */
  async function irAPaso(i: number) {
    if (i === paso || i > maxVisto) return;
    if (i > paso && !validar(SCHEMAS[paso])) return;
    await guardarBorrador(false);
    setPaso(i);
  }

  async function finalizar() {
    if (!validar(perfilSchema)) return;
    if (await guardarBorrador(true)) {
      setEnviado(true);
      router.refresh();
    }
  }

  /** Al elegir una sugerencia se rellenan los campos y se coloca el pin. */
  function elegirDireccion(s: Sugerencia) {
    setForm((f) => ({
      ...f,
      address: s.address || f.address,
      city: s.city || f.city,
      province: s.province || f.province,
      postalCode: s.postalCode || f.postalCode,
      lat: s.lat,
      lng: s.lng,
    }));
    setErrores({});
  }

  if (enviado) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          {t(esEdicion ? "editSavedTitle" : "reviewTitle")}
        </h1>
        <p className="text-muted-foreground">{t(esEdicion ? "editSavedBody" : "reviewBody")}</p>
        <Button size="lg" onClick={() => router.push("/panel")}>
          {t("goToPanel")}
        </Button>
      </div>
    );
  }

  const subtitulos = [t("subtitleEntity"), t("subtitleLocation"), t("subtitleProfile")];
  const tarjetas = [t("cardEntity"), t("cardLocation"), t("cardProfile")];
  const tips = [t("tipEntity"), t("tipLocation"), t("tipProfile")];
  const Iconos = [Building2, MapPin, Store];
  const IconoPaso = Iconos[paso];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <header>
        <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
          {t(esEdicion ? "editTitle" : "title")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {esEdicion ? t("editSubtitle") : subtitulos[paso]}
        </p>
      </header>

      <div className="mt-6">
        <Stepper
          pasos={[t("stepEntity"), t("stepLocation"), t("stepProfile")]}
          actual={paso}
          maxAlcanzable={maxVisto}
          onStepClick={irAPaso}
          label={t("stepperLabel")}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
        {/* -------- Tarjeta del paso -------- */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconoPaso className="size-5" aria-hidden="true" />
            </span>
            <h2 className="font-heading text-lg font-semibold text-foreground">
              {tarjetas[paso]}
            </h2>
          </div>

      {/* -------- Paso 1: entidad -------- */}
      {paso === 0 && (
        <div className="flex flex-col gap-3">
          <Campo id="name" label={t("name")} error={errores.name}>
            <Input id="name" value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
          </Campo>
          <Campo id="cif" label={t("cif")} error={errores.cif}>
            <Input id="cif" value={form.cif ?? ""} onChange={(e) => set("cif", e.target.value)} />
          </Campo>
          <Campo id="email" label={t("entityEmail")} error={errores.email}>
            <Input id="email" type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </Campo>
          <Campo id="phone" label={t("phone")} error={errores.phone}>
            <Input id="phone" value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
          </Campo>
          <Campo id="website" label={t("website")} error={errores.website}>
            <Input id="website" value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} />
          </Campo>
        </div>
      )}

      {/* -------- Paso 2: ubicación -------- */}
      {paso === 1 && (
        <div className="flex flex-col gap-3">
          <AddressAutocomplete
            id="address"
            label={t("address")}
            value={form.address ?? ""}
            onChange={(v) => set("address", v)}
            onSelect={elegirDireccion}
            placeholder={t("addressPlaceholder")}
            searchingLabel={t("addressSearching")}
            noResultsLabel={t("addressNoResults")}
          />
          {errores.address && <p className="text-sm text-destructive">{errores.address}</p>}
          <div className="grid grid-cols-2 gap-3">
            <Campo id="city" label={t("city")} error={errores.city}>
              <Input id="city" value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
            </Campo>
            <Campo id="province" label={t("province")} error={errores.province}>
              <Input id="province" value={form.province ?? ""} onChange={(e) => set("province", e.target.value)} />
            </Campo>
          </div>
          <Campo id="postalCode" label={t("postalCode")} error={errores.postalCode}>
            <Input id="postalCode" value={form.postalCode ?? ""} onChange={(e) => set("postalCode", e.target.value)} />
          </Campo>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            {t("pinHelp")}
          </p>
          <MapPinPicker
            value={{ lat: form.lat ?? 40.4168, lng: form.lng ?? -3.7038 }}
            onChange={({ lat, lng }) => {
              set("lat", lat);
              set("lng", lng);
            }}
          />
          {errores.lat && <p className="text-sm text-destructive">{errores.lat}</p>}
        </div>
      )}

      {/* -------- Paso 3: perfil público -------- */}
      {paso === 2 && (
        <div className="flex flex-col gap-4">
          <LogoUploader
            shelterId={currentId}
            initialUrl={form.logoUrl}
            onUploaded={(url) => set("logoUrl", url)}
          />
          <Campo id="description" label={t("description")}>
            <textarea
              id="description"
              rows={4}
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </Campo>
          <OpeningHoursEditor
            value={form.openingHours ?? {}}
            onChange={(v) => set("openingHours", v)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.acceptsVolunteers ?? false}
              onChange={(e) => set("acceptsVolunteers", e.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
            {t("acceptsVolunteers")}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.acceptsFostering ?? false}
              onChange={(e) => set("acceptsFostering", e.target.checked)}
              className="size-4 accent-[var(--primary)]"
            />
            {t("acceptsFostering")}
          </label>
        </div>
      )}

          {errores._ && <p className="mt-3 text-sm text-destructive">{errores._}</p>}
        </div>

        {/* -------- Columna lateral: Consejo + Resumen -------- */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-tertiary/30 bg-tertiary/10 p-4">
            <div className="mb-1.5 flex items-center gap-2 text-tertiary">
              <Lightbulb className="size-4" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wide">{t("tipTitle")}</span>
            </div>
            <p className="text-sm text-foreground/80">{tips[paso]}</p>
          </div>

          {form.name && (
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("summaryTitle")}
              </p>
              <dl className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("summaryEntity")}</dt>
                  <dd className="font-medium text-foreground">{form.name}</dd>
                </div>
                {form.cif && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{t("summaryCif")}</dt>
                    <dd className="font-medium text-foreground">{form.cif}</dd>
                  </div>
                )}
              </dl>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-tertiary">
                <Check className="size-3.5" aria-hidden="true" />
                {t("summaryFiscal")}
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* -------- Barra de acciones (sticky dentro del flujo) -------- */}
      <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-border bg-background/95 px-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 py-3">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Check className="size-4 text-tertiary" aria-hidden="true" />
            <span className="hidden sm:inline">{t("autosaved")}</span>
          </span>
          <div className="flex items-center gap-3">
            {paso > 0 && (
              <Button type="button" variant="ghost" onClick={() => setPaso((p) => p - 1)}>
                {t("back")}
              </Button>
            )}
            {paso < 2 ? (
              <Button type="button" size="lg" onClick={siguiente} disabled={guardando}>
                {guardando ? t("saving") : t("next")}
              </Button>
            ) : (
              <Button type="button" size="lg" onClick={finalizar} disabled={guardando}>
                {guardando ? t("saving") : t(esEdicion ? "saveChanges" : "finish")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
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
