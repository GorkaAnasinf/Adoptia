const RUTA_ALTA = "/panel/alta";
const RUTA_PANEL = "/panel";

type GateParams = {
  /** submitted_at del shelter (null = borrador en curso o sin ficha). */
  submittedAt: string | null;
  /** ¿Existe fila de shelter para esta protectora? */
  hasShelter: boolean;
  /** Estado de la protectora (`pending` habilita la edición del alta). */
  status?: string | null;
  /** Ruta que se está visitando dentro del área protectora. */
  pathname: string;
};

/**
 * Decide a dónde redirigir a una protectora según su estado de onboarding.
 * Devuelve la ruta destino o `null` si puede quedarse donde está.
 *
 * - Sin ficha o alta a medias (`submitted_at` null) → forzar el wizard.
 * - Alta enviada y en revisión (`pending`) → puede reabrir el wizard para
 *   editar sus datos (IMPROVEMENT-005): nunca se redirige.
 * - Alta enviada en cualquier otro estado (verified/suspended) → el alta es de
 *   un solo uso; si abre el wizard, al panel.
 */
export function decideOnboardingGate({
  submittedAt,
  hasShelter,
  status,
  pathname,
}: GateParams): string | null {
  const enWizard = pathname.startsWith(RUTA_ALTA);
  const altaCompleta = hasShelter && submittedAt !== null;

  if (!altaCompleta) {
    return enWizard ? null : RUTA_ALTA;
  }
  if (status === "pending") {
    return null;
  }
  return enWizard ? RUTA_PANEL : null;
}
