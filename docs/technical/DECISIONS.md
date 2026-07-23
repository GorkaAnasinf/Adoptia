# Registro de decisiones — Adoptia

Formato ligero tipo ADR. Toda decisión con impacto estructural se registra aquí con fecha y motivo. Las decisiones marcadas 🔒 vienen fijadas por el análisis técnico aprobado (biblia) — no reabrirlas sin causa mayor.

## 2026-07-04 — Inicialización

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| 1 🔒 | **Coste 0 €** como restricción rectora | Proyecto sin presupuesto; demo a dirección | Cualquier servicio de pago |
| 2 🔒 | **Next.js 15 + TypeScript en Vercel** | SEO crítico (fichas indexables) exige SSR/ISR; deploy git-push gratis | SPA pura (sin SEO), Render (apaga servicios free tras 15 min) |
| 3 🔒 | **Supabase** (Postgres + Auth + Storage + RLS) | Todo en un servicio free sin expiración; PostGIS disponible | Render Postgres (expira a 30 días), Firebase (NoSQL no encaja) |
| 4 🔒 | **PostGIS** para proximidad | Búsqueda por distancia real (`ST_DWithin`) es feature núcleo | Haversine en JS (no escala, sin índice) |
| 5 🔒 | **RLS como pilar de seguridad** | Políticas en BD, no en código; imposible saltárselas desde cliente | Autorización solo en aplicación |
| 6 🔒 | **Leaflet + OpenStreetMap + Nominatim** | 100% gratis, sin API key ni tarjeta | Google Maps (exige tarjeta) |
| 7 🔒 | **Resend** para email transaccional | Free 100/día suficiente para MVP; DX buena | SendGrid (free más restrictivo) |
| 8 🔒 | **Tailwind + shadcn/ui** | Encaja con salidas de Stitch; tokens de DESIGN.md | MUI/AntD (look corporativo, pesa) |
| 9 | **Sin backend separado** — Route Handlers | Un solo deploy; Render queda como plan B si hiciera falta procesado pesado | NestJS/FastAPI aparte (coste operativo sin necesidad aún) |
| 10 | **Sin Docker en local** | Deploy es Vercel+Supabase; desarrollo contra proyecto cloud + `next dev`. `supabase start` disponible si se quiere BD local | docker-compose propio |
| 11 | **Repo único** (no monorepo) | Una sola app Next.js; `packages/` sería ceremonia vacía | Monorepo |
| 12 | **ES único + i18n preparado (next-intl)** | Mercado inicial España; retrofitting de i18n es caro, se cablea desde el día 1 | Multiidioma real (coste de traducción sin demanda) |
| 13 | **Vitest + Testing Library + Playwright** | Vitest nativo con Vite/Next, rápido; Playwright para E2E críticos | Jest (más lento, config extra) |
| 14 | **Umami / Vercel Analytics** | Sin cookies → banner de cookies mínimo, RGPD-friendly | GA4 (cookies, consentimiento complejo) |
| 15 | **Compresión de imagen en cliente** (≤300 KB) + YouTube para vídeo | Proteger 1 GB de Storage free | Cloudinary (queda como escalado futuro) |
| 16 | **Items como única fuente de verdad** + render determinista | Evita drift entre BACKLOG/ROADMAP; ChatGPT solo toca `items/` | Planificación editada a mano |

## 2026-07-05 — FEATURE-000 (andamiaje)

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| 17 | **Tests de RLS contra stack local** (`supabase start` + CLI como devDependency, vars `SUPABASE_TEST_*`) | Verificar políticas reales en Postgres sin tocar el proyecto cloud; se saltan si no hay stack (suite unitaria rápida) | Mockear supabase-js (no prueba las políticas de verdad) |
| 18 | **Grants explícitos a `anon/authenticated/service_role` en la migración** | Los default privileges del rol de migración no cubrían las tablas nuevas (`permission denied`); el control de acceso real lo gobierna RLS | Depender de default privileges implícitos |
| 19 | **Rol verificado en middleware + RLS como red final** | Defensa en profundidad barata: middleware redirige por rol (`/panel`→shelter, `/admin`→admin) sin flash de contenido | Solo comprobación en página o solo RLS (UX pobre) |
| 17 | **Manada SDD** (tema perros: Balto, Lassie, Snoopy, Bolt, Scooby, Hachiko) | Elección del propietario; coherente con el dominio | Panteón griego (default) |
| 18 | **Gitflow sin PRs**: `develop` → `main`, ramas `feature/FEATURE-NNN-slug` | Equipo de 1; CI protege calidad | PRs obligatorias (fricción sin revisores) |
| 19 | **Keepalive cron** (GitHub Actions 2×/semana) | Supabase free pausa tras 7 días de inactividad | Aceptar pausas (mala demo) |

