---
id: IMPROVEMENT-016
tipo: improvement
titulo: RedirecciÃ³n post-login segÃºn rol (protectora al panel, admin a admin)
estado: hecho
prioridad: alta
hito: "0.5"
duplicado_de: null
creado: 2026-07-13
actualizado: 2026-07-13
---

# IMPROVEMENT-016 â€” RedirecciÃ³n post-login segÃºn rol

<!-- ============ PLANO 1: CAPTURA (ChatGPT / analista) ============ -->

## DescripciÃ³n

Al iniciar sesiÃ³n, todos los usuarios aterrizan en la home pÃºblica. Una protectora deberÃ­a llegar directamente a su panel (`/panel`) y un admin a `/admin`; el adoptante se queda en `/`. Si el usuario venÃ­a redirigido desde una ruta protegida (`?redirect=`), ese destino se respeta.

## Contexto / impacto

Detectado probando la plataforma: la protectora se loguea y cae en la home, sin pista de dÃ³nde estÃ¡ su panel. FricciÃ³n en el flujo principal de las protectoras (usuarias mÃ¡s frecuentes del login). Afecta a login con contraseÃ±a y a login con Google (callback OAuth).

<!-- ============ PLANO 2: PLAN TÃ‰CNICO (Snoopy, al promover) ============ -->

## Plan de desarrollo

### DocumentaciÃ³n a consultar

- `.claude/commands/adoptia-frontend.md` (LoginForm es client component)
- `.claude/commands/adoptia-backend.md` (Route Handler del callback)
- `.claude/commands/adoptia-security.md` (open redirect)

### Seguridad

- Mantener la protecciÃ³n anti open-redirect existente: solo rutas internas (`/` y no `//`).
- Lectura de `profiles.role` del propio usuario: cubierta por RLS existente (select del propio perfil). Sin cambios de polÃ­ticas.
- El middleware sigue siendo la barrera real de acceso por rol; esta mejora es solo UX de aterrizaje.

### Modelo de datos

- Sin cambios.

### API

- Sin endpoints nuevos. Se modifica `src/app/auth/callback/route.ts` para resolver destino por rol tras crear sesiÃ³n.

### Frontend

- `src/lib/post-login.ts` (nuevo): helper puro `destinoPostLogin({ role, redirect })` â†’
  1. si `redirect` es ruta interna vÃ¡lida (`startsWith("/")` y no `//`), devolverla;
  2. si no: `shelter â†’ /panel`, `admin â†’ /admin`, resto â†’ `/`.
- `src/components/forms/LoginForm.tsx`: tras `signInWithPassword` OK, consultar `profiles.role` y usar el helper.
- `src/app/auth/callback/route.ts`: tras obtener `user`, consultar `profiles.role`; el helper decide entre `next` y el destino por rol.

### Tareas TDD

1. Test `src/lib/post-login.test.ts` (falla): casuÃ­stica completa del helper (roles, redirect vÃ¡lido/ invÃ¡lido/`//evil`, rol null/desconocido) â†’ implementar helper.
2. Test `LoginForm.test.tsx` (falla): login como shelter sin `?redirect` â†’ push a `/panel`; con `?redirect=/mi-cuenta` â†’ respeta redirect; adopter â†’ `/` â†’ adaptar LoginForm.
3. Test `route.test.ts` del callback (falla): sesiÃ³n de shelter sin `next` â†’ redirect a `/panel`; con `next` interno â†’ lo respeta â†’ adaptar callback.
4. Refactor: eliminar la lÃ³gica de sanitizaciÃ³n duplicada en LoginForm/callback en favor del helper.

### Dependencias

- Ninguna.

## Criterios de aceptaciÃ³n / CasuÃ­stica a cubrir

- [x] Protectora se loguea desde `/login` (sin redirect) â†’ aterriza en `/panel` (el middleware ya la manda a `/panel/alta` si el alta no estÃ¡ enviada).
- [x] Admin â†’ `/admin`; adoptante â†’ `/`.
- [x] `?redirect=/mi-cuenta/favoritos` se respeta para cualquier rol.
- [x] `?redirect=https://evil.com` y `?redirect=//evil.com` se ignoran â†’ destino por rol.
- [x] Login con Google (callback) aplica la misma lÃ³gica en ambos flujos (`code` y `token_hash`).
- [x] Usuario sin fila en `profiles` o rol desconocido â†’ `/` (sin crash).
- [x] Tests del helper, LoginForm y callback en verde; lint y typecheck limpios.
