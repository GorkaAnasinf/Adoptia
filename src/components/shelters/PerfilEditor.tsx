"use client";

import { Building2, Eye, FileText, HandHeart, Images, Pencil, Share2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/FormSection";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { esEnlacePagoValido } from "@/lib/enlaces-pago";
import { socialLinksSchema } from "@/lib/schemas/shelter";
import type { SocialLinks } from "@/lib/schemas/shelter";
import { createClient } from "@/lib/supabase/client";
import { CoverUploader } from "./CoverUploader";
import { LogoUploader } from "./LogoUploader";
import { type ShelterMedia, ShelterMediaUploader } from "./ShelterMediaUploader";
import {
  type PublicAnimal,
  type PublicShelter,
  ShelterPublicProfile,
} from "./ShelterPublicProfile";

type Form = {
  logoUrl: string;
  coverUrl: string;
  foundedYear: string; // input de texto; se valida y parsea al guardar
  description: string;
  donationLink: string;
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

  const anioActual = new Date().getFullYear();
  const anioFundacion = form.foundedYear.trim() ? Number(form.foundedYear.trim()) : null;
  const anioValido =
    anioFundacion === null ||
    (Number.isInteger(anioFundacion) && anioFundacion >= 1900 && anioFundacion <= anioActual);

  const shelterPreview: PublicShelter = {
    ...base,
    logo_url: form.logoUrl || null,
    cover_url: form.coverUrl || null,
    founded_year: anioValido ? anioFundacion : null,
    description: form.description || null,
    donation_link: form.donationLink || null,
    social_links: form.socialLinks,
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
    if (form.donationLink.trim() && !esEnlacePagoValido(form.donationLink.trim())) {
      setError(t("errDonationLink"));
      return;
    }
    if (!anioValido) {
      setError(t("errFoundedYear"));
      return;
    }
    setGuardando(true);
    try {
      const supabase = createClient();
      const { error: dbErr } = await supabase
        .from("shelters")
        .update({
          logo_url: form.logoUrl || null,
          cover_url: form.coverUrl || null,
          founded_year: anioFundacion,
          description: form.description.trim() || null,
          donation_link: form.donationLink.trim() || null,
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
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
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
        <div className="mt-6 rounded-2xl border border-border bg-card px-5 shadow-soft sm:px-8">
          <div className="divide-y divide-border">
            <FormSection icon={Building2} title={t("secIdentidadTitulo")} description={t("secIdentidadDesc")}>
              <div className="flex flex-col gap-5">
                <LogoUploader
                  shelterId={shelterId}
                  initialUrl={form.logoUrl || undefined}
                  onUploaded={(url) => set("logoUrl", url)}
                />

                <CoverUploader
                  shelterId={shelterId}
                  initialUrl={form.coverUrl || undefined}
                  onChange={(url) => set("coverUrl", url ?? "")}
                />

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="foundedYear">{t("foundedYear")}</Label>
                  <Input
                    id="foundedYear"
                    type="number"
                    inputMode="numeric"
                    min={1900}
                    max={anioActual}
                    value={form.foundedYear}
                    placeholder={String(anioActual - 10)}
                    onChange={(e) => set("foundedYear", e.target.value)}
                    className="max-w-40"
                  />
                  <p className="text-xs text-muted-foreground">{t("foundedYearHelp")}</p>
                </div>
              </div>
            </FormSection>

            <FormSection icon={FileText} title={t("secSobreTitulo")} description={t("secSobreDesc")}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description">{t("description")}</Label>
                <textarea
                  id="description"
                  rows={5}
                  value={form.description}
                  placeholder={t("descriptionPlaceholder")}
                  onChange={(e) => set("description", e.target.value)}
                  className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
            </FormSection>

            {/* Donaciones (FEATURE-013): enlace externo, Adoptia no cobra */}
            <FormSection icon={HandHeart} title={t("secDonacionesTitulo")} description={t("secDonacionesDesc")}>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="donationLink">{t("donationLink")}</Label>
                <Input
                  id="donationLink"
                  value={form.donationLink}
                  placeholder="https://www.teaming.net/…"
                  onChange={(e) => set("donationLink", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t("donationLinkHelp")}</p>
              </div>
            </FormSection>

            <FormSection icon={Images} title={t("facilitiesTitle")} description={t("secFotosDesc")}>
              <ShelterMediaUploader shelterId={shelterId} media={media} onChange={setMedia} />
            </FormSection>

            <FormSection icon={Share2} title={t("socialsTitle")} description={t("secRedesDesc")}>
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
            </FormSection>

            <FormSection icon={Users} title={t("collabTitle")} description={t("secColabDesc")}>
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
            </FormSection>

            {error && (
              <div className="py-6">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="sticky bottom-0 z-30 -mx-4 mt-6 border-t border-border bg-background/95 px-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 py-3">
          {guardado && <span className="mr-auto text-sm text-tertiary">{t("saved")}</span>}
          <Button type="button" onClick={guardar} disabled={guardando}>
            {guardando ? t("saving") : t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
