# Changelog — Adoptia

Formato: [Keep a Changelog](https://keepachangelog.com/es/) adaptado. Versionado 0.x hasta el MVP.

## [0.0.30] — 2026-07-11

### Añadido

- **FEATURE-013 — Apadrinamiento y donaciones**: los animales difíciles de adoptar pueden marcarse como **apadrinables** (con su historia y un enlace de pago externo) y las protectoras pueden añadir un **enlace de donaciones** a su perfil. Solo se admiten plataformas conocidas —Stripe Payment Links, Teaming y PayPal, siempre https— validadas tanto en el formulario como en la propia base de datos. Antes de salir al pago, un **aviso claro** explica que el dinero va directo a la protectora: Adoptia no procesa ni recibe pagos. Los apadrinables aparecen destacados en el perfil de su protectora, y cada clic en "Apadrinar" queda contado (sin datos personales) como métrica para la protectora.

## [0.0.29] — 2026-07-11

### Añadido

- **FEATURE-012 — Animales perdidos y encontrados**: nueva sección pública `/perdidos-encontrados` (enlazada en el menú) donde cualquier persona con cuenta publica en una sola pantalla un aviso de animal **perdido o encontrado** con foto, especie, descripción y un pin en el mapa. Los avisos se ven sobre el mapa con **distinción clara** (rojo = perdido, verde = encontrado) y filtro, y en un listado con ficha de detalle. **La ubicación exacta nunca se guarda**: la base de datos la redondea a ~200 m antes de almacenarla. El autor marca su aviso como **resuelto** con una mini-historia opcional que queda visible (los resueltos desaparecen del mapa), y los avisos sin actividad en 60 días se archivan solos.

## [0.0.28] — 2026-07-11

### Añadido

- **FEATURE-011 — Moderación de contenido y cuentas (admin)**: cualquier usuario con cuenta puede **reportar una ficha** desde un botón discreto (categoría + detalles; máximo 5 reportes al día, garantizado en base de datos). El equipo admin revisa la **cola de reportes** en `/admin/reportes` y puede **despublicar fichas con motivo** (la protectora recibe email con la vía de contacto y ve el aviso en su panel; reversible con "republicar") y **suspender cuentas** de forma reversible (protectoras ya desde la verificación; adoptantes bloqueando su acceso). Toda acción de administración queda en un **log de auditoría inmutable** —ni siquiera la clave de servicio puede alterarlo— consultable en `/admin/auditoria`.

## [0.0.27] — 2026-07-11

### Añadido

- **FEATURE-010 — Área personal del adoptante: favoritos y alertas**: el adoptante puede **guardar favoritos** con el corazón de la ficha y verlos en `/mi-cuenta/favoritos` (con marca "¡Adoptado!" y un único email de aviso cuando un favorito encuentra hogar), y **crear alertas** desde el listado sin resultados con los filtros activos: cada día un email agrupa los animales nuevos que encajan (máximo uno al día por alerta, tope de 5 alertas por usuario garantizado en base de datos) con **baja en un clic** desde el propio email, sin iniciar sesión. Estrena también `/mi-cuenta/citas` y el menú del área personal queda completo (solicitudes, favoritos, citas, alertas).

### Corregido

- Error de tipos en el E2E de citas que rompía el `typecheck` estricto (colado en 0.0.26).

## [0.0.26] — 2026-07-11

### Añadido

- **FEATURE-009 — Citas con calendario y agenda de disponibilidad**: la protectora define en `/panel/agenda` sus **franjas semanales de visitas** (día, horas y duración de cada visita, pausables), y el adoptante con **solicitud aprobada** reserva un hueco desde "Mis solicitudes" en una pantalla de tira de días y horas (solo huecos futuros y libres, hora peninsular). La doble reserva es imposible incluso con dos personas a la vez (bloqueo en base de datos). Ambas partes reciben **email de confirmación**, pueden **cancelar con motivo** (la otra parte recibe el aviso) y reciben un **recordatorio 24 h antes** (cron horario idempotente). La protectora gestiona su agenda en `/panel/citas` —próximas citas con "Realizada"/"No se presentó"/"Cancelar" e historial— y el dashboard estrena la tarjeta "Próximas citas" pendiente desde FEATURE-004. Cubierto con tests de RLS/concurrencia, de API, del cron y un E2E completo del flujo.

## [0.0.25] — 2026-07-11

### Cambiado

- **IMPROVEMENT-012 — Deuda de cobertura saldada**: el umbral de cobertura de funciones vuelve al 70% (estaba rebajado temporalmente al 66%), con tests nuevos para la subida de fotos de instalaciones (incluido el rollback que evita ficheros huérfanos), el contacto del adoptante y el botón de retirar solicitud. Lighthouse móvil en producción: home 96 y listado 94 de rendimiento, SEO y accesibilidad 100 en ambas; la ficha se medirá cuando haya animales publicados reales.

## [0.0.24] — 2026-07-10

### Añadido

- **IMPROVEMENT-013 — "Mis solicitudes" del adoptante**: nueva página `/mi-cuenta/solicitudes` donde el adoptante sigue sus solicitudes de adopción (animal con foto y enlace a la ficha, protectora, fecha y estado) y puede **retirar** las que sigan pendientes (con confirmación; la protectora deja de verlas como activas). El aviso de "ya enviaste una solicitud para este animal" lleva ahora a esta vista, y "Mi cuenta" la enlaza.

## [0.0.23] — 2026-07-10

### Corregido

- **IMPROVEMENT-001 — Slug de protectora de-duplicado**: dos protectoras pueden llamarse igual sin que el alta falle: la base de datos añade un sufijo (`refugio-esperanza-2`, `-3`…) de forma atómica y resistente a altas simultáneas, y el slug de una protectora ya publicada no cambia al editar su perfil. Si aun así hubiera un choque, el wizard lo explica hablando del nombre (antes culpaba, engañosamente, al CIF/email). Además, los usuarios del seed de demo ya no rompen la API de administración de usuarios del stack local.

## [0.0.22] — 2026-07-10

### Añadido

- **FEATURE-008 — SEO, datos de demo y pulido del MVP**: las fichas son ya **indexables y compartibles**: al compartir por WhatsApp se ve una imagen generada con la foto del animal, su nombre, "En adopción" y la protectora (`/api/og/[slug]`), y cada ficha lleva metadatos OpenGraph, URL canónica y datos estructurados JSON-LD. Nuevos `sitemap.xml` (solo contenido publicado de protectoras verificadas; borradores fuera) y `robots.txt` (bloquea panel, admin, cuenta, API y auth). Páginas de **error amables** (404/500) con navegación de escape, y **textos legales reales** publicados y enlazados en el footer: privacidad (RGPD, sin decisiones automatizadas), aviso legal (Adoptia intermedia; la adopción la formaliza la protectora), cookies (solo técnicas, sin banner) y términos. La home muestra **contadores reales** (animales publicados, protectoras verificadas y adopciones). Nuevo **seed de demostración** (`supabase db reset`): 4 protectoras verificadas (Bilbao, Madrid, Valencia, Sevilla), 23 animales con fotos y solicitudes de ejemplo; contraseña única de demo documentada en el propio seed. Lighthouse móvil local: SEO 100 y A11y ≥98 en home/listado/ficha; la performance de la ficha se re-medirá en producción (ver IMPROVEMENT-012).

## [0.0.21] — 2026-07-10

### Añadido

- **FEATURE-007 — Solicitud "Me interesa": cuestionario y bandeja**: el adoptante interesado en un animal rellena ahora un cuestionario de pre-adopción en 4 pasos (vivienda, hogar, experiencia y motivación) desde `/mi-cuenta/solicitudes/nueva/[slug]` —progreso conservado al retroceder, avisa si ya envió una solicitud para ese animal o si dejó de estar disponible mientras la rellenaba— y la protectora la recibe por email y la gestiona en su nueva bandeja `/panel/solicitudes`: lista agrupada por animal, detalle con el cuestionario en formato pregunta/respuesta, notas internas privadas, y acciones para aprobar (reserva el animal), rechazar (con motivo, el adoptante recibe email respetuoso) o marcar como adoptado (cierra el resto de solicitudes pendientes con un email que sugiere animales similares disponibles). Las notas internas de la protectora quedan protegidas con RLS a nivel de columna: el adoptante no puede leerlas ni escribirlas aunque conozca el id de su propia solicitud.

## [0.0.20] — 2026-07-10

### Añadido

- **FEATURE-006 — Mapa de protectoras con búsqueda por proximidad**: nueva pantalla `/mapa` con todas las protectoras verificadas en un mapa a pantalla completa (marcadores agrupados en clusters), lista lateral en escritorio y bottom sheet deslizable en móvil (tap o arrastre para colapsar/expandir), sincronizados por clic y por hover. El visitante comparte su ubicación o busca por ciudad/CP (nuevo `/api/geocode` público con caché y límite de peticiones) y ve las protectoras ordenadas por cercanía, con distancia, nº de animales publicados y acceso directo a cada ficha; chips de filtro por perros/gatos/acogida/voluntariado se aplican a la vez al mapa y a la lista. Zona sin protectoras muestra un estado vacío con invitación a unirse.

## [0.0.19] — 2026-07-10

### Añadido

- **FEATURE-005 — Área pública: home, búsqueda y fichas**: cualquier visitante, sin cuenta, puede ya **buscar animales** en `/animales` con filtros combinables (especie, tamaño, sexo, edad, convivencia con niños/perros/gatos y distancia) que quedan reflejados en la URL —compartible y con "atrás" que conserva la búsqueda—, ordenar por recientes o por cercanía usando su ubicación, y navegar con paginación. Cada animal tiene su **ficha pública** `/animales/[slug]` con galería de fotos accesible, datos de convivencia y salud, su historia, la tarjeta de la protectora con mini-mapa y botones de **"Me interesa"** (pide iniciar sesión solo al pulsarlo) y **compartir por WhatsApp**; un animal despublicado o inexistente muestra una página amable con sugerencias en vez de un 404. La **home** estrena buscador rápido por especie, "recién llegados", "cómo funciona" y llamada a protectoras. Todo servido con lectura pública segura (RPC `animals_search` bajo RLS: solo publicados de protectoras verificadas).

## [0.0.18] — 2026-07-09

### Añadido

- **FEATURE-004 — Panel de protectora: dashboard y perfil público**: al entrar al panel la protectora ve ahora un resumen —cuatro indicadores (animales publicados, borradores, solicitudes pendientes y adoptados del año), sus animales recientes y las solicitudes pendientes—, con acceso directo a "Añadir animal"; una protectora nueva ve una guía de primeros pasos en vez de ceros. Estrena su **perfil público** en `/protectoras/[slug]` (nombre, logo, ubicación, descripción, horario de visitas, redes, opciones de colaboración, fotos de instalaciones y animales en adopción) y un **editor de perfil** en el panel con **vista previa** que usa exactamente el mismo componente que ven los visitantes. Las fotos de instalaciones se suben al nuevo bucket `shelter-media` (compresión en cliente, subida sin dejar huérfanas). *"Próximas citas" llegará con FEATURE-009.*

## [0.0.17] — 2026-07-09

### Corregido

- **IMPROVEMENT-011 — Combo de provincia y autocompletado**: el desplegable de provincias vuelve a aparecer (se sustituye el `datalist` nativo, poco fiable, por un combo propio que filtra al escribir). Los campos de ciudad y dirección dejan de buscar solos: antes se disparaban al escribir en provincia o al cargar el borrador y "no paraban de sugerir" la dirección guardada; ahora solo buscan cuando escribes en esa misma caja.

### Cambiado

- **IMPROVEMENT-011 — Título en la columna lateral**: el encabezado del alta ("Edita los datos…" y su subtítulo) se mueve de la parte superior a un recuadro con color propio en la columna derecha (junto a "Consejo"), visible en todas las pestañas, para ganar espacio vertical arriba.

## [0.0.16] — 2026-07-09

### Corregido

- **IMPROVEMENT-010 — Provincia y municipios en el alta**: al elegir una calle sugerida ya no se sobrescribe la provincia que elegiste con la comarca (antes salía, p. ej., "Iruñerria" en lugar de "Navarra", y el desplegable de provincias se quedaba vacío). La provincia autocompletada solo se acepta si es una de las 52 oficiales, y los nombres de municipio bilingües de OpenStreetMap ("Valle de Egüés / Eguesibar") se muestran ya limpios. Además, "Localizar en el mapa" y la ayuda para arrastrar el pin comparten fila.

## [0.0.15] — 2026-07-09

### Corregido

- **IMPROVEMENT-009 — Autocompletado de ciudad y dirección**: volvían vacíos porque el proveedor de direcciones (Photon) no admite el idioma español como parámetro y rechazaba la petición; ahora se omite y las sugerencias de municipio y calle vuelven a aparecer al escribir.

### Cambiado

- **IMPROVEMENT-009 — Pulido del wizard de alta**: en el paso de ubicación los campos se colocan de dos en dos (provincia/ciudad y código postal/dirección). En el paso de perfil, el horario de apertura pasa de siete tarjetas grandes a una tabla compacta —una fila por día con "Cerrado" y franjas en pastillas—, y las opciones de voluntariado y acogida se muestran como dos tarjetas seleccionables.

## [0.0.14] — 2026-07-08

### Corregido

- **IMPROVEMENT-008 — Paso de ubicación del wizard**: el pin del mapa vuelve a mostrarse al reabrir el alta (Supabase devuelve la geografía como EWKB y ahora se decodifica bien; antes el mapa saltaba al centro de España). El mapa deja de pintarse por encima de su tarjeta y de la barra Atrás/Siguiente. Los números del stepper navegan (en edición, a cualquier paso).

### Cambiado

- **IMPROVEMENT-008 — Ubicación de más a menos**: el paso reordena los campos a Provincia → Ciudad → Código postal → Dirección. La provincia es un combo escribible con las 52 provincias y la ciudad autocompleta municipios (OpenStreetMap) filtrados por la provincia elegida; la dirección se sugiere con el contexto de ciudad y provincia para acertar más. Vuelve el botón "Localizar en el mapa" para geocodificar los campos y colocar el pin.

## [0.0.13] — 2026-07-08

### Cambiado

- **IMPROVEMENT-007 — Pulido del wizard de alta**: el paso de ubicación estrena **autocompletado de direcciones** (Photon/OpenStreetMap) — al escribir una calle real aparecen sugerencias y, al elegir una, se rellenan dirección, ciudad, provincia y código postal y se coloca el pin (que sigue siendo arrastrable para el ajuste fino). Desaparece el botón "Localizar en el mapa" que ocupaba mucho y no acertaba con calles concretas. La barra de acciones (Atrás/Siguiente + "Guardado automático") pasa a ser fija dentro del flujo, así que ya no tapa el mapa ni el pie de la aplicación (términos y privacidad). Los números del stepper son clicables para volver a un paso ya visitado.

## [0.0.12] — 2026-07-07

### Añadido

- **FEATURE-003 — Gestión de animales con fotos y vídeo**: la protectora ya da de alta y mantiene fichas de sus animales desde el panel. Listado de gestión (tabla en escritorio, tarjetas en móvil) con filtros por estado, portada y marca de borrador/publicado. Formulario por secciones (datos, carácter con toggles Sí/No/No sabemos, salud, historia, fotos y vídeo) que permite guardar borrador con solo el nombre y publicar exigiendo los mínimos (especie, sexo, tamaño, descripción y ≥1 foto). Subida de varias fotos con compresión en cliente (≤300 KB), portada marcable, reordenación y borrado (que elimina también el fichero de Storage); enlace de YouTube validado y renderizado como embed sin cookies. Cambios de estado con transiciones válidas y confirmación al marcar "adoptado", y opción de duplicar una ficha. Solo las protectoras verificadas pueden publicar; el resto prepara borradores. A nivel de datos: bucket de Storage `animal-media` con políticas por carpeta de protectora, portada única por animal y `species` opcional para permitir borradores.

## [0.0.11] — 2026-07-07

### Añadido

- **IMPROVEMENT-005 — Editar el alta en revisión**: una protectora cuyo alta está "En revisión" ya puede corregir sus datos. Desde el banner del panel, el enlace "Editar datos" reabre el asistente con todo relleno para modificar y guardar los cambios, sin salir del estado en revisión ni poder auto-verificarse. Las protectoras ya verificadas mantienen el alta como un trámite de un solo uso.

## [0.0.10] — 2026-07-07

### Cambiado

- **IMPROVEMENT-004 — Pulido del chrome (2ª iteración) + Mi cuenta**: el sidebar deja el blanco y adopta un tono arena que combina con el fondo; la cabecera retira los botones de ayuda y notificaciones (que no tenían función) hasta que existan; el menú de usuario muestra el nombre real sobre el email; se añade un enlace "saltar al contenido" para accesibilidad; y `/mi-cuenta` estrena un estado vacío cuidado con llamada a "Explorar animales" en vez del texto suelto.

## [0.0.9] — 2026-07-07

### Cambiado

- **IMPROVEMENT-003 — Pulido del chrome del panel**: el sidebar y la cabecera se acercan al mockup — ítems de navegación con badge de conteo, el ítem activo se resalta con un pill salvia, "Contactar soporte" pasa a un botón teal que abre el correo de soporte, el panel lateral gana contraste, los iconos de ayuda/notificaciones dejan de verse apagados (la campana muestra un punto cuando hay novedades) y el avatar carga la foto de perfil real (con iniciales de reserva). Sin cambios de datos: los conteos y notificaciones son el mecanismo listo para las siguientes features.

## [0.0.8] — 2026-07-07

### Añadido

- **FEATURE-018 — App shell autenticado**: toda la zona logueada (protectora, admin, adoptante) comparte ahora una cabecera común con migas de pan, badge de estado (Verificada / En revisión / Suspendida), menú de usuario con avatar, y una navegación lateral por rol que colapsa a un cajón accesible en móvil. Durante el onboarding, los accesos del panel aparecen deshabilitados hasta completar el alta.
- **IMPROVEMENT-002 — Rediseño del wizard de alta**: el asistente de alta de protectora estrena diseño dentro del shell — stepper con estados, tarjeta por paso, columna de "Consejo" y "Resumen" (entidad, CIF, datos fiscales) y barra de acciones fija con guardado automático. La lógica (validación, borrador, geocoding, logo, horarios) se mantiene intacta.

## [0.0.7] — 2026-07-06

### Corregido

- **BUG-003 — Mapa del alta en gris**: la CSP (`img-src`) bloqueaba las tiles de OpenStreetMap; ahora se permite `*.tile.openstreetmap.org` y los iconos de marcador se sirven desde el propio dominio (`/leaflet/`, sin CDN). El mapa del paso de ubicación ya renderiza.
- **BUG-001 / BUG-002 — Onboarding tras confirmar el correo**: al verificar el email, la protectora ve una pantalla "¡Correo verificado!" (split con imagen) y continúa al panel, que la lleva al wizard. El callback ahora tolera el flujo por `token_hash` (`verifyOtp`), válido entre dispositivos.

## [0.0.6] — 2026-07-06

### Añadido

- **FEATURE-002 — Onboarding de protectoras y verificación por admin**: una protectora recién registrada entra a un asistente de 3 pasos (datos de entidad con CIF, ubicación geocodificada sobre mapa Leaflet con pin arrastrable, y perfil público con logo comprimido, descripción y horarios por día) y queda pendiente de verificación; el borrador se guarda paso a paso y se recupera si abandona. Un admin revisa la cola en `/admin/protectoras` y verifica o rechaza (motivo obligatorio), enviando email en español al gestor. Solo las protectoras verificadas son públicas.

### Seguridad

- **Cerrado un hueco de escalada de privilegios**: la política de actualización de `shelters` permitía al dueño cambiar su propio `status` (auto-verificarse). Un trigger `BEFORE UPDATE` ahora impide cambiar `status`/`verification_note` salvo a un admin (con test de RLS permitido/denegado).
- Bucket de Storage `logos` con políticas por dueño (solo escribe en su carpeta `{shelter_id}/`, verificado con tests de RLS reales); CIF y email de entidad únicos.

### Cambiado

- Email transaccional propio de la app por **SMTP de Gmail + plantillas HTML** (Decisión #22, en vez de Resend) — estrena `src/lib/email/`.
- El "gate" de onboarding vive en el middleware: una protectora sin alta enviada queda confinada al wizard hasta completarlo.

### Configuración de producción (pendiente al desplegar)

- Aplicar la migración `20260706100000_feature002_onboarding.sql` a la Supabase cloud y configurar las variables `SMTP_HOST/PORT/USER/PASS` y `MAIL_FROM` en Vercel (ver RB-08).

## [0.0.5] — 2026-07-05

### Añadido

- **CAPTCHA Cloudflare Turnstile** en login, registro y recuperación de contraseña (integración con Supabase; verificado en producción).
- Plantillas de correo HTML propias con el design system (confirmación, invitación, magic link, cambio de correo, reset y reautenticación) en `assets/emails/templates/`, enviadas vía SMTP de Gmail.

### Cambiado

- Rediseño de login y registro: layout partido con imagen, pantallas consistentes entre sí, sin fondos blancos, inputs del mismo tamaño y sin scroll.
- Política de contraseña elevada a mayúscula + minúscula + dígito + símbolo, alineada cliente y servidor (Supabase).
- `cursor-pointer` en botones e interactivos (Tailwind v4 los dejaba en `default`).

### Configuración de producción

- Google OAuth activo, Site/Redirect URLs, rate limits (30/h) y política de contraseñas configurados en Supabase.

## [0.0.4] — 2026-07-05

### Seguridad

- **Escalada de privilegios corregida**: el trigger de alta de usuarios aceptaba cualquier rol de la metadata del signup — un atacante podía crearse como admin llamando a la API directamente. Ahora solo admite adopter/shelter (migración `20260705190000`, aplicada en local y producción, con test de regresión).
- **Open redirect corregido** en el login (`?redirect=` solo acepta rutas internas).
- Política de contraseña reforzada en registro y reset: mínimo 8 caracteres con letras y números.

### Añadido / cambiado

- Pantallas de auth con imágenes reales en el panel lateral (login y registro con imagen propia).
- Email ya registrado: mensaje neutro que guía a iniciar sesión o recuperar contraseña sin revelar si la cuenta existe (anti-enumeración).
- Mensajes de validación específicos por campo (correo inválido, contraseña débil, nombre vacío) — mejor accesibilidad.
- Página dedicada `/confirma-correo` tras el registro con confirmación pendiente.
- Botones con altura mínima táctil de 44 px.

## [0.0.3] — 2026-07-05

### Añadido

- **FEATURE-001 — Registro y login**: cualquier persona puede crear cuenta como adoptante o protectora (selector visual según wireframe), con indicador de fuerza de contraseña, consentimiento RGPD obligatorio con páginas legales, recuperación de contraseña por email, botón "Continuar con Google" (callback PKCE con protección de open redirect) y cierre de sesión desde el header. Flujo completo verificado con E2E reales contra Supabase local. *Pendiente manual: activar proveedor Google y plantillas de email en español en el dashboard de Supabase.*

## [0.0.2] — 2026-07-05

### Añadido

- **FEATURE-000 — Inicialización y andamiaje**: la aplicación existe y funciona en local — Next.js 15 con design system propio (terracota/teal, Montserrat/Open Sans), home conectada a Supabase con contador de animales, registro/login de adoptantes, rutas de panel protegidas por rol, base de datos fase 1 migrada con RLS verificada por tests (10 casos permitido/denegado), i18n en español sin textos hardcodeados (test automático), suite Vitest+Playwright con cobertura 94 % y endpoint keepalive para el plan free de Supabase.
- **FEATURE-017 — Despliegue inicial**: la plataforma está en producción en <https://adoptia-eight.vercel.app> — proyecto Supabase cloud (eu-west-1) con la migración baseline aplicada y PostGIS activo, Vercel con previews automáticas desde `develop`, CI de GitHub Actions en verde con secrets configurados y keepalive del plan free funcionando dos veces por semana.

## [0.0.1] — 2026-07-04

### Añadido

- Inicialización completa del proyecto (esta base documental y de infraestructura):
  - **Documentación** por áreas en `docs/`: producto (PRODUCT_CONTEXT, PLAN, GLOSSARY), técnico (ARCHITECTURE, DATA_MODEL, API_CONTRACTS, DESIGN, DECISIONS + biblia técnica y prompts Stitch), planificación (BACKLOG, ROADMAP, CHATGPT_GATEWAY, items/), operación (SETUP, ENVIRONMENT, OPERATIONS, RUNBOOKS, SECURITY), meta (TESTING, PRIVACY, DOCUMENTATION).
  - **Sistema de items**: 17 items reales (FEATURE-000…016) en `docs/planning/items/` con plantilla `_TEMPLATE.md`; vistas renderizadas con `scripts/render_planning.py`.
  - **Infraestructura**: CI GitHub Actions (lint+typecheck+test+build, render check, docs), keepalive Supabase, pre-commit + detect-secrets, Makefile, MkDocs Material, plantillas de issues y commits.
  - **Manada SDD**: 6 agentes (Balto, Lassie, Snoopy, Bolt, Scooby, Hachiko) + skills de stack (frontend, backend, database, security, testing) en `.claude/commands/`.
  - Ficheros raíz: README, CLAUDE.md, AGENTS.md, CONTRIBUTING, SECURITY.
