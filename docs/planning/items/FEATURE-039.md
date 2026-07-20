---
id: FEATURE-039
tipo: feature
titulo: Rediseño de Mi cuenta como dashboard del adoptante (tanda, pantalla 6)
estado: listo
prioridad: alta
hito: "0.5"
duplicado_de: null
creado: 2026-07-20
actualizado: 2026-07-20
---

# FEATURE-039 — Mi cuenta (/mi-cuenta) como dashboard del adoptante

## Descripción

Sexta pantalla de la tanda: wireframe en `assets/wireframes/usuariodashboard/`. Hoy `/mi-cuenta` es una **página muerta**: un empty state fijo con dos enlaces, sin una sola consulta a datos. El adoptante entra a su área personal y no ve nada de lo suyo — tiene que navegar por el menú lateral para enterarse de si tiene una cita mañana o una solicitud aprobada esperando reserva.

El mock pide convertirla en el **panel de inicio del adoptante**, espejo de lo que `/panel` es para la protectora:

- **Hero teal** (`secondary-container`) con saludo «¡Hola, {nombre}!», frase de agradecimiento, huella decorativa y dos CTAs (granate «Explorar animales» + tonal «Ver mis solicitudes»).
- **Tres tarjetas de métrica** en fila: favoritos, solicitudes en curso, citas próximas.
- **Columna principal**: «Solicitudes recientes» (foto, nombre, fecha, chip de estado, chevron) y «Mis favoritos» (tira de 3 miniaturas + tile «Explorar»).
- **Columna lateral**: panel granate destacado, bloque de **Recordatorios** y tarjeta de **caso urgente** con foto.

## Contexto / impacto

Es la pantalla de aterrizaje tras el login de todo adoptante (`post-login`), la más vista del rol y hoy la más pobre del producto. Afecta a la retención: quien no ve el estado de su solicitud no vuelve. Instrucción de la tanda: coherencia con lo liberado (home, /animales, /protectoras, /mapa, /perdidos-encontrados), A11y de serie, y fidelidad con cabeza — los datos reales mandan sobre el mock.

## Plan de desarrollo

### Alcance

- **Dentro**: solo `src/app/(adopter)/mi-cuenta/page.tsx` (hoy 42 líneas) + componentes nuevos y claves i18n. Las seis subpáginas (`solicitudes`, `favoritos`, `citas`, `alertas`, `acogida`, `donaciones`) **no se tocan** — quedan como follow-up de la tanda.
- **El sidebar del mock ya existe**: `AppShell` + `AppSidebar` con los 7 ítems del rol adopter. No se reconstruye. El bloque de perfil inferior del mock («Elena García / Adoptante Silver / Find a Pet») **no se implementa**: no hay niveles de usuario en el modelo y el avatar/nombre ya vive en el `UserMenu` de la cabecera.

- **Fidelidad con cabeza (los datos reales mandan)**:
  - **«Donaciones realizadas €150» → «Citas próximas»**. En Adoptia una donación es un `donation_offers` (ofrecimiento de material: pienso, mantas), **no dinero**. No hay importes que sumar, así que la tercera métrica pasa a citas confirmadas/pendientes futuras, que sí existe y es accionable. Enlaza a `/mi-cuenta/citas`.
  - **«Tu Impacto» (5 peludos alimentados, 120 kg, «Donar de nuevo») → panel granate «Tu aportación»**. Mismo peso visual (`primary` sólido, texto blanco, corazón de marca en marca de agua), pero con las tres formas reales de ayudar que el usuario ya tiene o puede activar: **ofrecimientos de donación activos** (`donation_offers` con `status` activo), **alta como casa de acogida** (`foster_homes.active`), **alertas activas** (`saved_searches.active`). Cada fila es un enlace a su subpágina; si el contador es 0 la fila invita a darse de alta en vez de mostrar un cero triste. CTA final blanco → `/necesidades`. **Cero cifras inventadas.**
  - **«Mensajes» del sidebar del mock**: no existe mensajería en el producto. No se añade al nav ni se enlaza.
  - **«Caso urgente / Koda busca hogar»**: no hay campo `urgente` en `animals` (candidato a item ya anotado en el BACKLOG). Se resuelve **sin migración**: animal con `status = 'available'` y `published_at` **más antiguo** (el que más lleva esperando), con los días de espera calculados en render. Copy honesto: «Lleva {dias} días esperando una familia», badge «Lleva más tiempo esperando» (no «CASO URGENTE», que sería una promesa falsa). Excluye los que el usuario ya tiene en favoritos.
  - **«Recordatorios»**: se alimenta de tres fuentes reales, ordenadas por urgencia — (1) próxima cita (`appointments` futura pending/confirmed) con fecha y protectora; (2) solicitud **aprobada sin cita reservada**, que es exactamente la acción pendiente que hoy se pierde (enlaza a `/mi-cuenta/citas/nueva/{requestId}`); (3) propuesta de acogida pendiente de responder (`foster_proposals` con `status` pendiente). Si no hay ninguno, el bloque no se renderiza (no un placeholder vacío).
  - **Chips de estado de solicitud**: el mock usa teal pastel para todo. Se mantienen los **cinco estados reales** ya definidos en `/mi-cuenta/solicitudes` (pendiente/aprobada/rechazada/retirada/completada) con su color, para no contar dos historias distintas de la misma solicitud en dos pantallas.
  - **Buscador de la cabecera del mock** («Buscar mascotas o refugios…»): fuera de alcance, es una feature nueva, no un restyle. Anotar como candidato a item.
