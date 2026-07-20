---
id: FEATURE-040
tipo: feature
titulo: Rediseño de "Mis alertas" según wireframe Stitch (tanda, pantalla 7)
estado: hecho
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-20
actualizado: 2026-07-20
---

> **Cierre (2026-07-20):** hecho en `feature/FEATURE-040-alertas`. Rejilla de
> tarjetas `AlertaCard` con chips reales (especie/tamaño/sexo/distancia o "Toda
> España"), interruptor Activa/Pausada (RLS), "Ver resultados" al listado con los
> filtros, "Eliminar" con confirm, tarjeta punteada "Nueva alerta" y aviso honesto
> (sin la estadística inventada del mock). Se cae la ficción: miniaturas +N,
> "último encontrado", chip "Urgente". `AlertaAcciones` retirado (lo sustituye
> `AlertaCard`). QA: suite unitaria **1025 verde** (RLS de `saved_searches` sin
> cambios; no re-ejecutados por falta de supabase local en esta pasada), typecheck
> y lint limpios. **Pendiente:** verificación visual y despliegue.

# FEATURE-040 — Mis alertas (/mi-cuenta/alertas) según wireframe Stitch

## Descripción

Séptima pantalla de la tanda de rediseño: wireframe en `assets/wireframes/usuariomisalertas/`.
Hoy `/mi-cuenta/alertas` lista las búsquedas guardadas como filas planas con un resumen
pobre (solo especie + distancia) y dos botones (Pausar/Activar, Eliminar). El wireframe
propone una **rejilla de tarjetas ricas**: chips por cada filtro, interruptor Activa/Pausada,
acciones, una tarjeta "Nueva alerta" punteada y una cabecera con intro.

## Contexto / impacto

Afecta al adoptante. Las alertas son un motor de retorno (email cuando entra un animal que
encaja) pero la pantalla actual las infravalora: no muestra tamaño ni sexo del filtro y el
estado pausado no se lee de un vistazo. El rediseño sube la legibilidad y el peso visual de
la función sin inventar datos que el modelo no tiene.

## Plan de desarrollo

### Documentación a consultar

- `.claude/commands/adoptia-frontend.md` (tokens, shadcn, i18n), `.claude/commands/adoptia-testing.md`.
- Precedente de la tanda: FEATURE-039, FEATURE-037 (rediseño de citas) — **ficción del mock se
  sustituye por dato real o se cae** (DECISIONS 43-45).

### Seguridad

- Sin cambios. Sigue leyendo `saved_searches` bajo RLS (solo las del usuario). El toggle y el
  borrado ya pasan por RLS en `saved_searches` (update/delete `eq id`, políticas existentes).

### Modelo de datos

- **Sin cambios.** `saved_searches(id, name, filters jsonb, active, created_at)`.
- `filters` real (lo que escribe `CrearAlertaButton`): `especie`, `tamano`, `sexo`,
  `lat`/`lng`/`radio_km`. Nada más.

### API

- Sin cambios.

### Frontend

- **Página** `src/app/(adopter)/mi-cuenta/alertas/page.tsx` (Server Component): misma carga de
  datos; mapea cada alerta a una vista con chips derivados de `filters`. Mantiene el shell de
  página existente (contenedor `max-w-6xl`, sin sidebar — coherente con las demás subpáginas).
- **Nuevo client component** `src/components/alertas/AlertaCard.tsx`: tarjeta del wireframe —
  cabecera (nombre + fecha "Creada el…"), interruptor Activa/Pausada (mapea a `alternar()`),
  fila de chips de filtros, pie con acciones. Reemplaza el uso plano de `AlertaAcciones`
  (que se absorbe o se conserva como lógica interna del toggle/borrado).
- Chips reales: **Especie** (Perro/Gato/Otro), **Tamaño** (Pequeño/Mediano/Grande) si hay,
  **Sexo** (Macho/Hembra) si hay, **Distancia** (`a N km`) o **"Toda España"** si no hay ubicación.
- **Acciones de tarjeta:** interruptor (Activa↔Pausada), **"Ver resultados"** (link a
  `/animales` con los filtros de la alerta como query — reemplaza el "Editar" ficticio: no
  existe formulario de edición), **"Eliminar"** (con `window.confirm`).
- **Tarjeta "Nueva alerta"** punteada + botón de cabecera **"Crear nueva alerta"**: ambos
  enlazan a `/animales` (las alertas se crean guardando una búsqueda, no hay form en blanco).
- **Ficción del mock que se cae:** miniaturas de peludos "+5/+12" (no guardamos animales
  casados por alerta), "Último peludo encontrado hace X" (no hay timestamp de match), sección
  "40% de adopciones con IA" (estadística inventada + "nuestra IA"), chip "Urgente"
  (no hay campo). Sidebar/topbar/buscador propios del mock = chrome global, fuera de este item.
- Aviso de tope (≥5 alertas) y estado vacío se conservan, re-estilados.
- Textos nuevos a `messages/es.json` (`account.*`): fecha "Creada el", "Ver resultados",
  "Toda España", subtítulo/cabecera, confirm de borrado, etiquetas de chips reutilizando
  `animales.*` y `busqueda.*` existentes.

### Tareas TDD

1. `AlertaCard.test.tsx` (rojo→verde): renderiza chips según `filters` (especie/tamaño/sexo/
   distancia), muestra "Toda España" sin ubicación, interruptor refleja `active`, "Ver
   resultados" apunta a `/animales?…` con los filtros, "Eliminar" pide confirm y borra,
   toggle llama update de `saved_searches`.
2. Ampliar `alertas/page.test.tsx`: la página monta las tarjetas, sigue redirigiendo sin
   sesión, muestra tope con 5 y estado vacío.
3. Verificación visual contra `screen.png` + `npx tsc --noEmit` + lint + suite con RLS.

### Dependencias

- Ninguna.

## Criterios de aceptación / Casuística a cubrir

- [ ] Cada alerta se pinta como tarjeta con chips derivados de sus `filters` reales.
- [ ] Alerta sin ubicación muestra "Toda España"; con ubicación muestra "a N km".
- [ ] Interruptor refleja y alterna `active` (Activa/Pausada) vía RLS.
- [ ] "Ver resultados" lleva a `/animales` con los filtros aplicados; "Eliminar" confirma y borra.
- [ ] Cabecera y tarjeta "Nueva alerta" llevan al listado.
- [ ] ≥5 alertas: aviso de tope. Sin alertas: estado vacío con CTA.
- [ ] Sin sesión: redirige a /login.
- [ ] Sin datos inventados (miniaturas, timestamps de match, stats de IA, "Urgente").
