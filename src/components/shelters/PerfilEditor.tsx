"use client";

import { Eye, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { socialLinksSchema } from "@/lib/schemas/shelter";
import type { OpeningHours, SocialLinks } from "@/lib/schemas/shelter";
import { createClient } from "@/lib/supabase/client";
import { LogoUploader } from "./LogoUploader";
import { OpeningHoursEditor } from "./OpeningHoursEditor";
import { type ShelterMedia, ShelterMediaUploader } from "./ShelterMediaUploader";
import {
  type PublicAnimal,
  type PublicShelter,
  ShelterPublicProfile,
} from "./ShelterPublicProfile";

type Form = {
  logoUrl: string;
  description: string;
  openingHours: OpeningHours;
  socialLinks: SocialLinks;
  acceptsVolunteers: boolean;
  acceptsFostering: boolean;
};

const REDES: { key: keyof SocialLinks; labelKey: string }[] = [
  { key: "instagram", labelKey: "instagram" },
  { key: "facebook", labelKey: "facebook" },
  { key: "x", labelKey: "x" },
  { key: "tiktok", labelKey: "tiktok" },
];

export function PerfilEditor({
  shelterId,
  base,
  initial,
  initialMedia = [],
  animals,
}: {
  shelterId: string;
  base: Pick<PublicShelter, "name" | "city" | "province" | "website" | "status">;
  initial: Form;
  initialMedia?: ShelterMedia[];
  animals: PublicAnimal[];
}) {
  const t = useTranslations("perfil");
  const router = useRouter();
  const [form, setForm] = useState<Form>(initial);
  const [media, setMedia] = useState<ShelterMedia[]>(initialMedia);
  const [preview, setPreview] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string>();

  function set<K extends keyof Form>(campo: K, valor: Form[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setGuardado(false);
  }

  function setRed(key: keyof SocialLinks, valor: string) {
    setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [key]: valor } }));
    setGuardado(false);
  }

  const shelterPreview: PublicShelter = {
    ...base,
    logo_url: form.logoUrl || null,
    description: form.description || null,
    social_links: form.socialLinks,
    opening_hours: form.openingHours,
    accepts_volunteers: form.acceptsVolunteers,
    accepts_fostering: form.acceptsFostering,
  };

  async function guardar() {
    setError(undefined);
    // Redes: vacías o URL válida
    const limpias = Object.fromEntries(
      Object.entries(form.socialLinks).filter(([, v]) => v && v.trim()),
    );
    if (!socialLinksSchema.safeParse(limpias).success) {
      setError(t("errorGeneric"));
      return;
    }
    setGuardando(true);
    try {
      const supabase = createClient();
      const { error: dbErr } = await supabase
        .from("shelters")
        .update({
          logo_url: form.logoUrl || null,
          description: form.description.trim() || null,
          opening_hours: form.openingHours,
          social_links: limpias,
          accepts_volunteers: form.acceptsVolunteers,
          accepts_fostering: form.acceptsFostering,
        })
        .eq("id", shelterId);
      if (dbErr) {
        setError(t("errorGeneric"));
        return;
      }
      setGuardado(true);
      router.refresh();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => setPreview((p) => !p)}>
          {preview ? <Pencil className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
          {preview ? t("backToEdit") : t("preview")}
        </Button>
      </header>

      {preview ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border">
          <ShelterPublicProfile shelter={shelterPreview} animals={animals} photos={media} />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          <LogoUploader
            shelterId={shelterId}
            initialUrl={form.logoUrl || undefined}
            onUploaded={(url) => set("logoUrl", url)}
          />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">{t("description")}</Label>
            <textarea
              id="description"
              rows={5}
              value={form.description}
              placeholder={t("descriptionPlaceholder")}
              onChange={(e) => set("description", e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>

          <OpeningHoursEditor value={form.openingHours} onChange={(v) => set("openingHours", v)} />

          <ShelterMediaUploader shelterId={shelterId} media={media} onChange={setMedia} />

          <fieldset className="flex flex-col gap-3">
            <legend className="font-medium">{t("socialsTitle")}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {REDES.map(({ key, labelKey }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <Label htmlFor={`red-${key}`}>{t(labelKey)}</Label>
                  <Input
                    id={`red-${key}`}
                    value={form.socialLinks[key] ?? ""}
                    onChange={(e) => setRed(key, e.target.value)}
                    placeholder="https://…"
                  />
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="font-medium">{t("collabTitle")}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input
                  type="checkbox"
                  checked={form.acceptsVolunteers}
                  onChange={(e) => set("acceptsVolunteers", e.target.checked)}
                  className="size-4 accent-[var(--primary)]"
                />
                {t("acceptsVolunteers")}
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <input
                  type="checkbox"
                  checked={form.acceptsFostering}
                  onChange={(e) => set("acceptsFostering", e.target.checked)}
                  className="size-4 accent-[var(--primary)]"
                />
                {t("acceptsFostering")}
              </label>
            </div>
          </fieldset>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}

      <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-border bg-background/95 px-4 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-end gap-3 py-3">
          {guardado && <span className="mr-auto text-sm text-tertiary">{t("saved")}</span>}
          <Button type="button" onClick={guardar} disabled={guardando}>
            {guardando ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
