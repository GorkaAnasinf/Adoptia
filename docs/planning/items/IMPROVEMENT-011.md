---
id: IMPROVEMENT-011
tipo: improvement
titulo: Wizard de alta — combo de provincia, autocompletado solo al teclear y título lateral
estado: hecho
prioridad: media
hito: "0.2"
duplicado_de: null
creado: 2026-07-09
actualizado: 2026-07-09
---

# IMPROVEMENT-011 — Combo de provincia, autocompletado y título lateral

Quinta iteración sobre el paso de ubicación y la cabecera del wizard:

## Bugs

- **El desplegable de provincias no aparecía**: el `<datalist>` nativo es poco
  fiable. Se sustituye por un combo propio (`ProvinciaCombo`) que filtra la
  lista al escribir y despliega siempre.
- **Ciudad y dirección buscaban solas**: se disparaban al cambiar el contexto
  (provincia) o al precargar el borrador, y "no paraban de sugerir" la dirección
  guardada. Ahora **solo buscan cuando el usuario teclea en esa caja**.

## Mejora de diseño

- El título de la vista ("Edita los datos…" / subtítulo) sale de la cabecera y
  pasa a un recuadro con color propio en la columna lateral derecha (junto a
  "Consejo"), visible en todas las pestañas, ganando alto en la parte superior.

## Criterios de aceptación

- [x] El combo de provincia despliega la lista y filtra al escribir.
- [x] Ciudad/dirección solo sugieren al teclear en su propia caja.
- [x] No se re-sugiere la dirección precargada del borrador.
- [x] El título vive en la columna lateral en todas las pestañas.
