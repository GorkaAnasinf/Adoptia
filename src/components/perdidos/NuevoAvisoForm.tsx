"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MapPinPicker } from "@/components/shelters/MapPinPicker";
import { comprimirFoto, esImagen } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";

const ESPECIES = ["dog", "cat", "other"] as const;
const SEXOS = ["male", "female", "unknown"] as const;
const TAMANOS = ["small", "medium", "large"] as const;
const MAX_FOTOS = 6;

/** Mismo formato que el check de BD (FEATURE-022). */
const TELEFONO_RE = /^[+0-9][0-9 ]{5,19}$/;

/** Tri-estado de la UI → `boolean | null` de BD, donde null = «no lo sé». */
type Terna = "si" | "no" | "nose";
const ternaABool = (v: Terna): boolean | null => (v === "nose" ? null : v === "si");

/** Fecha de hoy en formato `yyyy-mm-dd`, en hora local. */
function hoyLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

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
  // Datos identificativos (FEATURE-023): todos opcionales, «no lo sé» por
  // defecto — el alta tiene que seguir cabiendo en <2 min desde el móvil.
  const [raza, setRaza] = useState("");
  const [color, setColor] = useState("");
  const [sexo, setSexo] = useState<"" | (typeof SEXOS)[number]>("");
  const [tamano, setTamano] = useState<"" | (typeof TAMANOS)[number]>("");
  const [collar, setCollar] = useState<Terna>("nose");
  const [collarDesc, setCollarDesc] = useState("");
  const [microchip, setMicrochip] = useState<Terna>("nose");
  const [fecha, setFecha] = useState(hoyLocal());
  // Galería (FEATURE-024): varias fotos, la de índice `portada` es la principal.
  const [fotos, setFotos] = useState<File[]>([]);
  const [portada, setPortada] = useState(0);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok">("idle");
  const [error, setError] = useState<string>();

  /** Mismo filtro y límite vengan del input o de la dropzone (FEATURE-027). */
  function agregarFotos(lista: FileList | File[]) {
    const nuevas = Array.from(lista).filter(esImagen);
    setFotos((prev) => [...prev, ...nuevas].slice(0, MAX_FOTOS));
  }

  // Etiquetas ya existentes en `animales.*`: no se duplican en `perdidos.*`.
  const ESPECIE_LABEL: Record<string, string> = {
    dog: tAnimales("speciesDog"),
    cat: tAnimales("speciesCat"),
    other: tAnimales("speciesOther"),
  };
  const SEXO_LABEL: Record<string, string> = {
    male: tAnimales("sexMale"),
    female: tAnimales("sexFemale"),
    unknown: tAnimales("sexUnknown"),
  };
  const TAMANO_LABEL: Record<string, string> = {
    small: tAnimales("sizeSmall"),
    medium: tAnimales("sizeMedium"),
    large: tAnimales("sizeLarge"),
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
    if (!fecha) {
      setError(t("fFechaFalta"));
      return;
    }
    if (fecha > hoyLocal()) {
      setError(t("fFechaFutura"));
      return;
    }
    setError(undefined);
    setEstado("enviando");
    const supabase = createClient();

    try {
      // Subir todas las fotos primero. Si una falla, se corta y NO se publica a
      // medias (mismo criterio que la foto del avistamiento). La portada se
      // sube primera para que quede con el orden más bajo.
      const orden = fotos.map((_, i) => i).sort((a, b) => (a === portada ? -1 : b === portada ? 1 : a - b));
      const urls: string[] = [];
      for (const i of orden) {
        const f = fotos[i];
        if (!esImagen(f)) continue;
        const comprimido = await comprimirFoto(f);
        const ruta = `${userId}/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("lost-found")
          .upload(ruta, comprimido, { contentType: comprimido.type || "image/jpeg" });
        if (upErr) throw new Error("foto");
        urls.push(supabase.storage.from("lost-found").getPublicUrl(ruta).data.publicUrl);
      }

      const { data: post, error: insErr } = await supabase
        .from("lost_found_posts")
        .insert({
          user_id: userId,
          type: tipo,
          species: especie,
          name: nombre.trim() || null,
          description: descripcion.trim(),
          city: ciudad.trim() || null,
          contact_phone: telefono.trim() || null,
          allow_contact: permitirContacto,
          breed: raza.trim() || null,
          color: color.trim() || null,
          sex: sexo || null,
          size: tamano || null,
          has_collar: ternaABool(collar),
          // Sin collar (o sin saberlo), una descripción de collar es basura.
          collar_description: collar === "si" ? collarDesc.trim() || null : null,
          has_microchip: ternaABool(microchip),
          occurred_on: fecha,
          location: `POINT(${pin.lng} ${pin.lat})`,
        })
        .select("id")
        .single();
      if (insErr || !post) throw insErr ?? new Error("insert");

      if (urls.length > 0) {
        const { error: mediaErr } = await supabase.from("lost_found_media").insert(
          urls.map((url, i) => ({
            post_id: post.id,
            url,
            is_cover: i === 0, // la portada se subió primera
            sort_order: i,
          })),
        );
        if (mediaErr) throw mediaErr;
      }
      setEstado("ok");
    } catch (err) {
      setError(err instanceof Error && err.message === "foto" ? t("fFotoError") : t("fError"));
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
    <form onSubmit={publicar} className="flex flex-col gap-6">
      <fieldset className="rounded-2xl border border-border bg-card p-5">
        <legend className="px-1 font-heading text-lg font-semibold">
          <span aria-hidden>🐾</span> {t("fTipo")}
        </legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {(["lost", "found"] as const).map((v) => (
            <label
              key={v}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded-2xl border px-4 py-5 text-center ${
                tipo === v
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value={v}
                checked={tipo === v}
                onChange={() => setTipo(v)}
                aria-labelledby={`tipo-${v}-titulo`}
                aria-describedby={`tipo-${v}-help`}
                className="sr-only"
              />
              <span aria-hidden className="text-3xl">
                {v === "lost" ? "🔍" : "✋"}
              </span>
              <span
                id={`tipo-${v}-titulo`}
                className={`font-medium ${tipo === v ? "text-primary" : ""}`}
              >
                {t(v === "lost" ? "fTipoLost" : "fTipoFound")}
              </span>
              <span id={`tipo-${v}-help`} className="text-xs text-muted-foreground">
                {t(v === "lost" ? "fTipoLostHelp" : "fTipoFoundHelp")}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <div>
          <h2 className="font-heading text-lg font-semibold">
            <span aria-hidden>🐕</span> {t("fSeccionAnimal")}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("comoEsHelp")}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("fNombre")}
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={80}
              className="rounded-lg border border-input bg-white px-3 py-2"
            />
          </label>
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="aviso-raza">
              {t("fRaza")}
            </label>
            <input
              id="aviso-raza"
              value={raza}
              onChange={(e) => setRaza(e.target.value)}
              maxLength={80}
              placeholder={t("fRazaHelp")}
              className="rounded-lg border border-input bg-white px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="aviso-color">
              {t("fColor")}
            </label>
            <input
              id="aviso-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              maxLength={80}
              placeholder={t("fColorHelp")}
              className="rounded-lg border border-input bg-white px-3 py-2"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="aviso-sexo">
              {t("fSexo")}
            </label>
            <select
              id="aviso-sexo"
              value={sexo}
              onChange={(e) => setSexo(e.target.value as typeof sexo)}
              className="rounded-lg border border-input bg-white px-3 py-2"
            >
              <option value="">{t("fNoSe")}</option>
              {SEXOS.map((s) => (
                <option key={s} value={s}>
                  {SEXO_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="aviso-tamano">
              {t("fTamano")}
            </label>
            <select
              id="aviso-tamano"
              value={tamano}
              onChange={(e) => setTamano(e.target.value as typeof tamano)}
              className="rounded-lg border border-input bg-white px-3 py-2"
            >
              <option value="">{t("fNoSe")}</option>
              {TAMANOS.map((s) => (
                <option key={s} value={s}>
                  {TAMANO_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="aviso-collar">
              {t("fCollar")}
            </label>
            <select
              id="aviso-collar"
              value={collar}
              onChange={(e) => setCollar(e.target.value as Terna)}
              className="rounded-lg border border-input bg-white px-3 py-2"
            >
              <option value="nose">{t("fNoSe")}</option>
              <option value="si">{t("fSi")}</option>
              <option value="no">{t("fNo")}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="aviso-microchip">
              {t("fMicrochip")}
            </label>
            <select
              id="aviso-microchip"
              value={microchip}
              onChange={(e) => setMicrochip(e.target.value as Terna)}
              aria-describedby="aviso-microchip-help"
              className="rounded-lg border border-input bg-white px-3 py-2"
            >
              <option value="nose">{t("fNoSe")}</option>
              <option value="si">{t("fSi")}</option>
              <option value="no">{t("fNo")}</option>
            </select>
            {/* El número de chip identifica al dueño en el registro
                autonómico: no se pide, y se explica por qué. */}
            <p id="aviso-microchip-help" className="text-xs text-muted-foreground">
              {t("fMicrochipHelp")}
            </p>
          </div>
        </div>

        {collar === "si" && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" htmlFor="aviso-collar-desc">
              {t("fCollarDescripcion")}
            </label>
            <input
              id="aviso-collar-desc"
              value={collarDesc}
              onChange={(e) => setCollarDesc(e.target.value)}
              maxLength={120}
              placeholder={t("fCollarDescripcionHelp")}
              className="rounded-lg border border-input bg-white px-3 py-2"
            />
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">
          <span aria-hidden>📷</span> {t("fFotos")}
        </h2>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            agregarFotos(e.dataTransfer.files);
          }}
          disabled={fotos.length >= MAX_FOTOS}
          className="flex flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-border px-4 py-8 text-sm font-medium hover:border-primary/50 disabled:opacity-50"
        >
          <span aria-hidden className="text-2xl">
            🖼️
          </span>
          {t("fFotosArrastra")}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            agregarFotos(e.target.files ?? []);
            e.target.value = ""; // permite volver a elegir el mismo fichero
          }}
        />
        <p className="text-xs text-muted-foreground">{t("fFotosHelp")}</p>

        {fotos.length > 0 && (
          <ul className="flex flex-wrap gap-3">
            {fotos.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2 ${
                  i === portada ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(f)}
                  alt=""
                  className="size-16 rounded-lg object-cover"
                />
                {i === portada ? (
                  <span className="text-xs font-semibold text-primary">{t("fFotoPortada")}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPortada(i)}
                    className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    {t("fFotoMarcarPortada")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setFotos((prev) => {
                      const resto = prev.filter((_, j) => j !== i);
                      // Reajustar la portada si se quita antes o la propia.
                      setPortada((p) => (i === p ? 0 : i < p ? p - 1 : p));
                      return resto;
                    })
                  }
                  className="text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
                >
                  {t("fFotoQuitar")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">
          <span aria-hidden>📍</span> {t("fSeccionUbicacion")}
        </h2>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("fCiudad")}
          <input
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            maxLength={120}
            className="rounded-lg border border-input bg-white px-3 py-2"
          />
        </label>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{t("fPin")}</p>
          <MapPinPicker
            value={pin ?? { lat: 40.4168, lng: -3.7038 }}
            onChange={(c) => setPin(c)}
          />
          <p className="text-xs text-muted-foreground">{t("fPinHelp")}</p>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">
          <span aria-hidden>📝</span> {t("fSeccionDescripcion")}
        </h2>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("fDescripcion")}
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder={t("fDescripcionHelp")}
            className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
          />
        </label>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="aviso-fecha">
            {t("fFecha")}
          </label>
          {/* Sin `max`: el bloqueo nativo corta el submit con un aviso sin
              traducir (lección de FEATURE-022). Validamos aquí y en BD. */}
          <input
            id="aviso-fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            aria-describedby="aviso-fecha-help"
            className="rounded-lg border border-input bg-white px-3 py-2"
          />
          <p id="aviso-fecha-help" className="text-xs text-muted-foreground">
            {t(tipo === "lost" ? "fFechaHelpLost" : "fFechaHelpFound")}
          </p>
        </div>
      </section>

      <fieldset className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <legend className="px-1 font-heading text-lg font-semibold">
          <span aria-hidden>📞</span> {t("fSeccionContacto")}
        </legend>

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

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/perdidos-encontrados"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {t("fCancelar")}
        </Link>
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