- **Estado vacío (usuario recién registrado)**: sin favoritos, sin solicitudes y sin citas, el dashboard **no** muestra tarjetas a cero. Muestra hero + un bloque **«Primeros pasos»** con el mismo patrón que `PrimerosPasos` de `/panel` (explorar animales → guardar un favorito → enviar tu primera solicitud). Coherencia de rol a rol.
- **Coherencia tanda**: tokens `surface-container-*` + `shadow-soft`, `rounded-2xl`, H1 Montserrat, `Reveal` escalonado en las tarjetas de métrica, `motion-safe:active:scale-95` en los enlaces-tarjeta, imágenes vía `next/image` con `esImagenValida`.
- **Incoherencia detectada de paso** (fix incluido, 1 línea): en `AppShell`, el logo `Marca` enlaza siempre a `/panel`, también para el rol `adopter` — un adoptante que pulsa el logo aterriza en el panel de protectora y se come una redirección. Pasa a `/mi-cuenta` cuando `role === "adopter"` (y `/admin/protectoras` queda como está para admin, que ya funciona porque su nav no incluye `/panel`).

### Documentación a consultar

- `assets/wireframes/usuariodashboard/{code.html,DESIGN.md,screen.png}`, [DESIGN](../../technical/DESIGN.md), [DATA_MODEL](../../technical/DATA_MODEL.md), skills `adoptia-frontend`, `adoptia-testing`, `adoptia-security` (lecturas bajo RLS).
- Referencia de implementación: `src/app/(shelter)/panel/page.tsx` — el dashboard equivalente del otro rol (tarjetas de métrica, listas, `PrimerosPasos`); se reutiliza su lenguaje, no su código literal.

### Seguridad

- **Sin superficie nueva**: todo son lecturas con el cliente SSR del usuario (`createClient`), donde RLS ya limita `favorites`, `adoption_requests`, `appointments`, `saved_searches`, `foster_homes` y `foster_proposals` a las filas propias. **No se usa `createAdminClient`** (el panel de protectora sí lo necesita para nombres de adoptantes; aquí no hay datos de terceros que mostrar).
- El animal «que más lleva esperando» es **dato público** (`animals` publicados, ya legibles por anónimos en `/animales`): no filtra nada privado.
- `redirect("/login")` si no hay sesión, igual que las subpáginas.
- Sin datos personales nuevos en pantalla → sin impacto RGPD.

### Modelo de datos

- Sin cambios. Ni migraciones ni columnas nuevas (el «urgente» del mock se resuelve con `published_at`).

### API

- Sin cambios. Todo son consultas desde el Server Component.

### Frontend

- `src/app/(adopter)/mi-cuenta/page.tsx`: Server Component; las consultas en un solo `Promise.all` (favoritos+animal, solicitudes+animal, citas futuras, `saved_searches` activas, `foster_homes`, `foster_proposals` pendientes, animal que más espera). Decide entre dashboard y «Primeros pasos». Nombre del usuario desde `user.user_metadata.full_name` (mismo origen que `UserMenu`), con fallback sin nombre en el saludo.
- `src/components/cuenta/HeroCuenta.tsx` — hero teal con saludo, huella decorativa y CTAs.
- `src/components/cuenta/TarjetaMetrica.tsx` — tarjeta de métrica (icono tonal, etiqueta, cifra), reutilizada 3 veces.
- `src/components/cuenta/PanelAportacion.tsx` — panel granate con las tres filas reales + CTA.
- `src/components/cuenta/Recordatorios.tsx` — componente **puro** (recibe la lista ya calculada), testeable sin Supabase; patrón `PopupAviso` de IMPROVEMENT-029.
- `src/lib/cuenta/recordatorios.ts` — función pura que compone y ordena los recordatorios a partir de citas/solicitudes/propuestas. Aquí vive la lógica, aquí van los tests finos.
- `src/components/cuenta/CasoDestacado.tsx` — tarjeta del animal que más lleva esperando (foto, días, CTA).
- `messages/es.json` (`account.*`): claves nuevas del dashboard (saludo, subtítulo, etiquetas de métricas, títulos de bloque, copys de aportación, recordatorios, caso destacado, primeros pasos). **Ningún literal en JSX.**
- `src/components/layout/AppShell.tsx`: destino del logo según rol.

