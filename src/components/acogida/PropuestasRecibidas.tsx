import { useFormatter, useTranslations } from "next-intl";

export type PropuestaRecibida = {
  id: string;
  duracion: string;
  mensaje: string;
  status: string;
  created_at: string;
  shelters: { name: string } | null;
  animals: { name: string } | null;
};

const ESTADO_CHIP: Record<string, string> = {
  enviada: "bg-primary/10 text-primary",
  aceptada: "bg-emerald-100 text-emerald-800",
  rechazada: "bg-stone-200 text-stone-700",
  finalizada: "bg-sky-100 text-sky-800",
};

/** Propuestas de acogida que ha recibido el acogedor (FEATURE-029). */
export function PropuestasRecibidas({ propuestas }: { propuestas: PropuestaRecibida[] }) {
  const t = useTranslations("acogida");
  const format = useFormatter();

  const ESTADO_TEXTO: Record<string, string> = {
    enviada: t("estadoPropuestaEnviada"),
    aceptada: t("estadoPropuestaAceptada"),
    rechazada: t("estadoPropuestaRechazada"),
    finalizada: t("estadoPropuestaFinalizada"),
  };

  return (
    <section className="mt-10">
      <h2 className="font-heading text-xl font-bold">{t("recibidasTitulo")}</h2>
      {propuestas.length === 0 ? (
        <p className="mt-3 rounded-xl border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("recibidasEmpty")}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {propuestas.map((p) => (
            <li key={p.id} className="flex flex-col gap-1 rounded-xl border border-border bg-card px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">
                  {t("recibidaDe", { nombre: p.shelters?.name ?? "—" })}
                </span>
                <span className="text-muted-foreground">
                  {p.animals?.name ?? t("sinAnimalConcreto")} · {p.duracion}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTADO_CHIP[p.status]}`}
                >
                  {ESTADO_TEXTO[p.status]}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {format.dateTime(new Date(p.created_at), { day: "numeric", month: "short" })}
                </span>
              </div>
              <p className="text-muted-foreground">{p.mensaje}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
