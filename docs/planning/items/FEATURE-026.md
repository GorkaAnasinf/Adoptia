---
id: FEATURE-026
tipo: feature
titulo: Rediseño de la ficha del aviso a dos columnas (mockup nuevo)
estado: hecho
prioridad: alta
hito: "0.5"
duplicado_de: null
creado: 2026-07-16
actualizado: 2026-07-16
---

# FEATURE-026 — Rediseño de la ficha del aviso a dos columnas

## Descripción

Mockup nuevo para `/perdidos-encontrados/[id]`. Cambios frente al diseño actual (una columna):

- **Dos columnas en desktop** (una en móvil): izquierda galería + nombre + descripción; derecha columna de acción.
- **Columna de acción**: CTA principal **«He visto a este animal»** (secundario teal), **«Compartir aviso»** (outline, Web Share API con fallback a portapapeles), datos del animal como **tiles** (Especie/Raza/Sexo/Tamaño/Color…), mini-mapa «Ubicación del aviso», tarjeta de contacto del autor y caja de **«Consejos de seguridad»**.
- **Badge PERDIDO/ENCONTRADO superpuesto** sobre la foto principal; **breadcrumbs** arriba; «Publicado hace X» en tiempo relativo.

Tanda de 3 rediseños con FEATURE-025 y FEATURE-027 (misma rama, suite al final).

## Contexto / impacto

La ficha es donde se decide si alguien ayuda. El mockup pone las acciones (avistamiento, compartir, contacto) siempre a la vista en vez de al fondo de un scroll largo.

## Plan de desarrollo

### Alcance (decidido con el usuario)

- **Dentro**: reorganización visual con los datos existentes + botón compartir + consejos de seguridad (texto estático).
- **Fuera** (el mockup los pinta pero no hay datos): chips de comportamiento «asustadizo»/«Urgente» (no existe campo — candidato ya anotado en el backlog), avatar/nombre público del autor (no se expone perfil), «Subir avistamiento» con foto desde la tira de miniaturas (el form de avistamiento existente ya admite foto; el CTA ancla a él).
- «He visto a este animal» **no añade lógica**: ancla al bloque de avistamiento/contacto existente (o al CTA de login si no hay sesión). Solo visible en avisos `open`.

### Documentación a consultar

- [DESIGN](../../technical/DESIGN.md), skill `adoptia-frontend` (barra de acción sticky en móvil), `adoptia-testing`.

### Seguridad

- Sin superficie nueva. Compartir usa la URL pública ya indexable-no (robots noindex se mantiene). Las reglas de visibilidad actuales (quién ve contacto, quién puede avistar) no cambian.

### Modelo de datos

- Sin cambios.

### API

- Sin cambios.

### Frontend

- `[id]/page.tsx`: grid `lg:grid-cols-[1fr,380px]`; breadcrumbs; badge superpuesto en la galería; tiempo relativo de publicación; tiles de señas (reusa la lista `senas`); caja de consejos (2 variantes de texto: lost/found).
- Nuevo `CompartirAvisoButton.tsx` (client): `navigator.share` → fallback `clipboard.writeText` + estado «copiado».
- Nuevo `VerAvistamientoCTA` o simple `<a href="#ayudar">` — preferir ancla sin JS.
- `GaleriaAviso`: admite `badge` opcional superpuesto (o el badge se posiciona desde la página envolviendo la galería — decidir en implementación lo más simple).
- Textos en `messages/es.json` (`perdidos.compartir*`, `perdidos.consejos*`, `perdidos.breadcrumb*`, `perdidos.heVisto`).

### Tareas TDD

1. `CompartirAvisoButton.test.tsx`: con `navigator.share` lo llama con la URL; sin él copia al portapapeles y muestra confirmación.
2. `page.test.tsx` (ficha): breadcrumbs presentes; CTA «He visto a este animal» ancla a `#ayudar` y solo aparece en avisos `open`; consejos de seguridad presentes con la variante correcta lost/found.
3. Ficha: tiles de señas solo con los datos conocidos (sin «no lo sé»), como hoy.
4. Layout no rompe los flujos existentes: avistamientos, contacto, resolver (tests actuales siguen en verde).

### Dependencias

- FEATURE-024 (`hecho`).

## Criterios de aceptación / Casuística a cubrir

- [x] Desktop 2 columnas, móvil 1 columna con acciones accesibles (sticky o arriba, target ≥44px).
- [x] «He visto a este animal» solo en avisos `open`; sin sesión lleva al login con redirect (flujo actual).
- [x] Compartir funciona con y sin Web Share API; el fallback confirma la copia.
- [x] Consejos de seguridad con texto distinto para perdido y encontrado; estático, en `es.json`.
- [x] Badge superpuesto en la foto; resuelto añade su badge como hoy.
- [x] Avisos sin fotos: sin galería ni hueco, el resto del layout no se rompe.
- [x] Nada de datos nuevos del autor en pantalla (RGPD: solo el teléfono ya opt-in).
- [x] Cero literales.

## Cierre (2026-07-16)

- Ficha a dos columnas (`lg:grid-cols-[minmax(0,1fr)_360px]`): izquierda galería (badge superpuesto solo si hay fotos válidas), título, fechas, descripción en tarjeta, avistamientos y resolver; derecha CTA «He visto a este animal» (ancla `#ayudar`, solo en abiertos), `CompartirAvisoButton` nuevo (Web Share → portapapeles con confirmación), señas en tiles, mini-mapa, contacto y consejos de seguridad (4 por tipo, en `es.json`).
- Breadcrumbs Inicio / Perdidos y encontrados / título.
- **Desvío consciente del mockup**: se conservan las fechas absolutas de suceso/publicación (en vez de «hace X horas») — esa distinción la trajo FEATURE-023 y sus tests la protegen; cambiarla habría perdido información.
- Detalle de test aprendido: `userEvent.setup()` instala su propio stub de `navigator.clipboard`; para verificar la copia hay que espiarlo (`vi.spyOn`), no reemplazar `navigator`.
- Tests: 3 de compartir + 5 nuevos de la ficha (23 verdes en total); los 18 previos sin tocar.
