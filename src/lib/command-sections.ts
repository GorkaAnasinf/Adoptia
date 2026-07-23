// Secciones navegables del área privada para el buscador global (FEATURE-061).
// Fuente única de las rutas del menú por rol; mantener en sync con AppSidebar.

export type RolPrivado = "shelter" | "admin" | "adopter";

export type Seccion = { key: string; href: string };

export const SECCIONES: Record<RolPrivado, Seccion[]> = {
  shelter: [
    { key: "navHome", href: "/panel" },
    { key: "navAnimals", href: "/panel/animales" },
    { key: "navRequests", href: "/panel/solicitudes" },
    { key: "navAppointments", href: "/panel/citas" },
    { key: "navAgenda", href: "/panel/agenda" },
    { key: "navFosterHomes", href: "/panel/acogida" },
    { key: "navStories", href: "/panel/historias" },
    { key: "navNeeds", href: "/panel/necesidades" },
    { key: "navDonationBoard", href: "/panel/donaciones" },
    { key: "navPublicProfile", href: "/panel/perfil" },
    { key: "navStats", href: "/panel/estadisticas" },
  ],
  admin: [
    { key: "navAdminShelters", href: "/admin/protectoras" },
    { key: "navAdminReports", href: "/admin/reportes" },
    { key: "navAdminAudit", href: "/admin/auditoria" },
  ],
  adopter: [
    { key: "navAccount", href: "/mi-cuenta" },
    { key: "navMyRequests", href: "/mi-cuenta/solicitudes" },
    { key: "navFavorites", href: "/mi-cuenta/favoritos" },
    { key: "navMyAppointments", href: "/mi-cuenta/citas" },
    { key: "navMyAlerts", href: "/mi-cuenta/alertas" },
    { key: "navFosterCare", href: "/mi-cuenta/acogida" },
    { key: "navDonations", href: "/mi-cuenta/donaciones" },
  ],
};

/** minúsculas + sin acentos, para comparar sin sensibilidad a tildes/mayúsculas. */
export function normaliza(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

export type SeccionResuelta = { key: string; href: string; label: string };

/**
 * Secciones del rol cuyo label (traducido) contiene el término. Con término
 * vacío devuelve todas. Insensible a acentos y mayúsculas.
 */
export function filtrarSecciones(
  rol: RolPrivado,
  q: string,
  etiqueta: (key: string) => string,
): SeccionResuelta[] {
  const norm = normaliza(q);
  return SECCIONES[rol]
    .map((s) => ({ ...s, label: etiqueta(s.key) }))
    .filter((s) => norm === "" || normaliza(s.label).includes(norm));
}