## 2026-07-05 — FEATURE-001 (registro y login)

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| 20 | **Trigger de alta con whitelist de rol** (solo adopter/shelter; el resto cae a adopter) | El signup deja pasar metadata arbitraria; sin whitelist, un signup directo a la API con `role:admin` escala privilegios | Confiar en que el formulario solo envía roles válidos |
| 21 | **CAPTCHA Cloudflare Turnstile** en auth | Free, ligero y con integración nativa en Supabase; complementa los rate limits contra bots | hCaptcha (peor DX), solo rate limits (no frena bots que rotan IP) |
| 22 | **SMTP de Gmail + plantillas HTML propias** para el MVP | Coste 0 y control total del diseño de los correos; suficiente para el volumen inicial (~500/día) | SMTP por defecto de Supabase (2/h, remitente genérico), Resend (requiere dominio verificado) |
| 23 | **Política de contraseña fuerte** (mayús+minús+dígito+símbolo) alineada cliente y servidor | El servidor (Supabase) la exige; el cliente debe reflejarla para no rebotar al usuario | Solo validación en servidor (mala UX) |

## 2026-07-09 — FEATURE-004 / pulido del alta (IMPROVEMENT-007..011)

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| 24 | **Photon (photon.komoot.io) para autocompletar direcciones** (complementa a Nominatim de #6; llamado desde el servidor con caché) | Nominatim no está pensado para autocompletar (1 req/s, sin tipo *search-as-you-type*); Photon es gratis, sin clave y devuelve sugerencias al teclear. **Nota:** Photon **no** admite `lang=es` (solo default/de/en/fr). Nominatim se mantiene para "Localizar en el mapa" | Cartociudad/IGN (mejor callejero ES pero API antigua y más costosa de integrar); seguir solo con Nominatim (UX pobre) |
| 25 | **Provincia con lista fija de las 52** (`matchProvincia`) y municipios vía Photon `place`; nunca se pisa la provincia elegida con la comarca de OSM (`county`) | OSM mete comarcas ("Iruñerria") en `county`; sin control, el combo quedaba con valores inválidos | Confiar en los campos administrativos de OSM tal cual |
| 26 | **Vista previa del perfil = componente público real** (`ShelterPublicProfile` compartido entre `/protectoras/[slug]` y el editor) | Garantiza que "lo que ves es lo que se publica" sin duplicar UI ni divergencias | Renderizar una maqueta aparte para la vista previa |
| 27 | **Búsqueda pública vía RPC `animals_search` SECURITY INVOKER** (2026-07-10): filtros, distancia PostGIS, portada y `total_count` en una sola función SQL; el builder TS (`src/lib/animal-search.ts`) traduce la URL a argumentos | El orden por distancia y el recuento total no se pueden expresar con el query builder de supabase-js; al ser *invoker*, la RLS de `animals`/`shelters` sigue aplicando (anon solo ve publicado+verificado) | Ordenar/paginar en JS (rompe con paginación), vista materializada (complejidad sin necesidad a esta escala), SECURITY DEFINER (duplicaría las garantías de RLS a mano) |

## 2026-07-10 — FEATURE-006 (mapa de protectoras)

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| 28 | **`shelters_nearby` extendido manteniendo SECURITY DEFINER** (filtra `status='verified'` dentro de la función, añade especie/voluntariado/acogida, `animal_count` y `lat`/`lng`) | Ya existía como *definer* desde el baseline; cambiar a *invoker* habría exigido replicar en RLS la lógica de "solo verificadas" sin ganar nada, al ser una función de solo lectura ya acotada | Migrar a SECURITY INVOKER como `animals_search` (más consistente, pero sin beneficio real aquí) |
| 29 | **Centro por defecto Madrid + radio 1000 km** cuando el usuario no comparte ubicación ni busca ciudad (`DEFAULT_CENTER`/`DEFAULT_RADIUS_KM` en `src/lib/shelters-search.ts`) | El RPC exige `lat`/`lng` no nulos; cubre península + Baleares sin tener que duplicar el RPC en una variante "sin filtro de radio" | RPC con `lat`/`lng` opcionales (más complejidad SQL para un caso — "ver todas" — que hoy no distingue de un radio amplio) |
| 30 | **`leaflet.markercluster` imperativo** (vía `useMap()` + `L.markerClusterGroup()` en un efecto) en vez de un wrapper React del ecosistema | Los wrappers de `react-leaflet-markercluster` no tienen versión compatible con `react-leaflet` 5 / React 19; la librería vanilla es estable y el efecto imperativo es el mismo patrón ya usado para Leaflet en el proyecto (Decisión #8) | `@changey/react-leaflet-markercluster` (peer deps desactualizadas, riesgo de incompatibilidad silenciosa) |
| 31 | **Bottom sheet móvil con gesto propio** (pointer events con umbral tap/arrastre) en vez de una librería de bottom sheet | Sin dependencia nueva; el gesto necesario (colapsar/expandir con tap o arrastre) es simple y totalmente testeable con `fireEvent.pointerDown/Up` | Librería dedicada (`vaul`, `react-modal-sheet`): más peso y menos control sobre el layout `lg:hidden` ya existente |

## 2026-07-10 — FEATURE-007 (solicitud "Me interesa")

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| 32 | **RLS por columna en `adoption_requests`** (revoke de `SELECT`/`UPDATE` completo a `authenticated`/`anon`, grant explícito columna a columna sin `shelter_notes`, trigger `BEFORE UPDATE` que bloquea que el adoptante cambie `status` a algo distinto de `withdrawn` o toque `shelter_notes`) | Postgres no soporta un `USING`/`WITH CHECK` de RLS distinto por columna; con solo RLS de fila, el adoptante dueño de la solicitud podía leer y escribir las notas internas de la protectora directamente contra la API de Supabase | Vista separada para la protectora (duplica la superficie de lectura y la RLS habría que replicarla igual); mover `shelter_notes` a tabla aparte (más JOIN sin necesidad a esta escala) |

| 33 | **Sin tabla `notifications` en FEATURE-010** — el "una sola vez" de favoritos se registra en `favorites.notified_at` y el tope de 1 email/día por alerta en `saved_searches.last_sent_at`; el matching alerta↔animal vive en el RPC `saved_search_matches` (security definer, solo service_role) y el tope de 5 alertas por usuario es un trigger `BEFORE INSERT` (2026-07-11) | Dos timestamps cubren exactamente los criterios de aceptación sin una tabla genérica que habría que idear, poblar y limpiar; en BD el tope y el matching son atómicos y no dependen de que cada cliente los respete | Tabla `notifications` genérica (infraestructura sin caso de uso todavía; se reevaluará si llegan notificaciones in-app) |

## 2026-07-15 — FEATURE-022 / BUG-006

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| 34 | **El redondeo de privacidad de ~200 m se aplica a TODA geometría que aporte un usuario sobre un aviso**, no solo al aviso: `lost_found_sightings` reusa `round_lost_found_location()` (FEATURE-022) | La garantía de FEATURE-012 es "la coordenada exacta nunca llega a existir en BD". Un pin exacto de avistamiento la rompe por la puerta de atrás: delata dónde vive quien reporta | Guardar el pin exacto del avistamiento y redondear al leer (la coordenada exacta existiría en BD y podría filtrarse por dump, backup o `service_role`) |
| 35 | **Contacto entre particulares por relay con `Reply-To`**: el email va al destinatario con el mensaje; el correo del remitente viaja en `Reply-To` (lo cede al escribir, avisado) y el del destinatario nunca sale de `auth.users` (FEATURE-022) | Permite conversación real sin exponer el correo de quien publica el aviso, que es el lado vulnerable (estafa del rescate). Extiende el patrón ya probado de `/api/acogida/contactar` | Buzón interno de mensajes en BD (tabla, bandeja, notificaciones: infraestructura enorme para un mensaje suelto); mostrar los correos (spam y scraping) |
| 36 | **Al reescribir una función SQL, el test que protege su regla de negocio se ejecuta antes de dar por buena la reescritura** — y ese test debe comprobar `error` en sus fixtures (BUG-006) | IMPROVEMENT-021 reescribió `animals_search` y perdió el filtro `type='photo'`; el test que debía cazarlo llevaba roto desde que se escribió (insert masivo con claves desiguales que PostgREST rechaza, error nunca comprobado) y los tests RLS se saltan solos sin `SUPABASE_TEST_*`. La regresión llegó a producción | Confiar en que la reescritura conserva las cláusulas (así se coló) |
| 39 | **Los E2E se ejecutan en CI en cada push** (job `e2e`, activo desde BUG-008) y **no dependen de terceros**: sin captcha (`playwright.config` vacía la site key de Turnstile), contra `npm run dev` —obligatorio: la CSP solo permite el Supabase local fuera de producción— y con `workers: 2`, porque comparten un servidor y una BD | La suite llevaba tanto sin ejecutarse que 20 de 28 tests fallaban, y **ninguno por estar mal escrito**: la UI había cambiado debajo (menú de usuario, buscador de la home, wizard de solicitudes, clustering del mapa). Un test que nadie corre no es una red de seguridad, es documentación que envejece. Los fixtures usan `sembrarPorSlug` y limpian lo que siembran | Dejarlos solo en local (nadie los corría); `test.skip` cuando falta el entorno (invisible: es lo que dejó pasar BUG-006); paralelismo por defecto (8 workers: 8 verdes de 28) |
| 38 | **La versión de Node vive solo en `.nvmrc` y la fija producción**, no CI: `.nvmrc` = 24 (la de Vercel), ambos jobs la leen con `node-version-file`, y `engines: >=22` marca el suelo técnico (IMPROVEMENT-023) | Convivían tres versiones (Vercel 24, CI 20, desarrollo 22.19) y la que decide si algo se despliega era la más lejana de producción; con Node 20 los tests de RLS ni arrancaban. Con el número escrito a mano en cada job, separarse otra vez es cuestión de tiempo | Fijar CI en 22 (seguiría sin ser lo de producción); poner el número a mano en cada job (así divergieron); `engines: >=24` (obligaría a actualizar el entorno local sin necesidad técnica) |
| 37 | **Los tests de RLS se ejecutan en CI contra un Postgres real** (job `rls` con `supabase start` en el runner), y **saltárselos es un fallo, no un salto**: con `CI=true` y sin `SUPABASE_TEST_*`, `helpers.ts` lanza (BUG-007). Matiza la #17: el `skipIf` sigue siendo correcto en local | 123 tests se saltaban en verde en cada push desde que existían — un `skipIf` silencioso es indistinguible de un test que pasa, y "RLS es el pilar de seguridad" es la regla 2. BUG-006 llegó a producción por ese agujero. Las claves del stack local son las de demo del CLI, así que no hacen falta secretos | Dejar los RLS solo en local (nadie los corría); exigir Docker también en local (rompería la suite rápida y la Decisión #17) |

## 2026-07-17 — FEATURE-029 (propuestas de acogida)

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| 40 | **Baja del acogedor = supresión real también de sus propuestas** (`foster_proposals.foster_user_id → foster_homes on delete cascade`): la protectora pierde ese historial | Coherente con la baja de FEATURE-016 («darse de baja y borrar mis datos» probado con delete real); RGPD gana a la trazabilidad — una propuesta anonimizada seguiría describiendo a una persona identificable por zona y condiciones | Anonimizar la fila conservando el historial de la protectora (retiene datos derivados tras una solicitud de supresión) |
| 41 | **El bloqueo de reenvío vive en BD** — índice único parcial `(shelter_id, foster_user_id) where status in ('enviada','aceptada')` — y el handler traduce `23505` a `409 proposal_exists` | La UI ya oculta el botón, pero «la UI oculta; la BD prohíbe» (regla 2): dos pestañas o un cliente malicioso no deben poder duplicar propuestas ni spamear | Comprobación `select` previa en el handler (carrera entre peticiones concurrentes) |
| 42 | **Las ofertas de donación caducan por `renovada_at` no manipulable** (FEATURE-032): trigger que fija `renovada_at = now()` para clientes normales (exime `service_role`), cron diario que marca `caducada` a los 60 días y el RPC filtra además `renovada_at >= now() - 60 días` como doble red | Evita el tablón zombie sin confiar en el cliente (nadie se fecha en el futuro) y el tablón queda limpio aunque el cron llegue tarde; tope de 5 abiertas por usuario como anti-abuso (patrón `saved_searches`) | `expires_at` editable por el dueño (manipulable) o caducidad solo por cron (ventana sucia entre pasadas) |

## 2026-07-20 — FEATURE-039 (dashboard del adoptante)

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| 43 | **El dashboard solo enseña cifras que existen en el modelo**: el wireframe pedía euros y kilos donados, niveles de usuario y mensajería; se sustituyen por ofrecimientos activos, alta de acogida y alertas, y la «urgencia» se deriva de `published_at` (días esperando) en vez de un campo nuevo | Una métrica inventada es peor que no tenerla: en Adoptia una donación es un ofrecimiento de material, no dinero, y prometer «CASO URGENTE» sin criterio detrás es una promesa que el producto no puede sostener. Además evita una migración solo por estética | Añadir columna `urgente` a `animals` y un modelo de donaciones monetarias que el producto no tiene |
| 44 | **Las lecturas del área personal filtran por dueño en el cliente aunque RLS ya filtre**, cuando la política tiene más de un destinatario (caso `foster_proposals`: la ve el acogedor **y** la protectora que la envía) | RLS protege de ver datos ajenos, no de mezclar roles: un usuario con protectora propia veía sus propias propuestas enviadas como recordatorios recibidos. RLS responde «¿puedes verlo?», la consulta debe responder «¿es tuyo en este contexto?» | Confiar solo en RLS (correcto en seguridad, incorrecto en semántica) |
| 45 | **`secondary-container` usa `#204e4a` como color de texto y no el `#3f6c68` de DESIGN.md** | El par propuesto se queda en 4.58:1 sobre el pastel `#bcece6` y no llega a AA para texto normal; la variante oscura del mismo tono da 7.23:1 | Mantener el valor del design system y perder el contraste AA del hero |

## 2026-07-22 — FEATURE-053 (agenda de disponibilidad)

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| 46 | **La disponibilidad se modela como patrón semanal recurrente (`availability_slots`) + excepciones por fecha (`availability_overrides`)**, no materializando cada día del año | Es el modelo estándar (Google Calendar/Calendly): pocos datos, y las utilidades masivas (cerrar rangos, festivos) salen baratas. El calendario y el RPC `appointment_free_slots` resuelven cada fecha combinando ambos | Día a día puro (365 filas/año/protectora, duplica el patrón a mano); híbrido con materialización perezosa (complejidad innecesaria a esta escala) |
| 47 | **La "capacidad" del wireframe es un contador informativo, no reservas simultáneas**: se mantiene 1 cita por hueco (exclusion constraint de `appointments`) | El aforo real de un refugio para visitas de adopción es 1:1; permitir N simultáneas exigiría rehacer el constraint anti-solape y el RPC sin demanda real | Capacidad N por franja (más constraint y RPC, sin caso de uso) |
| 48 | **El CRUD de excepciones va directo por supabase-js amparado por RLS, sin Route Handler** (incluido "repetir semanalmente", que hace delete+insert+delete secuenciales) | Mismo patrón que el CRUD de franjas y ofertas de donación; a esta escala el riesgo de fallo parcial es bajo y se autocorrige al reguardar. Los batch transaccionales (rangos, festivos) se difieren a FEATURE-054 | Endpoint transaccional desde F1 (superficie de API antes de necesitarla) |

## 2026-07-22 — FEATURE-054 (utilidades masivas de la agenda)

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| 49 | **Los batch de la agenda (cerrar rango, pintar N días) son un único `upsert` de un array por supabase-js, sin Route Handler** (resuelve lo que #48 dejaba abierto) | Un `upsert([...])` es una sola sentencia SQL: atómica (si una fila falla el `with check` de RLS, cae entera) y bajo la misma política de la dueña, sin superficie de API nueva. Un test de RLS comprueba que un array con una fila ajena se rechaza entero | Endpoint transaccional dedicado (superficie sin necesidad); N upserts en bucle (no atómico, N roundtrips) |

## 2026-07-23 — Historias felices Nivel 2

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| 50 | **Los testimonios del adoptante (`adoption_stories`) los modera la PROTECTORA DUEÑA, no el admin** | La protectora conoce a la familia y el caso; reparte la carga de moderación y da cercanía. RLS: `update` solo del `shelter_id` propio; el adoptante no puede autoaprobarse (`with check status='pending'`). Foto/texto son datos personales → `consent` obligatorio (check en BD) | Moderación centralizada por admin (cuello de botella, menos contexto); publicación directa sin revisar (riesgo reputacional/RGPD) |

## Cómo añadir una decisión

Nueva fila con fecha en sección nueva si cambia el mes. Si revierte una anterior, enlázala ("revierte #9") en vez de borrarla.
