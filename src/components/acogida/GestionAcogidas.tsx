"use client";

import {
  CalendarClock,
  Clock,
  Dog,
  Home,
  Navigation,
  PawPrint,
  Ruler,
  SlidersHorizontal,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { PropuestaEstadoActions } from "./PropuestaEstadoActions";
import { ProponerAcogidaDialog } from "./ProponerAcogidaDialog";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

type Especie = "dog" | "cat" | "other";

export type AcogedorCard = {
  user_id: string;
  full_name: string | null;
  city: string | null;
  distance_km: number;
  radius_km: number;
  condiciones: {
    especies?: string[];
    vivienda?: string;
    jardin?: boolean;
    otros_animales?: string;
    notas?: string;
  };
  created_at: string;
};

export type PropuestaEnviada = {
  id: string;
  foster_user_id: string;
  duracion: string;
  mensaje: string;
  status: string;
  created_at: string;
  relevo_pedido_at: string | null;
  relevo_motivo: string | null;
  relevo_fecha_limite: string | null;
  animals: { name: string } | null;
};

type Tab = "recibidas" | "enviadas";

const ESTADO_CHIP: Record<string, string> = {
  enviada: "bg-primary/10 text-primary",
  aceptada: "bg-tertiary/10 text-tertiary",
  rechazada: "bg-muted text-muted-foreground",
  finalizada: "bg-sky-100 text-sky-800",
};

// Estado de la relación protectora↔acogedor que se pinta en la card.
const CARD_CHIP = {
  nueva: "bg-secondary/15 text-secondary",
  enRevision: "bg-tertiary/15 text-tertiary",
  aceptada: "bg-primary/10 text-primary",
} as const;

const ESPECIES: Especie[] = ["dog", "cat", "other"];

function iniciales(nombre: string | null): string {
  const partes = (nombre ?? "").trim().split(/\s+/).slice(0, 2);
  const ini = partes.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return ini || "?";
}

/** Gestión de acogidas de la protectora: acogedores disponibles + historial (FEATURE-058). */
export function GestionAcogidas({
  acogedores,
  animales,
  propuestas,
}: {
  acogedores: AcogedorCard[];
  animales: { id: string; name: string }[];
  propuestas: PropuestaEnviada[];
}) {
  const t = useTranslations("acogida");
  const format = useFormatter();

  const [tab, setTab] = useState<Tab>("recibidas");

  const maxRadio = useMemo(
    () => Math.max(25, ...acogedores.map((a) => a.radius_km)),
    [acogedores],
  );
  const [distanciaMax, setDistanciaMax] = useState(maxRadio);
  const [especiesFiltro, setEspeciesFiltro] = useState<Set<Especie>>(new Set());
  const [viviendaFiltro, setViviendaFiltro] = useState<"todas" | "casa" | "piso">("todas");
  const [expandido, setExpandido] = useState<Set<string>>(new Set());

  // Propuesta abierta (enviada/aceptada) por acogedor y nombre para el historial.
  const { activaPorAcogedor, nombrePorAcogedor } = useMemo(() => {
    const activa = new Map<string, PropuestaEnviada>();
    for (const p of propuestas) {
      if (p.status === "enviada" || p.status === "aceptada") activa.set(p.foster_user_id, p);
    }
    const nombres = new Map(acogedores.map((a) => [a.user_id, a.full_name]));
    return { activaPorAcogedor: activa, nombrePorAcogedor: nombres };
  }, [propuestas, acogedores]);

  const filtrados = useMemo(
    () =>
      acogedores.filter((a) => {
        if (a.distance_km > distanciaMax) return false;
        if (viviendaFiltro !== "todas" && a.condiciones.vivienda !== viviendaFiltro) return false;
        if (especiesFiltro.size > 0) {
          const suyas = a.condiciones.especies ?? [];
          if (!suyas.some((e) => especiesFiltro.has(e as Especie))) return false;
        }
        return true;
      }),
    [acogedores, distanciaMax, viviendaFiltro, especiesFiltro],
  );

  const ESPECIE_LABEL: Record<string, string> = {
    dog: t("especieDog"),
    cat: t("especieCat"),
    other: t("especieOther"),
  };
  const ESTADO_TEXTO: Record<string, string> = {
    enviada: t("estadoPropuestaEnviada"),
    aceptada: t("estadoPropuestaAceptada"),
    rechazada: t("estadoPropuestaRechazada"),
    finalizada: t("estadoPropuestaFinalizada"),
  };

  const fecha = (iso: string) => format.dateTime(new Date(iso), { day: "numeric", month: "short" });

  const nuevas = acogedores.filter((a) => !activaPorAcogedor.has(a.user_id)).length;

  function toggleEspecie(e: Especie) {
    setEspeciesFiltro((prev) => {
      const next = new Set(prev);
      if (next.has(e)) next.delete(e);
      else next.add(e);
      return next;
    });
  }

  function toggleExpandido(id: string) {
    setExpandido((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      {/* Pestañas */}
      <div role="tablist" className="flex gap-1 border-b border-border">
        <TabBoton activa={tab === "recibidas"} onClick={() => setTab("recibidas")}>
          {t("tabRecibidas")}
          {nuevas > 0 && (
            <span className="ml-2 rounded-full bg-secondary/15 px-2 py-0.5 text-xs font-semibold text-secondary">
              {nuevas}
            </span>
          )}
        </TabBoton>
        <TabBoton activa={tab === "enviadas"} onClick={() => setTab("enviadas")}>
          {t("tabEnviadas")}
        </TabBoton>
      </div>

      {tab === "recibidas" ? (
        <div
          role="tabpanel"
          className="mt-6 grid gap-6 lg:grid-cols-[17rem_1fr] lg:items-start"
        >
          {/* Sidebar de filtros */}
          <aside className="rounded-2xl border border-border bg-surface-container-low p-5 shadow-soft lg:sticky lg:top-24">
            <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-muted-foreground">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              {t("filtrosTitulo").toUpperCase()}
            </h2>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm">
                <label htmlFor="filtro-distancia" className="font-medium">
                  {t("filtroDistancia")}
                </label>
                <span className="font-semibold text-primary">{t("radioKm", { km: distanciaMax })}</span>
              </div>
              <input
                id="filtro-distancia"
                type="range"
                min={1}
                max={maxRadio}
                value={distanciaMax}
                aria-label={t("filtroDistancia")}
                onChange={(e) => setDistanciaMax(Number(e.target.value))}
                className="mt-2 w-full accent-primary"
              />
            </div>

            <div className="mt-5">
              <p className="text-sm font-medium">{t("filtroTipoAnimal")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ESPECIES.map((e) => {
                  const activa = especiesFiltro.has(e);
                  return (
                    <button
                      key={e}
                      type="button"
                      aria-pressed={activa}
                      onClick={() => toggleEspecie(e)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                        activa
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-accent/50",
                      )}
                    >
                      {ESPECIE_LABEL[e]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="filtro-vivienda" className="text-sm font-medium">
                {t("filtroTipoVivienda")}
              </label>
              <select
                id="filtro-vivienda"
                value={viviendaFiltro}
                onChange={(e) => setViviendaFiltro(e.target.value as typeof viviendaFiltro)}
                className="mt-2 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="todas">{t("filtroViviendaCualquiera")}</option>
                <option value="casa">{t("viviendaCasa")}</option>
                <option value="piso">{t("viviendaPiso")}</option>
              </select>
            </div>
          </aside>

          {/* Lista de acogedores */}
          <div>
            {acogedores.length === 0 ? (
              <EstadoVacio icon={PawPrint} texto={t("panelEmpty")} />
            ) : filtrados.length === 0 ? (
              <EstadoVacio icon={SlidersHorizontal} texto={t("filtroSinResultados")} />
            ) : (
              <ul className="flex flex-col gap-4">
                {filtrados.map((a, i) => {
                  const activa = activaPorAcogedor.get(a.user_id);
                  const estadoCard = !activa
                    ? { clase: CARD_CHIP.nueva, texto: t("cardNueva") }
                    : activa.status === "aceptada"
                      ? { clase: CARD_CHIP.aceptada, texto: t("cardAceptada") }
                      : { clase: CARD_CHIP.enRevision, texto: t("cardEnRevision") };
                  const abierta = expandido.has(a.user_id);
                  return (
                    <li key={a.user_id}>
                      <Reveal delayMs={Math.min(i, 6) * 70}>
                        <article className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-all motion-safe:duration-300 hover:shadow-md motion-safe:hover:-translate-y-0.5">
                          <header className="flex flex-wrap items-start gap-x-3 gap-y-2">
                            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                              {iniciales(a.full_name)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-heading text-lg font-semibold">
                                  {a.full_name ?? "—"}
                                </h3>
                                <span
                                  className={cn(
                                    "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                    estadoCard.clase,
                                  )}
                                >
                                  {estadoCard.texto}
                                </span>
                              </div>
                              <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                                <Navigation className="size-3.5" aria-hidden="true" />
                                {t("aKm", { km: a.distance_km })}
                                {a.city && <span> · {a.city}</span>}
                              </p>
                            </div>
                          </header>

                          <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                            <Dato
                              icon={Home}
                              titulo={t("viviendaLabel")}
                              valor={[
                                a.condiciones.vivienda === "casa"
                                  ? t("viviendaCasa")
                                  : a.condiciones.vivienda === "piso"
                                    ? t("viviendaPiso")
                                    : null,
                                a.condiciones.jardin ? t("jardin") : null,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            />
                            <Dato
                              icon={Dog}
                              titulo={t("preferenciasLabel")}
                              valor={
                                (a.condiciones.especies ?? [])
                                  .map((e) => ESPECIE_LABEL[e] ?? e)
                                  .join(", ") || t("preferenciasCualquiera")
                              }
                            />
                          </div>

                          {a.condiciones.notas && (
                            <p className="mt-4 border-l-2 border-primary/30 pl-3 text-sm italic text-muted-foreground">
                              {a.condiciones.notas}
                            </p>
                          )}

                          {abierta && (
                            <dl className="mt-4 grid gap-3 rounded-xl bg-surface-container-low p-4 text-sm sm:grid-cols-2">
                              {a.condiciones.otros_animales && (
                                <DetalleAmpliado
                                  icon={PawPrint}
                                  titulo={t("otrosAnimalesLabel")}
                                  valor={a.condiciones.otros_animales}
                                />
                              )}
                              <DetalleAmpliado
                                icon={Ruler}
                                titulo={t("radioLabel")}
                                valor={t("radioKm", { km: a.radius_km })}
                              />
                              <DetalleAmpliado
                                icon={CalendarClock}
                                titulo={t("ofrecidaEl", { fecha: fecha(a.created_at) })}
                                valor={null}
                              />
                            </dl>
                          )}

                          <footer className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                            <button
                              type="button"
                              onClick={() => toggleExpandido(a.user_id)}
                              aria-expanded={abierta}
                              className="rounded-full border border-border px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-accent/50"
                            >
                              {abierta ? t("ocultarPerfil") : t("verPerfil")}
                            </button>

                            {activa ? (
                              <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                {t("propuestaEnviadaEl", { fecha: fecha(activa.created_at) })}
                                {activa.relevo_pedido_at && activa.relevo_fecha_limite && (
                                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                                    {t("relevoPedido", { fecha: activa.relevo_fecha_limite })}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <ProponerAcogidaDialog fosterUserId={a.user_id} animales={animales} />
                            )}
                          </footer>
                        </article>
                      </Reveal>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div role="tabpanel" className="mt-6">
          {propuestas.length === 0 ? (
            <EstadoVacio icon={CalendarClock} texto={t("historialEmpty")} />
          ) : (
            <ul className="flex flex-col gap-4">
              {propuestas.map((p, i) => (
                <li key={p.id}>
                  <Reveal delayMs={Math.min(i, 6) * 70}>
                    <article className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-all motion-safe:duration-300 hover:shadow-md motion-safe:hover:-translate-y-0.5">
                      <header className="flex flex-wrap items-start gap-x-3 gap-y-2">
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {iniciales(nombrePorAcogedor.get(p.foster_user_id) ?? null)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-heading text-lg font-semibold">
                              {nombrePorAcogedor.get(p.foster_user_id) ?? "—"}
                            </h3>
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                ESTADO_CHIP[p.status],
                              )}
                            >
                              {ESTADO_TEXTO[p.status]}
                            </span>
                          </div>
                          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                            <CalendarClock className="size-3.5" aria-hidden="true" />
                            {t("enviadaEl", { fecha: fecha(p.created_at) })}
                          </p>
                        </div>
                      </header>

                      <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                        <Dato
                          icon={PawPrint}
                          titulo={t("animalLabel")}
                          valor={p.animals?.name ?? t("sinAnimalConcreto")}
                        />
                        <Dato icon={Clock} titulo={t("duracionLabel")} valor={p.duracion} />
                      </div>

                      {p.mensaje && (
                        <p className="mt-4 border-l-2 border-primary/30 pl-3 text-sm italic text-muted-foreground">
                          {p.mensaje}
                        </p>
                      )}

                      {p.relevo_pedido_at && p.relevo_fecha_limite && p.status === "aceptada" && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            {t("relevoPedido", { fecha: p.relevo_fecha_limite })}
                          </span>
                          {p.relevo_motivo && (
                            <span className="text-xs text-muted-foreground">
                              {t("relevoMotivoLabel", { motivo: p.relevo_motivo })}
                            </span>
                          )}
                        </div>
                      )}

                      {(p.status === "enviada" || p.status === "aceptada") && (
                        <footer className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                          <PropuestaEstadoActions proposalId={p.id} status={p.status} />
                        </footer>
                      )}
                    </article>
                  </Reveal>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function TabBoton({
  activa,
  onClick,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={activa}
      onClick={onClick}
      className={cn(
        "-mb-px inline-flex items-center border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
        activa
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Dato({
  icon: Icon,
  titulo,
  valor,
}: {
  icon: typeof Home;
  titulo: string;
  valor: string;
}) {
  return (
    <div className="flex gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {titulo}
        </dt>
        <dd className="text-sm">{valor}</dd>
      </div>
    </div>
  );
}

function DetalleAmpliado({
  icon: Icon,
  titulo,
  valor,
}: {
  icon: typeof Home;
  titulo: string;
  valor: string | null;
}) {
  return (
    <div className="flex gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="min-w-0">
        <span className="font-medium">{titulo}</span>
        {valor && <p className="text-muted-foreground">{valor}</p>}
      </div>
    </div>
  );
}

function EstadoVacio({ icon: Icon, texto }: { icon: typeof Home; texto: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center shadow-soft">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <p className="mt-4 text-muted-foreground">{texto}</p>
    </div>
  );
}
