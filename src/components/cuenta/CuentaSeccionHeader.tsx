import { PawPrint } from "lucide-react";

/**
 * Cabecera de sección del área del adoptante (IMPROVEMENT-032). Reutiliza el
 * lenguaje visual del dashboard (`HeroCuenta`): banda teal con huella decorativa,
 * título y subtítulo, y un hueco opcional de acción a la derecha. Unifica las
 * seis subpáginas de `/mi-cuenta`.
 */
export function CuentaSeccionHeader({
  titulo,
  subtitulo,
  accion,
}: {
  titulo: string;
  subtitulo?: string;
  accion?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-secondary-container px-6 py-6 text-on-secondary-container shadow-soft sm:px-8 sm:py-7">
      <PawPrint
        className="pointer-events-none absolute -bottom-6 -right-6 size-40 text-on-secondary-container/10"
        aria-hidden="true"
        fill="currentColor"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-heading text-2xl font-bold sm:text-3xl">{titulo}</h1>
          {subtitulo && (
            <p className="mt-2 text-sm text-on-secondary-container/90 sm:text-base">{subtitulo}</p>
          )}
        </div>
        {accion && <div className="shrink-0">{accion}</div>}
      </div>
    </section>
  );
}
