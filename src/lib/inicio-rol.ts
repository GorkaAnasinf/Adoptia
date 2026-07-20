/**
 * Destino del logo de la app privada según el rol (FEATURE-039).
 *
 * Antes apuntaba siempre a `/panel`, así que un adoptante que pulsaba el logo
 * aterrizaba en el panel de protectora y se comía una redirección.
 */
export function inicioDeRol(role: "shelter" | "admin" | "adopter" | null | undefined): string {
  if (role === "adopter") return "/mi-cuenta";
  if (role === "admin") return "/admin/protectoras";
  return "/panel";
}
