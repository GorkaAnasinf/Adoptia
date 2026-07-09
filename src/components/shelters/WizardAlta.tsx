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
import { matchProvincia } from "@/lib/provincias";
import {
  entidadSchema,
  perfilSchema,
  ubicacionSchema,
} from "@/lib/schemas/shelter";
import { formToShelterRow, type ShelterForm } from "@/lib/shelter-mapping";
import { createClient } from "@/lib/supabase/client";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { LogoUploader } from "./LogoUploader";
import { ProvinciaCombo } from "./ProvinciaCombo";
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
  const [geoMsg, setGeoMsg] = useState<string>();

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

  // En edición todos los pasos son alcanzables (los datos ya existen);
  // en alta, solo hasta el paso más avanzado visitado.
  const maxAlcanzable = esEdicion ? SCHEMAS.length - 1 : maxVisto;

  /** Navegación por el stepper: guarda el borrador y salta al paso pedido. */
  async function irAPaso(i: number) {
    if (i === paso || i > maxAlcanzable) return;
    // Al avanzar en alta se valida el paso actual; hacia atrás o en edición, no.
    if (i > paso && !esEdicion && !validar(SCHEMAS[paso])) return;
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

  /** Al elegir una dirección se rellenan los campos y se coloca el pin. */
  function elegirDireccion(s: Sugerencia) {
    setForm((f) => ({
      ...f,
      address: s.address || f.address,
      // No se pisa lo que el usuario ya eligió (flujo de más a menos).
      city: f.city || s.city,
      province: f.province || matchProvincia(s.province),
      postalCode: f.postalCode || s.postalCode,
      lat: s.lat,
      lng: s.lng,
    }));
    setErrores({});
  }

  /** Al elegir un municipio se rellena ciudad (y provincia si faltaba y es válida) + pin. */
  function elegirCiudad(s: Sugerencia) {
    setForm((f) => ({
      ...f,
      city: s.city || f.city,
      province: f.province || matchProvincia(s.province),
      postalCode: f.postalCode || s.postalCode,
      lat: s.lat,
      lng: s.lng,
    }));
  }

  /** Geocodifica los campos actuales y coloca el pin (botón "Localizar"). */
  async function localizar() {
    setGeoMsg(undefined);
    try {
      const res = await fetch("/api/protectoras/geocode", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          address: form.address,
          city: form.city,
          province: form.province,
          postalCode: form.postalCode,
        }),
      });
      const { data } = await res.json();
      if (data?.lat != null) {
        set("lat", data.lat);
        set("lng", data.lng);
      } else {
        setGeoMsg(t("geocodeFailed"));
        if (form.lat == null) {
          set("lat", 40.4168);
          set("lng", -3.7038);
        }
      }
    } catch {
      setGeoMsg(t("geocodeFailed"));
    }
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
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <div>
        <Stepper
          pasos={[t("stepEntity"), t("stepLocation"), t("stepProfile")]}
          actual={paso}
          maxAlcanzable={maxAlcanzable}
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

      {/* -------- Paso 2: ubicación (de más a menos: provincia → dirección) -------- */}
      {paso === 1 && (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Provincia: combo escribible sobre la lista fija */}
            <div>
              <ProvinciaCombo
                id="province"
                label={t("province")}
                value={form.province ?? ""}
                onChange={(v) => set("province", v)}
                placeholder={t("provincePlaceholder")}
              />
              {errores.province && (
                <p className="mt-1.5 text-sm text-destructive">{errores.province}</p>
              )}
            </div>

            {/* Ciudad: sugerencias de municipios (filtradas por provincia) */}
            <div>
              <AddressAutocomplete
                id="city"
                label={t("city")}
                value={form.city ?? ""}
                onChange={(v) => set("city", v)}
                onSelect={elegirCiudad}
                tipo="place"
                contexto={form.province ?? ""}
                placeholder={t("cityPlaceholder")}
                searchingLabel={t("addressSearching")}
                noResultsLabel={t("addressNoResults")}
              />
              {errores.city && <p className="mt-1.5 text-sm text-destructive">{errores.city}</p>}
            </div>

            <Campo id="postalCode" label={t("postalCode")} error={errores.postalCode}>
              <Input id="postalCode" value={form.postalCode ?? ""} onChange={(e) => set("postalCode", e.target.value)} />
            </Campo>

            {/* Dirección: sugerencias sesgadas por ciudad + provincia */}
            <div>
              <AddressAutocomplete
                id="address"
                label={t("address")}
                value={form.address ?? ""}
                onChange={(v) => set("address", v)}
                onSelect={elegirDireccion}
                contexto={`${form.city ?? ""} ${form.province ?? ""}`.trim()}
                placeholder={t("addressPlaceholder")}
                searchingLabel={t("addressSearching")}
                noResultsLabel={t("addressNoResults")}
              />
              {errores.address && <p className="mt-1.5 text-sm text-destructive">{errores.address}</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <Button type="button" variant="outline" className="w-fit shrink-0" onClick={localizar}>
              <MapPin className="size-4" aria-hidden="true" />
              {t("locate")}
            </Button>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              {t("pinHelp")}
            </p>
          </div>
          {geoMsg && <p className="text-sm text-destructive">{geoMsg}</p>}
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
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="checkbox"
                checked={form.acceptsVolunteers ?? false}
                onChange={(e) => set("acceptsVolunteers", e.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              {t("acceptsVolunteers")}
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <input
                type="checkbox"
                checked={form.acceptsFostering ?? false}
                onChange={(e) => set("acceptsFostering", e.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              {t("acceptsFostering")}
            </label>
          </div>
        </div>
      )}

          {errores._ && <p className="mt-3 text-sm text-destructive">{errores._}</p>}
        </div>

        {/* -------- Columna lateral: Consejo + Resumen -------- */}
        <aside className="flex flex-col gap-4">
          {/* Título de la vista (movido aquí para ganar alto arriba) */}
          <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
            <h1 className="font-heading text-lg font-bold text-foreground">
              {t(esEdicion ? "editTitle" : "title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {esEdicion ? t("editSubtitle") : subtitulos[paso]}
            </p>
          </div>

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
