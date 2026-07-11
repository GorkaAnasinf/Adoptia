---
id: FEATURE-011
tipo: feature
titulo: Moderación de contenido y cuentas (admin)
estado: hecho
prioridad: media
hito: "0.3"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-11
---

# FEATURE-011 — Moderación de contenido y cuentas

## Descripción

El equipo admin puede despublicar fichas con contenido inadecuado, suspender cuentas (protectoras o adoptantes) con motivo registrado, y revisar contenido reportado por usuarios (botón "reportar" en fichas). (Ref: A2)

## Contexto / impacto

Protege la confianza de la plataforma. Sin moderación, un solo caso de fraude o contenido inapropiado daña la marca ante protectoras y prensa.

## Plan de desarrollo

### Documentación a consultar

- [SECURITY](../../operations/SECURITY.md), skill `adoptia-security`

### Seguridad

- Acciones de admin registradas en tabla de auditoría (quién, qué, cuándo, motivo).
- Suspensión revoca visibilidad inmediata (RLS por status) sin borrar datos (RGPD: supresión es otro flujo).

### Modelo de datos

- Nuevas: `reports` (contenido reportado) y `audit_log` (acciones admin).

### API

- `POST /api/reportes` (público autenticado, rate limited), acciones admin vía handlers con verificación de rol.

### Frontend

- Sección admin: cola de reportes, buscador de cuentas/fichas, acciones con modal de motivo.
- Botón "Reportar" discreto en fichas.

### Tareas TDD

1. Test: no-admin no accede a ninguna acción (403 + RLS).
2. Test despublicar: ficha desaparece de público, protectora ve aviso con motivo.
3. Test suspensión de protectora: todo su contenido oculto en cascada.
4. Test auditoría: cada acción deja registro inmutable.

### Dependencias

- FEATURE-002 (roles y admin básico).

## Criterios de aceptación / Casuística a cubrir

- [x] Reportar requiere cuenta y categoría (401 sin sesión; enum de razones); anti-abuso doble: rate limit en memoria + trigger BD de 5 reportes/día (el 6º rechazado, probado).
- [x] Despublicación y suspensión reversibles, siempre con motivo (despublicar exige motivo y hay `republish`; suspensión de protectora ya existía en verificar; suspensión de adoptante vía ban de GoTrue con `reactivate`).
- [x] La protectora afectada recibe email con el motivo y vía de contacto (`plantillaFichaDespublicada` con soporte; además ve el aviso con motivo en su panel de animales).
- [x] Log de auditoría consultable por admins (`/admin/auditoria`), inmodificable de verdad: trigger que bloquea update/delete incluso a service_role (probado).

## Cierre (2026-07-11)

- **BD**: `reports` (razones tipadas, tope 5/día por trigger), `audit_log` inmutable (sin policies de escritura + trigger anti update/delete), `animals.moderation_note`.
- **API**: `POST /api/reportes` (auth + rate limit doble), `POST /api/admin/animales/[id]/moderar` (unpublish con motivo/email/auditoría, republish), `POST /api/admin/usuarios/[id]/suspender` (ban GoTrue reversible, no puede auto-suspenderse), `PATCH /api/admin/reportes/[id]`. Helper común `usuarioAdminId`/`auditar` en `src/lib/admin.ts`.
- **UI**: botón "Reportar" discreto al pie de la ficha (form en línea), cola `/admin/reportes` (pendientes con despublicar+revisar+descartar, resueltos recientes), `/admin/auditoria` (tabla) y aviso ámbar con el motivo en `/panel/animales` de la protectora afectada.
- **Recorte consciente**: el buscador admin de cuentas/fichas del plan no se implementa (los criterios no lo exigen; la cola de reportes enlaza directo a cada ficha). Item nuevo si se echa en falta.
- **Tests**: 5 RLS (incluida inmutabilidad contra service_role), 5+5+4 de API. Suite: 593.