### Tareas TDD

1. `src/lib/cuenta/recordatorios.test.ts` — la función pura: cita futura primero; solicitud `approved` **sin** cita genera recordatorio de reserva; solicitud `approved` **con** cita no lo genera (caso que se escapa fácil); propuesta de acogida pendiente incluida; lista vacía cuando no hay nada.
2. `Recordatorios.test.tsx` — render de cada tipo con su enlace correcto; no renderiza nada con lista vacía.
3. `page.test.tsx` (dashboard) — usuario con actividad: se ven las 3 métricas con sus cifras y las solicitudes recientes con su chip de estado real.
4. `page.test.tsx` (vacío) — usuario sin favoritos/solicitudes/citas: se ve «Primeros pasos» y **no** tarjetas a cero.
5. `page.test.tsx` (auth) — sin sesión → `redirect("/login")`.
6. `PanelAportacion.test.tsx` — con ofrecimientos/acogida/alertas muestra los contadores; con 0 muestra la invitación a darse de alta, no un «0».
7. `CasoDestacado.test.tsx` — días de espera calculados desde `published_at`; no se renderiza si el animal ya está en favoritos o si no hay ninguno publicado.
8. `AppShell.test.tsx` — el logo enlaza a `/mi-cuenta` con `role="adopter"` y a `/panel` con `role="shelter"`.
9. Restyle sin lógica (hero, tira de favoritos, tokens, `Reveal`) — cubierto por los tests de render anteriores.
10. Revisión visual contra `screen.png` (desktop/tablet/móvil) + `prefers-reduced-motion` + foco visible en todos los enlaces-tarjeta.

### Dependencias

- FEATURE-034/036/037/038, IMPROVEMENT-027/028/029 (`hecho`) — lenguaje visual de la tanda ya fijado.

## Criterios de aceptación / Casuística a cubrir

- [ ] `/mi-cuenta` muestra hero con «¡Hola, {nombre}!»; sin `full_name`, un saludo sin nombre (nunca «¡Hola, undefined!» ni el email crudo).
- [ ] Tres métricas correctas: favoritos (nº de `favorites`), solicitudes en curso (`pending` + `approved`), citas próximas (futuras `pending`/`confirmed`). Cada tarjeta enlaza a su subpágina.
- [ ] «Solicitudes recientes»: hasta 3, más nuevas primero, con foto de portada, nombre del animal, fecha de envío y chip del estado real; enlace «Ver todas» a `/mi-cuenta/solicitudes`.
- [ ] Solicitud cuyo animal fue despublicado (`animals` null o `published_at` null): la fila se muestra sin romper, con el texto de «animal ya no publicado» que ya existe.
- [ ] «Mis favoritos»: hasta 3 miniaturas + tile «Explorar» a `/animales`. Animal sin foto válida → placeholder de huella, nunca imagen rota.
- [ ] Panel «Tu aportación»: contadores reales de ofrecimientos activos, acogida y alertas; con 0 en una fila, invitación a activarla; sin importes ni kilos inventados en ningún caso.
- [ ] Recordatorios: próxima cita con fecha/hora en `Europe/Madrid` y protectora; solicitud aprobada sin cita con enlace a reservar; propuesta de acogida pendiente. Sin ninguno, el bloque no aparece.
- [ ] Caso destacado: animal `available` publicado con `published_at` más antiguo, con días de espera; excluye favoritos del usuario; si no hay ninguno publicado, el bloque no aparece.
- [ ] Usuario recién registrado (0 favoritos, 0 solicitudes, 0 citas): «Primeros pasos» con los 3 pasos enlazados; sin métricas a cero.
- [ ] Sin sesión: redirección a `/login` (no fuga de la plantilla del dashboard).
- [ ] RLS: la página no usa cliente admin; un usuario nunca ve solicitudes, citas, favoritos, alertas ni propuestas de otro (test de RLS existente cubre las tablas; el test de página verifica que solo se consulta con el cliente SSR).
- [ ] Todos los textos desde `messages/es.json`; `npm run lint` sin literales nuevos.
- [ ] A11y: un solo `h1`, jerarquía `h2` por bloque, contraste AA en hero teal y panel granate, foco visible en enlaces-tarjeta, huella e iconos decorativos con `aria-hidden`, área táctil ≥ 44 px.
- [ ] Responsive: 1 columna en móvil (métricas apiladas, lateral debajo), 3 métricas en fila y lateral a la derecha en desktop; sin scroll horizontal.
- [ ] `prefers-reduced-motion`: sin animaciones de entrada.
- [ ] Logo de `AppShell` lleva al inicio del rol correcto.
- [ ] Suite completa verde con RLS y `npx tsc --noEmit` limpio.
