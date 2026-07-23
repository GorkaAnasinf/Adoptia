---
id: FEATURE-058
tipo: feature
titulo: Rediseño de la gestión de acogidas de la protectora
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-22
actualizado: 2026-07-22
---

# FEATURE-058 — Rediseño de la gestión de acogidas de la protectora

## Descripción

Rediseño visual de `panel/acogida` ("Gestión de Acogidas") siguiendo el wireframe
Stitch de `assets/wireframes/protectorasolicitudes/`, dentro de la tanda de
rediseño de pantallas. La protectora ve las personas que ofrecen acogida en su
zona y el historial de propuestas que ha enviado.

## Contexto / impacto

Coherencia visual con el resto del panel ya rediseñado (agenda, solicitudes):
tabs, sidebar de filtros, cards con avatar de iniciales, chips de estado y los
efectos de movimiento consistentes (Reveal + hover-lift). Afecta a protectoras.

## Plan de desarrollo

### Documentación a consultar

- `.claude/commands/adoptia-frontend.md`, `.claude/commands/adoptia-testing.md`.
- Wireframe: `assets/wireframes/protectorasolicitudes/{DESIGN.md,screen.png}`.
- Patrón de referencia ya rediseñado: `src/components/panel/SolicitudesPanel.tsx`.

### Seguridad

- Sin cambios de RLS. Reutiliza `foster_homes_nearby` (security definer, doble
  guarda) y `foster_proposals`. No se exponen datos nuevos: mismo payload que hoy.

### Modelo de datos

- Sin cambios. El mini-mapa "Puntos de acogida cercanos" del wireframe se **omite**
  (requeriría exponer coordenadas aproximadas en el RPC + decisión de privacidad;
  candidato a item aparte).

### Frontend

- `page.tsx` (server) mantiene el fetch actual y delega en nuevo client
  `GestionAcogidas` (`src/components/acogida/GestionAcogidas.tsx`).
- Tabs: "Propuestas recibidas" (acogedores disponibles) / "Propuestas enviadas".
- Sidebar de filtros client-side: distancia máx (slider), tipo de animal (chips),
  tipo de vivienda (select) sobre los acogedores ya cargados.
- Cards: avatar de iniciales (sin fotos, privacidad), nombre, chip de estado
  (nueva / en revisión / aceptada), chip de distancia, bloque VIVIENDA/PREFERENCIAS,
  cita (notas). Botón "Ver perfil completo" expande la card inline; botón
  "Contactar" abre el diálogo Proponer (o muestra estado si ya hay propuesta activa).
- Efectos: `Reveal` con stagger + hover-lift, coherente con la tanda.
- i18n: nuevas keys en `messages/es.json` (namespace `acogida`).

### Tests

- Componente `GestionAcogidas`: render de tabs, filtros, expandir card, estados.
- Mantener verde `page.test.tsx`.

## Criterios de aceptación

- Layout tabs + sidebar filtros + cards fiel al wireframe (adaptado a datos reales).
- Filtros funcionan client-side; efectos de movimiento presentes.
- Sin regresiones; suite y lint verdes; textos en `es.json`.
