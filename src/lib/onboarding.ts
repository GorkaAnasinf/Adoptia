const RUTA_ALTA = "/panel/alta";
const RUTA_PANEL = "/panel";

type GateParams = {
  /** submitted_at del shelter (null = borrador en curso o sin ficha). */
  submittedAt: string | null;
  /** ¿Existe fila de shelter para esta protectora? */
  hasShelter: boolean;
  /** Ruta que se está visitando dentro del área protectora. */
  pathname: string;
};

/**
 * Decide a dónde redirigir a una protectora según su estado de onboarding.
 * Devuelve la ruta destino o `null` si puede quedarse donde está.
 *
 * - Sin ficha o alta a medias (`submitted_at` null) → forzar el wizard.
 * - Alta ya enviada → dejar pasar al panel; si abre el wizard, al panel
 *   (el alta es de un solo uso).
 */
export function decideOnboardingGate({ submittedAt, hasShelter, pathname }: GateParams): string | null {
  const enWizard = pathname.startsWith(RUTA_ALTA);
  const altaCompleta = hasShelter && submittedAt !== null;

  if (!altaCompleta) {
    return enWizard ? null : RUTA_ALTA;
  }
  return enWizard ? RUTA_PANEL : null;
}
