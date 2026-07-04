---
id: FEATURE-011
tipo: feature
titulo: Moderación de contenido y cuentas (admin)
estado: listo
prioridad: media
hito: "0.3"
duplicado_de: null
creado: 2026-07-04
actualizado: 2026-07-04
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

- [ ] Reportar requiere cuenta y categoría; anti-abuso (máx. reportes/día).
- [ ] Despublicación y suspensión reversibles, siempre con motivo.
- [ ] La protectora afectada recibe email con el motivo y vía de contacto.
- [ ] Log de auditoría consultable por admins, inmodificable.
