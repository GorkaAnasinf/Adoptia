# Changelog — Adoptia

Formato: [Keep a Changelog](https://keepachangelog.com/es/) adaptado. Versionado 0.x hasta el MVP.

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
