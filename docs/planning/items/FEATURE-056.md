---
id: FEATURE-056
tipo: feature
titulo: Agenda de la protectora F2b — festivos nacionales y copiar/pegar día
estado: desarrollo
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-22
actualizado: 2026-07-22
---

# FEATURE-056 — Agenda de la protectora F2b (festivos + copiar/pegar)

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

Continúa las utilidades masivas de la Agenda (ver [FEATURE-053](FEATURE-053.md) y [FEATURE-054](FEATURE-054.md)). Añade dos utilidades ligeras que se apoyan en la selección múltiple y el batch (`upsert` de array) ya construidos en F2a:

1. **Festivos nacionales** — un botón cierra de un click los **festivos nacionales de España** del año visible (lista estática, decidido con el analista; los autonómicos/locales se cierran con el rango de F2a).
2. **Copiar día → pegar** — copiar la configuración de un día (cerrado u horario especial) y **pegarla** en los días que la protectora seleccione.

Las **plantillas de horario** (que necesitan tabla nueva `availability_templates` con RLS) se separan en **FEATURE-057** para no mezclar una migración con estas dos utilidades sin modelo.

## Contexto / impacto

Afecta a las **protectoras**. Los festivos nacionales son cierres previsibles año a año; cerrarlos de un click evita 9–10 ediciones manuales. Copiar/pegar clona un día ya configurado (p. ej. «el horario de los sábados») a otros sin rehacerlo.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy) ============ -->

## Plan de desarrollo

### Documentación a consultar

- [FEATURE-053](FEATURE-053.md) y [FEATURE-054](FEATURE-054.md) (`src/lib/agenda.ts`, `AgendaCliente`, `UtilidadesBar`, `PanelDiaEditor`, batch `ejecutarBatch`).
- `docs/technical/DECISIONS.md` #46–49 (modelo y batch atómico).
- Skills: `adoptia-frontend`, `adoptia-testing`.

### Seguridad

- **Sin superficie nueva de BD**: festivos y pegar usan el mismo `upsert` de array sobre `availability_overrides` (RLS de la dueña, ya con test del array ajeno en F2a).
- Validación: al pegar un horario especial, revalidar las franjas (`validarFranjas`) antes del batch.
- Sin datos personales → sin RGPD.

### Modelo de datos

- **Sin cambios** (reutiliza `availability_overrides`). Sin migración.

### API

- **Sin endpoints** (batch por supabase-js/RLS). `API_CONTRACTS.md` sin cambios.

### Frontend

- **`src/lib/festivos.ts`** — `festivosNacionales(year): string[]`: fechas ISO de los festivos nacionales fijos (1-ene, 6-ene, 1-may, 15-ago, 12-oct, 1-nov, 6-dic, 8-dic, 25-dic) **+ Viernes Santo** (calculado con el algoritmo de cómputo de la Pascua). Función pura y testeable.
- **`UtilidadesBar`** — botón **«Cerrar festivos»**: cierra los festivos del año visible (nota «Festivo»). Confirmación ligera antes de aplicar.
- **`AgendaCliente`**:
  - `cerrarFestivos(year)` → `ejecutarBatch` con los festivos del año como overrides `closed` (nota «Festivo»).
  - **Copiar/pegar**: `portapapeles: EstadoDia | null` en estado. `PanelDiaEditor` gana un botón **«Copiar día»** (emite el estado del día al padre). En modo selección, si hay algo copiado, aparece **«Pegar»** → `ejecutarBatch` aplicando el estado copiado (cerrado → `closed`; especial/patrón → `slots`) a los días seleccionados.
- i18n: nuevas claves en el namespace `agenda`.

### Tareas TDD

1. **`festivosNacionales`** — unit test: incluye los fijos del año; Viernes Santo correcto para ≥2 años conocidos (p. ej. 2026-04-03, 2027-03-26); todas las fechas del año pedido.
2. **`UtilidadesBar` — botón festivos** — test: el botón invoca el callback de cerrar festivos.
3. **`AgendaCliente` — cerrar festivos** — test: `upsert` de un array que contiene los festivos del año, todos `closed` con nota «Festivo».
4. **`PanelDiaEditor` — copiar día** — test: «Copiar día» emite el estado del día al padre.
5. **`AgendaCliente` — pegar en selección** — test: con un día copiado (cerrado) y varios seleccionados, «Pegar» hace un `upsert` aplicando esa config a todos; caso de copiar un horario especial (slots).
6. i18n + estados (nada copiado → sin «Pegar»; festivos ya cerrados no rompen) + `tsc`/lint/coverage verdes.

### Dependencias

- [FEATURE-053](FEATURE-053.md) y [FEATURE-054](FEATURE-054.md) `hecho`. ✅

## Criterios de aceptación / Casuística a cubrir

- [ ] «Cerrar festivos» cierra los festivos nacionales del año visible con nota «Festivo» (un upsert).
- [ ] `festivosNacionales` calcula bien los fijos y el Viernes Santo (movible) del año.
- [ ] Copiar un día y pegarlo en varios: cerrado se pega como cerrado; horario especial se pega con sus franjas.
- [ ] Sin nada copiado, la acción «Pegar» no aparece / está deshabilitada.
- [ ] Pegar un horario inválido (no debería ocurrir por origen válido) se bloquea con `validarFranjas`.
- [ ] Seguridad: los batch respetan la RLS de la dueña (cubierto por el test de array ajeno de F2a).
- [ ] Error de batch con feedback; textos en `messages/es.json`; `tsc`/lint limpios.
