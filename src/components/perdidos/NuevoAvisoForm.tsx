"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MapPinPicker } from "@/components/shelters/MapPinPicker";
import { comprimirFoto, esImagen } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";

const ESPECIES = ["dog", "cat", "other"] as const;

/** Mismo formato que el check de BD (FEATURE-022). */
const TELEFONO_RE = /^[+0-9][0-9 ]{5,19}$/;

/** Alta de aviso de perdido/encontrado: pensado para completarse en <2 min desde el móvil. */
export function NuevoAvisoForm({ userId }: { userId: string }) {
  const t = useTranslations("perdidos");
  const tAnimales = useTranslations("animales");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [tipo, setTipo] = useState<"lost" | "found">("lost");
  const [especie, setEspecie] = useState<(typeof ESPECIES)[number]>("dog");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [telefono, setTelefono] = useState("");
  const [permitirContacto, setPermitirContacto] = useState(true);
  const [foto, setFoto] = useState<File | null>(null);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok">("idle");
  const [error, setError] = useState<string>();

  const ESPECIE_LABEL: Record<string, string> = {
    dog: tAnimales("speciesDog"),
    cat: tAnimales("speciesCat"),
    other: tAnimales("speciesOther"),
  };

  async function publicar(e: React.FormEvent) {
    e.preventDefault();
    if (!descripcion.trim()) {
      setError(t("fFaltaDescripcion"));
      return;
    }
    if (!pin) {
      setError(t("fFaltaPin"));
      return;
    }
    if (telefono.trim() && !TELEFONO_RE.test(telefono.trim())) {
      setError(t("fTelefonoInvalido"));
      return;
    }
    setError(undefined);
    setEstado("enviando");
    const supabase = createClient();

    try {
      let photoUrl: string | null = null;
      if (foto && esImagen(foto)) {
        const comprimido = await comprimirFoto(foto);
        const ruta = `${userId}/${crypto.randomUUID()}-${foto.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("lost-found")
          .upload(ruta, comprimido, { contentType: comprimido.type || "image/jpeg" });
        if (upErr) throw upErr;
        photoUrl = supabase.storage.from("lost-found").getPublicUrl(ruta).data.publicUrl;
      }

      const { error: insErr } = await supabase.from("lost_found_posts").insert({
        user_id: userId,
        type: tipo,
        species: especie,
        name: nombre.trim() || null,
        description: descripcion.trim(),
        photo_url: photoUrl,
        city: ciudad.trim() || null,
        contact_phone: telefono.trim() || null,
        allow_contact: permitirContacto,
        location: `POINT(${pin.lng} ${pin.lat})`,
      });
      if (insErr) throw insErr;
      setEstado("ok");
    } catch {
      setError(t("fError"));
      setEstado("idle");
    }
  }

  if (estado === "ok") {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <span aria-hidden className="text-6xl">
          📍
        </span>
        <h2 className="font-heading text-2xl font-bold">{t("okTitle")}</h2>
        <p className="max-w-md text-muted-foreground">{t("okText")}</p>
        <Link
          href="/perdidos-encontrados"
          className="rounded-full bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:opacity-90"
          onClick={() => router.refresh()}
        >
          {t("okVer")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={publicar} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">{t("fTipo")}</legend>
        <div className="flex gap-2">
          {(["lost", "found"] as const).map((v) => (
            <label
              key={v}
              className={`flex-1 cursor-pointer rounded-2xl border px-4 py-3 text-center text-sm font-medium ${
                tipo === v
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value={v}
                checked={tipo === v}
                onChange={() => setTipo(v)}
                className="sr-only"
              />
              {t(v === "lost" ? "fTipoLost" : "fTipoFound")}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("fEspecie")}
          <select
            value={especie}
            onChange={(e) => setEspecie(e.target.value as (typeof ESPECIES)[number])}
            className="rounded-lg border border-input bg-white px-3 py-2"
          >
            {ESPECIES.map((s) => (
              <option key={s} value={s}>
                {ESPECIE_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("fNombre")}
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={80}
            className="rounded-lg border border-input bg-white px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium">
        {t("fDescripcion")}
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder={t("fDescripcionHelp")}
          className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("fCiudad")}
          <input
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            maxLength={120}
            className="rounded-lg border border-input bg-white px-3 py-2"
          />
        </label>
        <div className="flex flex-col gap-1 text-sm font-medium">
          {t("fFoto")}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-border bg-card px-3 py-2 text-left hover:bg-accent"
          >
            {foto ? foto.name : t("fFotoSubir")}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      <fieldset className="flex flex-col gap-3 rounded-2xl border border-border p-4">
        <legend className="px-1 text-sm font-medium">{t("contactoTitulo")}</legend>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="aviso-telefono">
            {t("fTelefono")}
          </label>
          <input
            id="aviso-telefono"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            maxLength={20}
            aria-describedby="aviso-telefono-help"
            className="rounded-lg border border-input bg-white px-3 py-2"
          />
          <p id="aviso-telefono-help" className="text-xs text-muted-foreground">
            {t("fTelefonoHelp")}
          </p>
        </div>

        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {t("fTelefonoAviso")}
        </p>

        <div className="flex items-start gap-2">
          <input
            id="aviso-permitir-contacto"
            type="checkbox"
            checked={permitirContacto}
            onChange={(e) => setPermitirContacto(e.target.checked)}
            aria-describedby="aviso-permitir-help"
            className="mt-1"
          />
          <div>
            <label className="text-sm font-medium" htmlFor="aviso-permitir-contacto">
              {t("fPermitirContacto")}
            </label>
            <p id="aviso-permitir-help" className="text-xs text-muted-foreground">
              {t("fPermitirContactoHelp")}
            </p>
          </div>
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">{t("fPin")}</p>
        <MapPinPicker
          value={pin ?? { lat: 40.4168, lng: -3.7038 }}
          onChange={(c) => setPin(c)}
        />
        <p className="text-xs text-muted-foreground">{t("fPinHelp")}</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div>
        <button
          type="submit"
          disabled={estado === "enviando"}
          className="rounded-full bg-primary px-6 py-2.5 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {estado === "enviando" ? t("fEnviando") : t("fEnviar")}
        </button>
      </div>
    </form>
  );
}
