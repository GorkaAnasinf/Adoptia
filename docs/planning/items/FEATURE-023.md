---
id: FEATURE-023
tipo: feature
titulo: Avisos de perdidos — datos identificativos, fecha real del suceso y filtros
estado: desarrollo
prioridad: media
hito: "0.5"
duplicado_de: null
creado: 2026-07-15
actualizado: 2026-07-15
---

# FEATURE-023 — Avisos de perdidos: datos identificativos, fecha real del suceso y filtros

<!-- ============ PLANO 1: CAPTURA ============ -->

## Descripción

El aviso de perdido/encontrado se publica hoy con muy poca información: especie, nombre, descripción libre, ciudad y una foto. Con «perro marrón» no lo reconoce nadie por la calle, y buscar entre avisos tampoco se puede. Este item añade:

- **Datos identificativos estructurados**: raza, sexo, tamaño, color, si lleva collar (y cómo es) y si tiene microchip. **El número de microchip no, nunca** — identifica al dueño en el registro autonómico.
- **La fecha real del suceso**: hoy solo existe `created_at`, que es cuándo se publicó. Quien publica tres días tarde tiene un aviso que miente.
- **Filtros** por especie, tamaño y fecha en el mapa y el listado; hoy solo hay perdido/encontrado.

**Fuera de alcance**: la galería multi-foto se separó a **FEATURE-024** (el item entero pasaba de 10 tareas TDD). El número de microchip queda fuera para siempre.

## Contexto / impacto

Un aviso identificable es la diferencia entre que un vecino diga «puede que sea ese» y que no diga nada. Los datos estructurados son además la base de un futuro cruce automático perdido↔encontrado: sin ellos es imposible, aunque ese cruce no entra aquí.

<!-- ============ PLANO 2: PLAN TÉCNICO (Snoopy) ============ -->

## Plan de desarrollo

### Documentación a consultar

