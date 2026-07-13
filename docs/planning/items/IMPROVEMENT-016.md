---
id: IMPROVEMENT-016
tipo: improvement
titulo: Redirección post-login según rol (protectora al panel, admin a admin)
estado: hecho
prioridad: alta
hito: "0.5"
duplicado_de: null
creado: 2026-07-13
actualizado: 2026-07-13
---

# IMPROVEMENT-016 — Redirección post-login según rol

<!-- ============ PLANO 1: CAPTURA (ChatGPT / analista) ============ -->

## Descripción

Al iniciar sesión, todos los usuarios aterrizan en la home pública. Una protectora debería llegar directamente a su panel (`/panel`) y un admin a `/admin`; el adoptante se queda en `/`. Si el usuario venía redirigido desde una ruta protegida (`?redirect=`), ese destino se respeta.

## Contexto / impacto

Detectado probando la plataforma: la protectora se loguea y cae en la home, sin pista de dónde está su panel. Fricción en el flujo principal de las protectoras (usuarias más frecuentes del login). Afecta a login con contraseña y a login con Google (callback OAuth).

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy, al promover) ============ -->

## Plan de desarrollo

### Documentación a consultar

- `.claude/commands/adoptia-frontend.md` (LoginForm es client component)
- `.claude/commands/adoptia-backend.md` (Route Handler del callback)
- `.claude/commands/adoptia-security.md` (open redirect)

### Seguridad

- Mantener la protección anti open-redirect existente: solo rutas internas (`/` y no `//`).
- Lectura de `profiles.role` del propio usuario: cubierta por RLS existente (select del propio perfil). Sin cambios de políticas.
- El middleware sigue siendo la barrera real de acceso por rol; esta mejora es solo UX de aterrizaje.

### Modelo de datos

- Sin cambios.

### API

- Sin endpoints nuevos. Se modifica `src/app/auth/callback/route.ts` para resolver destino por rol tras crear sesión.

### Frontend

- `src/lib/post-login.ts` (nuevo): helper puro `destinoPostLogin({ role, redirect })` →
  1. si `redirect` es ruta interna válida (`startsWith("/")` y no `//`), devolverla;
  2. si no: `shelter → /panel`, `admin → /admin`, resto → `/`.
- `src/components/forms/LoginForm.tsx`: tras `signInWithPassword` OK, consultar `profiles.role` y usar el helper.
- `src/app/auth/callback/route.ts`: tras obtener `user`, consultar `profiles.role`; el helper decide entre `next` y el destino por rol.

### Tareas TDD

1. Test `src/lib/post-login.test.ts` (falla): casuística completa del helper (roles, redirect válido/ inválido/`//evil`, rol null/desconocido) → implementar helper.
2. Test `LoginForm.test.tsx` (falla): login como shelter sin `?redirect` → push a `/panel`; con `?redirect=/mi-cuenta` → respeta redirect; adopter → `/` → adaptar LoginForm.
3. Test `route.test.ts` del callback (falla): sesión de shelter sin `next` → redirect a `/panel`; con `next` interno → lo respeta → adaptar callback.
4. Refactor: eliminar la lógica de sanitización duplicada en LoginForm/callback en favor del helper.

### Dependencias

- Ninguna.

## Criterios de aceptación / Casuística a cubrir

- [x] Protectora se loguea desde `/login` (sin redirect) → aterriza en `/panel` (el middleware ya la manda a `/panel/alta` si el alta no está enviada).
- [x] Admin → `/admin`; adoptante → `/`.
- [x] `?redirect=/mi-cuenta/favoritos` se respeta para cualquier rol.
- [x] `?redirect=https://evil.com` y `?redirect=//evil.com` se ignoran → destino por rol.
- [x] Login con Google (callback) aplica la misma lógica en ambos flujos (`code` y `token_hash`).
- [x] Usuario sin fila en `profiles` o rol desconocido → `/` (sin crash).
- [x] Tests del helper, LoginForm y callback en verde; lint y typecheck limpios.
