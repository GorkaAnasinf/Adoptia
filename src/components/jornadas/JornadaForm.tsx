"use client";

import { CalendarClock, ImageIcon, MapPin, PawPrint } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { MapPinPicker } from "@/components/shelters/MapPinPicker";
import { FormSection } from "@/components/ui/FormSection";
import { comprimirFoto, esImagen } from "@/lib/image";
import { jornadaEsPublicable } from "@/lib/schemas/jornada";
import { createClient } from "@/lib/supabase/client";

export type AnimalOpcion = { id: string; name: string };

export type JornadaExistente = {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  capacity: number | null;
  poster_url: string | null;
  status: "draft" | "published" | "cancelled" | "finished";
  animal_ids: string[];
};

/** ISO (UTC) → valor para `<input type="datetime-local">` en hora local. */
function isoALocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

/** Alta o edición de una jornada de adopción (FEATURE-062), por secciones. */
export function JornadaForm({
  userId,
  shelterId,
  animales,
  existente = null,
}: {
  userId: string;
  shelterId: string;
  animales: AnimalOpcion[];
  existente?: JornadaExistente | null;
}) {
  const t = useTranslations("jornadas");
  const router = useRouter();

  const [title, setTitle] = useState(existente?.title ?? "");
  const [descripcion, setDescripcion] = useState(existente?.description ?? "");
  const [inicio, setInicio] = useState(existente ? isoALocal(existente.starts_at) : "");
  const [fin, setFin] = useState(existente ? isoALocal(existente.ends_at) : "");
  const [direccion, setDireccion] = useState(existente?.address ?? "");
  const [ciudad, setCiudad] = useState(existente?.city ?? "");
  const [aforo, setAforo] = useState(existente?.capacity != null ? String(existente.capacity) : "");
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(
    existente?.lat != null && existente?.lng != null ? { lat: existente.lat, lng: existente.lng } : null,
  );
  const [sel, setSel] = useState<Set<string>>(new Set(existente?.animal_ids ?? []));
  const [cartel, setCartel] = useState<File | null>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(existente?.poster_url ?? null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string>();

  const puedePublicar = jornadaEsPublicable({ lat: pin?.lat ?? null, lng: pin?.lng ?? null });
  const esBorrador = !existente || existente.status === "draft";

  function alternarAnimal(id: string) {
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function guardar(publicar: boolean) {
    if (!title.trim()) {
      setError(t("errorTitulo"));
      return;
    }
    if (!inicio || !fin || Date.parse(fin) <= Date.parse(inicio)) {
      setError(t("errorFechas"));
      return;
    }
    if (publicar && !pin) {
      setError(t("errorUbicacionPublicar"));
      return;
    }
    setError(undefined);
    setGuardando(true);
    const supabase = createClient();

    try {
      // Cartel: subir el nuevo si lo hay; conservar el anterior si no se toca.
      let poster = posterUrl;
      if (cartel && esImagen(cartel)) {
        const comprimido = await comprimirFoto(cartel);
        const ruta = `${userId}/${crypto.randomUUID()}-${cartel.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage
          .from("event-posters")
          .upload(ruta, comprimido, { contentType: comprimido.type || "image/jpeg" });
        if (upErr) throw new Error("cartel");
        poster = supabase.storage.from("event-posters").getPublicUrl(ruta).data.publicUrl;
      }

      const aforoNum = aforo.trim() === "" ? null : Math.trunc(Number(aforo));
      const nuevoStatus = publicar
        ? "published"
        : existente && existente.status !== "draft"
          ? existente.status
          : "draft";

      const fila = {
        shelter_id: shelterId,
        title: title.trim(),
        description: descripcion.trim(),
        starts_at: new Date(inicio).toISOString(),
        ends_at: new Date(fin).toISOString(),
        address: direccion.trim() || null,
        city: ciudad.trim() || null,
        capacity: aforoNum && aforoNum > 0 ? aforoNum : null,
        poster_url: poster,
        location: pin ? `POINT(${pin.lng} ${pin.lat})` : null,
        status: nuevoStatus,
      };

      let eventId = existente?.id;
      if (existente) {
        const { error: err } = await supabase.from("events").update(fila).eq("id", existente.id);
        if (err) throw err;
      } else {
        const { data, error: err } = await supabase.from("events").insert(fila).select("id").single();
        if (err || !data) throw err ?? new Error("insert");
        eventId = data.id as string;
      }

      // Reconciliar los animales vinculados.
      const iniciales = new Set(existente?.animal_ids ?? []);
      const aQuitar = [...iniciales].filter((id) => !sel.has(id));
      const aAnadir = [...sel].filter((id) => !iniciales.has(id));
      if (aQuitar.length > 0) {
        await supabase.from("event_animals").delete().eq("event_id", eventId!).in("animal_id", aQuitar);
      }
      if (aAnadir.length > 0) {
        const { error: err } = await supabase
          .from("event_animals")
          .insert(aAnadir.map((animal_id) => ({ event_id: eventId!, animal_id })));
        if (err) throw err;
      }

      setPosterUrl(poster);
      router.push("/panel/jornadas");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error && err.message === "cartel" ? t("errorCartel") : t("errorGuardar"));
      setGuardando(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void guardar(!esBorrador);
      }}
      className="rounded-2xl border border-border bg-card px-5 shadow-soft sm:px-8"
    >
      <div className="flex items-center gap-2 pt-6 font-heading text-lg font-semibold text-primary">
        <CalendarClock className="size-5" aria-hidden="true" />
        {existente ? t("editarTitulo") : t("nuevaTitulo")}
      </div>

      <div className="divide-y divide-border">
        <FormSection icon={CalendarClock} title={t("secDatosTitulo")} description={t("secDatosDesc")}>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t("fTitulo")}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder={t("fTituloHelp")}
                className="rounded-lg border border-input bg-white px-3 py-2 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t("fDescripcion")}
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder={t("fDescripcionHelp")}
                className="rounded-lg border border-input bg-white px-3 py-2 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                {t("fInicio")}
                <input
                  type="datetime-local"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                  className="rounded-lg border border-input bg-white px-3 py-2 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                {t("fFin")}
                <input
                  type="datetime-local"
                  value={fin}
                  onChange={(e) => setFin(e.target.value)}
                  className="rounded-lg border border-input bg-white px-3 py-2 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </label>
            </div>
            <label className="flex max-w-xs flex-col gap-1.5 text-sm font-medium">
              {t("fAforo")}
              <input
                type="number"
                min={1}
                value={aforo}
                onChange={(e) => setAforo(e.target.value)}
                aria-describedby="jornada-aforo-help"
                className="rounded-lg border border-input bg-white px-3 py-2 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <span id="jornada-aforo-help" className="text-xs font-normal text-muted-foreground">
                {t("fAforoHelp")}
              </span>
            </label>
          </div>
        </FormSection>

        <FormSection icon={MapPin} title={t("secUbicacionTitulo")} description={t("secUbicacionDesc")}>
          <div className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                {t("fDireccion")}
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  maxLength={200}
                  placeholder={t("fDireccionHelp")}
                  className="rounded-lg border border-input bg-white px-3 py-2 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                {t("fCiudad")}
                <input
                  type="text"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  maxLength={120}
                  className="rounded-lg border border-input bg-white px-3 py-2 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </label>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">{t("fPin")}</p>
              <MapPinPicker value={pin ?? { lat: 40.4168, lng: -3.7038 }} onChange={(c) => setPin(c)} />
              <span className="text-xs text-muted-foreground">{t("fPinHelp")}</span>
            </div>
          </div>
        </FormSection>

        <FormSection icon={PawPrint} title={t("secAnimalesTitulo")} description={t("secAnimalesDesc")}>
          {animales.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("sinAnimales")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              <ul className="grid gap-2 sm:grid-cols-2">
                {animales.map((a) => (
                  <li key={a.id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/5">
                      <input
                        type="checkbox"
                        checked={sel.has(a.id)}
                        onChange={() => alternarAnimal(a.id)}
                      />
                      {a.name}
                    </label>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">{t("animalesHelp")}</p>
            </div>
          )}
        </FormSection>

        <FormSection icon={ImageIcon} title={t("secCartelTitulo")} description={t("secCartelDesc")}>
          <div className="flex flex-col gap-3">
            {(cartel || posterUrl) && (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cartel ? URL.createObjectURL(cartel) : (posterUrl as string)}
                  alt=""
                  className="h-24 w-auto rounded-lg border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCartel(null);
                    setPosterUrl(null);
                  }}
                  className="text-sm text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
                >
                  {t("cartelQuitar")}
                </button>
              </div>
            )}
            <label className="inline-flex w-fit cursor-pointer items-center rounded-full border border-border px-5 py-2 text-sm font-semibold hover:border-primary/50">
              {cartel || posterUrl ? t("cartelCambiar") : t("cartelSubir")}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f && esImagen(f)) setCartel(f);
                  e.target.value = "";
                }}
              />
            </label>
            <span className="text-xs text-muted-foreground">{t("cartelHelp")}</span>
          </div>
        </FormSection>

        <div className="flex flex-col gap-4 py-6">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-2">
            {esBorrador && (
              <button
                type="button"
                disabled={guardando}
                onClick={() => void guardar(false)}
                className="inline-flex min-h-11 items-center rounded-full border border-border px-6 text-sm font-semibold hover:bg-accent disabled:opacity-50"
              >
                {guardando ? t("guardando") : t("guardarBorrador")}
              </button>
            )}
            <button
              type="button"
              disabled={guardando || (esBorrador && !puedePublicar)}
              onClick={() => void guardar(true)}
              title={esBorrador && !puedePublicar ? t("errorUbicacionPublicar") : undefined}
              className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {guardando ? t("guardando") : esBorrador ? t("publicar") : t("guardar")}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
