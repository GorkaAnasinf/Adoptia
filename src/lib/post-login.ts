const DESTINO_POR_ROL: Record<string, string> = {
  shelter: "/panel",
  admin: "/admin",
};

type Params = {
  /** Rol del perfil (`profiles.role`); null/undefined si no hay fila. */
  role: string | null | undefined;
  /** Parámetro `redirect`/`next` recibido en la URL, sin sanear. */
  redirect: string | null | undefined;
};

/**
 * Decide el destino tras iniciar sesión.
 *
 * 1. Un redirect explícito gana, pero solo si es ruta interna
 *    (`/...` y no `//...`) — evita open redirect.
 * 2. Sin redirect válido: protectora → `/panel`, admin → `/admin`,
 *    cualquier otro caso → `/`.
 */
export function destinoPostLogin({ role, redirect }: Params): string {
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    return redirect;
  }
  return (role && DESTINO_POR_ROL[role]) || "/";
}
