"use client";

import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  type AnimalDraft,
  type AnimalStatus,
  animalDraftSchema,
  animalToRow,
  datosDuplicados,
  ESPECIES,
  ESTADOS_CONFIRMACION,
  esTransicionValida,
  generarSlug,
  NIVELES_ENERGIA,
  SEXOS,
  TAMANOS,
  TRANSICIONES,
  validarPublicacion,
} from "@/lib/schemas/animal";
import { createClient } from "@/lib/supabase/client";
import { esYoutubeValido } from "@/lib/youtube";
import { AnimalMediaUploader, type Media } from "./AnimalMediaUploader";
import { TriToggle } from "./TriToggle";

type Form = Partial<AnimalDraft> & { status?: AnimalStatus };

export function AnimalForm({
  shelterId,
  animalId,
  initial,
  initialMedia = [],
  initialYoutube = "",
  shelterVerified = true,
}: {
  shelterId: string;
  animalId: string | null;
  initial: Form;
  initialMedia?: Media[];
  initialYoutube?: string;
  /** Solo las protectoras verificadas pueden publicar (FEATURE-002). */
  shelterVerified?: boolean;
}) {
  const t = useTranslations("animales");
  const router = useRouter();
  const [form, setForm] = useState<Form>({ status: "available", ...initial });
  const [currentId, setCurrentId] = useState<string | null>(animalId);
  const [media, setMedia] = useState<Media[]>(initialMedia);
  const [youtube, setYoutube] = useState(initialYoutube);
  const [ytError, setYtError] = useState<string>();
  const [error, setError] = useState<string>();
  const [guardando, setGuardando] = useState(false);

  function set<K extends keyof Form>(campo: K, valor: Form[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function sincronizarYoutube(id: string) {
    const supabase = createClient();
    await supabase.from("animal_media").delete().eq("animal_id", id).eq("type", "youtube");
    if (youtube.trim()) {
      await supabase
        .from("animal_media")
        .insert({ animal_id: id, type: "youtube", url: youtube.trim(), sort_order: 0 });
    }
  }

  async function guardar(publicar: boolean) {
    setError(undefined);
    setYtError(undefined);

    if (youtube.trim() && !esYoutubeValido(youtube)) {
      setYtError(t("youtubeInvalid"));
      return;
    }
    if (publicar && !shelterVerified) {
      setError(t("notVerifiedPublish"));
      return;
    }
    if (publicar) {
      // Solo las fotos cuentan para el mínimo de publicación (un vídeo no basta).
      const numFotos = media.filter((m) => (m.type ?? "photo") === "photo").length;
      const res = validarPublicacion(form, numFotos);
      if (!res.ok) {
        setError(t("publishErrors"));
        return;
      }
    } else if (!animalDraftSchema.safeParse(form).success) {
      setError(t("nameRequired"));
      return;
    }

    setGuardando(true);
    try {
      const row = animalToRow(form as AnimalDraft, shelterId);
      row.status = form.status ?? "available";
      if (publicar) row.published_at = new Date().toISOString();
      if (currentId) {
        row.id = currentId;
      } else {
        row.slug = generarSlug(form.name ?? "animal");
      }

      const supabase = createClient();
      const { data, error: dbErr } = await supabase
        .from("animals")
        .upsert(row)
        .select("id")
        .single();
      if (dbErr || !data) {
        setError(t("errorGeneric"));
        return;
      }
      setCurrentId(data.id);
      await sincronizarYoutube(data.id);

      if (publicar) {
        router.push("/panel/animales");
        router.refresh();
      }
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstado(nuevo: AnimalStatus) {
    if (!currentId || !esTransicionValida(form.status ?? "available", nuevo)) return;
    if (ESTADOS_CONFIRMACION.includes(nuevo) && !window.confirm(t("confirmAdopted"))) return;
    set("status", nuevo);
    const supabase = createClient();
    await supabase.from("animals").update({ status: nuevo }).eq("id", currentId);
  }

  async function duplicar() {
    if (!currentId) return;
    setGuardando(true);
    try {
      const supabase = createClient();
      const { data: fila } = await supabase.from("animals").select("*").eq("id", currentId).single();
      if (!fila) return;
      const copia = datosDuplicados(fila, shelterId);
      const { data: nuevo } = await supabase
        .from("animals")
        .insert(copia)
        .select("id")
        .single();
      if (nuevo?.id) router.push(`/panel/animales/${nuevo.id}`);
    } finally {
      setGuardando(false);
    }
  }

  const transiciones = [form.status ?? "available", ...TRANSICIONES[form.status ?? "available"]];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 pb-28">
      <header className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">
          {currentId ? t("formEditTitle") : t("formNewTitle")}
        </h1>
        {currentId && (
          <Button type="button" variant="outline" size="sm" onClick={duplicar} disabled={guardando}>
            <Copy className="size-4" aria-hidden="true" />
            {t("duplicate")}
          </Button>
        )}
      </header>

      {/* Estado (solo en edición) */}
      {currentId && (
        <section className="mt-6 flex flex-col gap-1.5">
          <Label htmlFor="estado">{t("statusLabel")}</Label>
          <select
            id="estado"
            value={form.status ?? "available"}
            onChange={(e) => cambiarEstado(e.target.value as AnimalStatus)}
            className="w-fit rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {transiciones.map((s) => (
              <option key={s} value={s}>
                {t(`status${s.charAt(0).toUpperCase()}${s.slice(1)}`)}
              </option>
            ))}
          </select>
        </section>
      )}

      {/* -------- Datos básicos -------- */}
      <Seccion titulo={t("secBasics")}>
        <Campo id="name" label={t("fName")}>
          <Input id="name" value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} />
        </Campo>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo id="species" label={t("fSpecies")}>
            <Select id="species" value={form.species ?? ""} onChange={(v) => set("species", v as AnimalDraft["species"])} placeholder={t("optSelect")}
              opciones={ESPECIES.map((e) => ({ v: e, l: t(`species${e.charAt(0).toUpperCase()}${e.slice(1)}`) }))} />
          </Campo>
          <Campo id="breed" label={t("fBreed")}>
            <Input id="breed" value={form.breed ?? ""} onChange={(e) => set("breed", e.target.value)} />
          </Campo>
          <Campo id="sex" label={t("fSex")}>
            <Select id="sex" value={form.sex ?? "unknown"} onChange={(v) => set("sex", v as AnimalDraft["sex"])}
              opciones={SEXOS.map((s) => ({ v: s, l: t(`sex${s.charAt(0).toUpperCase()}${s.slice(1)}`) }))} />
          </Campo>
          <Campo id="size" label={t("fSize")}>
            <Select id="size" value={form.size ?? ""} onChange={(v) => set("size", v as AnimalDraft["size"])} placeholder={t("optSelect")}
              opciones={TAMANOS.map((s) => ({ v: s, l: t(`size${s.charAt(0).toUpperCase()}${s.slice(1)}`) }))} />
          </Campo>
          <Campo id="birth" label={t("fBirth")}>
            <Input id="birth" type="date" value={form.birthDateApprox ?? ""} onChange={(e) => set("birthDateApprox", e.target.value)} />
          </Campo>
          <Campo id="weight" label={t("fWeight")}>
            <Input id="weight" type="number" step="0.1" value={form.weightKg ?? ""}
              onChange={(e) => set("weightKg", e.target.value ? Number(e.target.value) : null)} />
          </Campo>
        </div>
      </Seccion>

      {/* -------- Carácter -------- */}
      <Seccion titulo={t("secCharacter")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <TriToggle label={t("compatKids")} value={form.goodWithKids ?? null} onChange={(v) => set("goodWithKids", v)} />
          <TriToggle label={t("compatDogs")} value={form.goodWithDogs ?? null} onChange={(v) => set("goodWithDogs", v)} />
          <TriToggle label={t("compatCats")} value={form.goodWithCats ?? null} onChange={(v) => set("goodWithCats", v)} />
          <TriToggle label={t("compatApartment")} value={form.apartmentSuitable ?? null} onChange={(v) => set("apartmentSuitable", v)} />
        </div>
        <Campo id="energy" label={t("fEnergy")}>
          <Select id="energy" value={form.energyLevel ?? ""} onChange={(v) => set("energyLevel", v as AnimalDraft["energyLevel"])} placeholder={t("optSelect")}
            opciones={NIVELES_ENERGIA.map((n) => ({ v: n, l: t(`energy${n.charAt(0).toUpperCase()}${n.slice(1)}`) }))} />
        </Campo>
      </Seccion>

      {/* -------- Salud -------- */}
      <Seccion titulo={t("secHealth")}>
        <div className="flex flex-wrap gap-4">
          <Check label={t("fVaccinated")} checked={form.vaccinated ?? false} onChange={(v) => set("vaccinated", v)} />
          <Check label={t("fSterilized")} checked={form.sterilized ?? false} onChange={(v) => set("sterilized", v)} />
          <Check label={t("fMicrochipped")} checked={form.microchipped ?? false} onChange={(v) => set("microchipped", v)} />
        </div>
        <Campo id="specialNeeds" label={t("fSpecialNeeds")}>
          <Input id="specialNeeds" value={form.specialNeeds ?? ""} onChange={(e) => set("specialNeeds", e.target.value)} />
        </Campo>
        <Campo id="healthNotes" label={t("fHealthNotes")}>
          <textarea id="healthNotes" rows={2} value={form.healthNotes ?? ""} onChange={(e) => set("healthNotes", e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
        </Campo>
      </Seccion>

      {/* -------- Historia -------- */}
      <Seccion titulo={t("secStory")}>
        <Campo id="description" label={t("fDescription")}>
          <textarea id="description" rows={5} value={form.description ?? ""} onChange={(e) => set("description", e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
        </Campo>
      </Seccion>

      {/* -------- Apadrinamiento (FEATURE-013) -------- */}
      <Seccion titulo={t("secSponsor")}>
        <p className="text-sm text-muted-foreground">{t("sponsorHelp")}</p>
        <Check
          label={t("fSponsorable")}
          checked={form.sponsorable ?? false}
          onChange={(v) => set("sponsorable", v)}
        />
        {form.sponsorable && (
          <>
            <Campo id="sponsorLink" label={t("fSponsorLink")}>
              <Input
                id="sponsorLink"
                value={form.sponsorLink ?? ""}
                onChange={(e) => set("sponsorLink", e.target.value)}
                placeholder="https://buy.stripe.com/…"
              />
              <p className="text-xs text-muted-foreground">{t("fSponsorLinkHelp")}</p>
            </Campo>
            <Campo id="sponsorNote" label={t("fSponsorNote")}>
              <textarea
                id="sponsorNote"
                rows={2}
                value={form.sponsorNote ?? ""}
                onChange={(e) => set("sponsorNote", e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </Campo>
          </>
        )}
      </Seccion>

      {/* -------- Fotos y vídeo -------- */}
      <Seccion titulo={t("secMedia")}>
        <AnimalMediaUploader shelterId={shelterId} animalId={currentId} media={media} onChange={setMedia} />
        <Campo id="youtube" label={t("youtube")}>
          <Input id="youtube" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtu.be/…" />
          {ytError && <p className="text-sm text-destructive">{ytError}</p>}
        </Campo>
      </Seccion>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {/* -------- Footer sticky -------- */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur lg:pl-64">
        <div className="mx-auto flex max-w-3xl items-center justify-end gap-3 px-4 py-3">
          {!shelterVerified && (
            <span className="mr-auto text-xs text-muted-foreground">{t("notVerifiedPublish")}</span>
          )}
          <Button type="button" variant="outline" onClick={() => guardar(false)} disabled={guardando}>
            {guardando ? t("saving") : t("saveDraft")}
          </Button>
          <Button
            type="button"
            onClick={() => guardar(true)}
            disabled={guardando || !shelterVerified}
          >
            {guardando ? t("saving") : t("publish")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-heading text-lg font-semibold">{titulo}</h2>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Campo({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function Select({
  id,
  value,
  onChange,
  opciones,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  opciones: { v: string; l: string }[];
  placeholder?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-border bg-background px-3 py-2 text-sm"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {opciones.map((o) => (
        <option key={o.v} value={o.v}>
          {o.l}
        </option>
      ))}
    </select>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-[var(--primary)]"
      />
      {label}
    </label>
  );
}
