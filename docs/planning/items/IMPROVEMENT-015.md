---
id: IMPROVEMENT-015
tipo: improvement
titulo: README de calidad y manual de usuario (entrega TFM)
estado: hecho
prioridad: alta
hito: "0.4"
duplicado_de: null
creado: 2026-07-12
actualizado: 2026-07-12
---

# IMPROVEMENT-015 — README de calidad y manual de usuario (entrega TFM)

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

El proyecto es un Trabajo de Fin de Máster y debe pasar tribunal. Se necesitan dos documentos de calidad:

1. **README.md** — primera impresión en GitHub: qué es el sistema, para quién, arquitectura, stack, cómo arrancarlo en local paso a paso, tests, despliegue y mapa de la documentación.
2. **Manual de usuario** — guía funcional completa por perfil (visitante, adoptante, protectora, administración) que cubra todos los flujos de la plataforma.

## Contexto / impacto

Documentos de cara al tribunal del TFM y a cualquier persona que entre al repositorio. El README actual es correcto pero mínimo; no existe manual de usuario.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy) ============ -->

## Plan de desarrollo

### Documentación a consultar

- `docs/product/PRODUCT_CONTEXT.md`, `docs/product/GLOSSARY.md` (lenguaje de negocio)
- `docs/technical/ARCHITECTURE.md`, `DATA_MODEL.md`, `DECISIONS.md` (arquitectura real)
- `docs/operations/SETUP.md`, `ENVIRONMENT.md` (arranque local)
- `docs/planning/CHANGELOG.md` + items FEATURE-000…018 (inventario de funcionalidades)
- Rutas reales de `src/app` como fuente de verdad de pantallas

### Seguridad

- Sin cambios de código. Revisar que ningún documento exponga secretos ni URLs internas; solo variables de `.env.example`.

### Modelo de datos

- Sin cambios.

### API

- Sin cambios.

### Frontend

- Sin cambios.

### Entregables

1. **`README.md`** (reescritura completa):
   - Cabecera con badges (CI, licencia, stack), descripción y propuesta de valor.
   - Funcionalidades por perfil (tabla resumen).
   - Arquitectura: diagrama Mermaid (Next.js/Vercel ↔ Supabase ↔ servicios) + tabla de stack con el porqué de cada pieza.
   - Puesta en marcha: prerrequisitos, clonado, `.env.local`, Supabase (migraciones + seed), `npm run dev`; tabla de scripts npm.
   - Calidad: TDD, Vitest/Playwright, cobertura, CI.
   - Despliegue (Vercel + crons + secrets) y estructura de carpetas comentada.
   - Mapa de documentación (enlaces a docs/) y enlace al manual de usuario.
2. **`docs/manual/MANUAL_USUARIO.md`** (nuevo, + entrada en mkdocs.yml):
   - Introducción, acceso y registro (adoptante / protectora), recuperación de contraseña.
   - Perfil **visitante/adoptante**: búsqueda y filtros, mapa, ficha de animal, solicitud de adopción, citas, favoritos, alertas, perdidos y encontrados, apadrinamiento, acogida, guías.
   - Perfil **protectora**: alta y verificación, panel (animales, solicitudes, agenda, citas, estadísticas, perfil, acogida).
   - Perfil **administración**: verificación de protectoras, moderación, reportes, auditoría.
   - Preguntas frecuentes y glosario mínimo.
   - Estructura por tareas ("Cómo …") con pasos numerados; capturas no incluidas en esta iteración (huecos marcados opcionales).

### Tareas (sin TDD — solo documentación)

1. Inventariar funcionalidades desde items/CHANGELOG y rutas de `src/app`.
2. Redactar `docs/manual/MANUAL_USUARIO.md` y registrarlo en `mkdocs.yml`.
3. Reescribir `README.md`.
4. Verificación: enlaces internos válidos, comandos probados contra `package.json`, sin secretos, coherencia con SETUP/ARCHITECTURE.

### Dependencias

- Ninguna.

## Criterios de aceptación / Casuística a cubrir

- [x] README explica qué es, arquitectura (con diagrama), stack justificado, arranque local completo y verificable, tests, despliegue y mapa de docs.
- [x] Todos los comandos del README existen en `package.json` o son válidos (supabase, mkdocs, render_planning).
- [x] Manual cubre los 4 perfiles y todos los flujos publicados (FEATURE-000…018), en español, sin jerga técnica.
- [x] Todos los enlaces internos de ambos documentos resuelven a ficheros existentes.
- [x] Manual accesible desde mkdocs (`mkdocs.yml`) y enlazado desde el README.
- [x] Ningún secreto ni credencial en los documentos.