- [DATA_MODEL](../../technical/DATA_MODEL.md) (`lost_found_posts`, convención de `boolean nullable`), [DECISIONS](../../technical/DECISIONS.md) (#34 privacidad de la ubicación, #36 reescrituras de SQL)
- Skills: `adoptia-database`, `adoptia-frontend` (i18n, chips), `adoptia-testing`
- Precedentes a reusar, no reinventar:
  - **`boolean nullable` = «no lo sé»**: es la convención de las compatibilidades de `animals` (`good_with_kids`…), documentada en DATA_MODEL. Sirve tal cual para collar y microchip — no hace falta un enum nuevo.
  - Etiquetas ya existentes en `messages/es.json`: `animales.sexMale/sexFemale/sexUnknown`, `sizeSmall/sizeMedium/sizeLarge`, `speciesDog/Cat/Other`.
  - Enums `animal_sex` y `animal_size` ya existen: se reutilizan, no se duplican.
  - `PerdidosView` ya filtra por tipo en cliente con chips: mismo patrón para los nuevos filtros.

### Seguridad

- **Sin microchip: ni el número, ni un campo donde teclearlo.** Solo `has_microchip boolean` (null = no lo sé). Es un dato personal indirecto: identifica al dueño en el registro autonómico. Esto no se negocia ni «por comodidad del usuario».
- El resto de campos son descripciones del animal, no de la persona: no cambian la superficie de datos personales.
- Sin cambios de RLS: son columnas nuevas en una tabla cuyas políticas ya existen. **Aun así**, los tests de RLS deben cubrir que los campos nuevos son públicos en avisos `open`/`resolved` y no en `archived` ajenos, porque un `select` explícito nuevo podría filtrarse por otra vía.
- `occurred_on` con check de no-futuro en BD, además de validación en cliente.

### Modelo de datos

Migración `20260715xxxxxx_feature023_avisos_datos_identificativos.sql`:

```sql
alter table public.lost_found_posts
  add column breed text,
  add column sex public.animal_sex,                  -- null = no lo sé
  add column size public.animal_size,                -- null = no lo sé
  add column color text,
  add column has_collar boolean,                     -- null = no lo sé
  add column collar_description text,
  add column has_microchip boolean,                  -- null = no lo sé; el NÚMERO nunca
  add column occurred_on date;

-- Backfill: los avisos existentes toman la fecha de publicación como fecha del
-- suceso. Es lo más honesto que se puede inferir sin inventar.
update public.lost_found_posts set occurred_on = created_at::date where occurred_on is null;

alter table public.lost_found_posts
  alter column occurred_on set not null,
  add constraint lost_found_posts_occurred_on_pasado check (occurred_on <= current_date);
```

- **Nombre `occurred_on`, no `lost_at`** (que era el nombre en la captura): la tabla sirve para `lost` **y** `found`, y en un aviso de encontrado la fecha es la del hallazgo. `lost_at` habría mentido en la mitad de las filas.
- `date`, no `timestamptz`: nadie recuerda la hora exacta a la que se le escapó el perro, y pedirla es fricción sin valor. (Los avistamientos sí llevan `timestamptz`, porque ahí la hora importa.)
- `collar_description` solo tiene sentido con `has_collar = true`; se valida en cliente, no con un check en BD (un check acoplaría dos columnas por un detalle de UI).
- `lost_found_list` gana las columnas nuevas en su `returns table`. **Es una reescritura de función SQL: aplica la Decisión #36** — el test que protege su comportamiento se ejecuta antes de dar la reescritura por buena.
- Actualizar la tabla de `lost_found_posts` en DATA_MODEL.md.

### API

- Sin endpoints nuevos: el alta sigue siendo `insert` directo con RLS desde el formulario (patrón de FEATURE-012).

### Frontend

- **`NuevoAvisoForm`**: bloque «¿Cómo es?» con raza, sexo, tamaño, color, collar (sí/no/no lo sé + descripción condicional) y microchip (sí/no/no lo sé), más la fecha del suceso (`<input type="date">`, sin `max` — el bloqueo nativo corta el submit con un aviso sin traducir, lección de FEATURE-022). Los tres selectores de «no lo sé» por defecto: **el aviso debe poder publicarse en <2 min desde el móvil** (criterio de FEATURE-012 que sigue vigente), así que nada de campos obligatorios nuevos.
- **Ficha**: fila de datos identificativos, omitiendo lo que no se sabe (nunca «Sexo: no lo sé» ocupando sitio). La fecha del suceso sustituye a «Publicado el» cuando difieren, con ambas visibles si hay desfase.
- **`PerdidosView`**: chips nuevos de especie y tamaño + selector de fecha («cualquiera / últimos 7 días / últimos 30»), combinables con el de tipo. **Filtrado en cliente**, como el actual: el RPC ya devuelve los abiertos (máx. 500) y el mapa necesita todos los puntos igualmente; filtrar en servidor obligaría a un ida y vuelta por chip y a desincronizar mapa y listado. Si el volumen crece, se mueve a parámetros del RPC como hizo IMPROVEMENT-021 — hoy sería complejidad sin beneficio.
- Textos nuevos en `messages/es.json` bajo `perdidos.*`, reutilizando las etiquetas de `animales.*` para sexo/tamaño/especie. Cero literales.

### Tareas TDD

1. **RLS/BD**: los campos nuevos viajan en `lost_found_list` y son públicos en `open`; un aviso `archived` ajeno sigue sin devolverlos. Test del check de `occurred_on` futuro.
2. **Backfill**: los avisos previos a la migración quedan con `occurred_on = created_at::date` y `not null` se aplica sin romper (probado con `db reset` sobre el seed).
3. **`NuevoAvisoForm`**: publica sin tocar ningún campo nuevo (todos opcionales, «no lo sé» por defecto) y sigue cumpliendo el alta en una pantalla.
4. **`NuevoAvisoForm`**: guarda los campos rellenados; `collar_description` solo se envía con `has_collar = true`; fecha futura → error propio traducido, sin llamar a BD.
5. **Ficha**: muestra solo lo conocido; omite los «no lo sé»; muestra la fecha del suceso y, si difiere, también la de publicación.
6. **`PerdidosView`**: filtro por especie y por tamaño; combinados con el de tipo; estado vacío con su mensaje.
7. **`PerdidosView`**: filtro por fecha («últimos 7 días») usando `occurred_on`, no `created_at` — que es justo el bug que este item viene a arreglar.
8. **E2E**: publicar un aviso con datos identificativos → aparece filtrado por especie+tamaño en el listado. *(Ojo: la suite E2E está en BUG-008; este caso se escribe y se ejecuta en local, y entrará en CI cuando aquel cierre.)*

### Dependencias

- FEATURE-012 y FEATURE-022 (`hecho`). No depende de FEATURE-024 (galería), que puede ir después.

## Criterios de aceptación / Casuística a cubrir

- [ ] El alta sigue completándose en <2 min desde el móvil: **ningún campo nuevo es obligatorio** y todos los «sí/no/no lo sé» empiezan en «no lo sé».
- [ ] `occurred_on` es obligatoria y por defecto hoy; no admite fecha futura (validado en cliente **y** con check en BD).
- [ ] Los avisos anteriores a la migración conservan una fecha coherente (`created_at::date`) y nada se rompe al aplicar `not null`.
- [ ] La ficha muestra solo los datos conocidos; lo que se dejó en «no lo sé» no ocupa sitio.
- [ ] La ficha distingue cuándo ocurrió de cuándo se publicó, y enseña ambas si difieren.
- [ ] `collar_description` no se guarda si `has_collar` no es `true` (no quedan descripciones huérfanas de un collar que no existe).
- [ ] **No existe ningún campo para el número de microchip**, ni en BD, ni en el formulario, ni en la ficha.
- [ ] Filtros de especie, tamaño y fecha combinables con el de perdido/encontrado; el mapa y el listado muestran siempre lo mismo.
- [ ] El filtro de fecha usa la fecha del suceso, no la de publicación.
- [ ] Estado vacío: ninguna combinación de filtros deja una lista vacía sin mensaje.
- [ ] Los campos nuevos son públicos en avisos `open`/`resolved` y siguen ocultos en `archived` ajenos.
