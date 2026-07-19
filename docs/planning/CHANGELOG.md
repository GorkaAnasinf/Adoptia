# Changelog — Adoptia

Formato: [Keep a Changelog](https://keepachangelog.com/es/) adaptado. Versionado 0.x hasta el MVP.

## [0.0.75] — 2026-07-19

### Cambiado

- **Perdidos y encontrados estrena el diseño nuevo (FEATURE-038)**: quinta pantalla de la tanda Stitch. Hero con título terracota y botón granate «Publicar aviso» con icono, chips tonales (activo granate), y la nota de privacidad ahora vive **dentro del mapa** como en el wireframe. Las tarjetas pasan a foto cuadrada con **badge granate «Perdido» / teal «Encontrado»** — los marcadores del mapa adoptan los mismos colores para contar la misma historia — y **toda la tarjeta es clicable** (adiós al botón «Ver detalles»). La fecha muestra el día del suceso en absoluto: «Perdido el 13 de julio». Detalle invisible pero importante: al filtrar, un contador «N avisos» avisa a los lectores de pantalla de que la lista cambió. Los filtros avanzados, los estados vacíos y la mecánica del mapa no se tocan. QA: suite 1138/1138 con RLS, E2E 11/11.

## [0.0.74] — 2026-07-19

### Cambiado

- **El mapa de protectoras se viste con el diseño nuevo (IMPROVEMENT-028)**: cuarta pantalla de la tanda, esta sin wireframe — orden puro con el lenguaje ya asentado. El panel de filtros pasa a la superficie crema con los chips de la tanda (activo granate), «Usar mi ubicación» y el buscador de ciudad adoptan el patrón del resto de la web, y las tarjetas de la lista estrenan nombre en terracota, distancia con icono y chip de animales. La estrella: el **popup del mapa** deja de ser texto plano — ahora muestra nombre, ciudad **con distancia**, animales y un botón granate «Ver protectora», en un globo redondeado con la sombra de la marca. La mecánica del mapa (filtros, clusters, hoja inferior móvil) no se toca. QA: suite 1133/1133 con RLS, E2E del mapa verde.

## [0.0.73] — 2026-07-19

### Cambiado

- **El directorio de protectoras se pone a la altura (FEATURE-037)**: tercera pantalla de la tanda Stitch, y la de mayor salto — la vista era una lista plana. Ahora: cabecera centrada «Nuestras protectoras colaboradoras», **buscador** por nombre, ciudad o provincia, botón teal «Ver mapa», chips **Todas / Con animales en adopción**, y tarjetas ricas con **foto de cabecera** (la que cada protectora sube a su perfil), badge **«Verificada»**, logo solapado, contadores reales de **ANIMALES y ADOPCIONES** en granate y CTA «Ver perfil →». Paginación de 12 en 12 con «Página X de N». Si tu búsqueda no encuentra nada, un estado propio te deja limpiarla en un clic. Todo accesible (labels, `aria-pressed`, flechas etiquetadas) y sin migraciones — las adopciones se cuentan en la misma consulta pública. QA: suite 1128/1128 con RLS, E2E 4/4.

## [0.0.72] — 2026-07-18

### Cambiado

- **El listado de animales se alinea con el diseño nuevo (FEATURE-036)**: segunda pantalla de la tanda Stitch. El panel de filtros pasa a la **superficie crema tonal** de la home (adiós a los bordes duros), el título estrena el copy del wireframe — **«Peludos buscando un hogar»** — con el recuento en su propia línea en terracota («130 resultados encontrados»), la paginación gana **flechas anterior/siguiente** accesibles y las tarjetas se revelan al hacer scroll como en la home. Detalles que el mock no traía: en móvil el desplegable dice **«Filtros (N)»** con el número de filtros activos, y el slider de distancia deshabilitado explica que hay que activar la ubicación. Remate con feedback del usuario el mismo día: el panel de filtros **ya no desborda** (grid responsive), «Aplicar filtros» pasa a **granate**, páginas de **12 animales**, y las tarjetas estrenan **carrusel de fotos** — flechas para ver las demás fotos del animal sin entrar en la ficha (se cargan solo al pulsar; con una foto no hay flechas). Sin cambios de datos ni de búsqueda. QA: suite 1125/1125 con RLS, E2E 4/4.

## [0.0.71] — 2026-07-18

### Añadido

- **La home cobra vida (IMPROVEMENT-027)**: los contadores reales de la banda teal ahora **suben desde cero** al entrar en pantalla, las secciones y tarjetas **se revelan** con un fundido sutil al hacer scroll, la cabecera **se compacta** con sombra al bajar, el fondo del hero se mueve con un **parallax** suave en desktop y unas **huellas tenues** cruzan la página entre secciones — como si un animal acabara de pasar. Además se estrena la sección **«Historias felices»** con tres adopciones de demostración (datos inventados: FEATURE-035 las sustituirá por reales) y se corrige un bug global: **el cursor vuelve a ser una mano** sobre todos los botones (Tailwind v4 lo había quitado de su preflight). Todo el movimiento respeta `prefers-reduced-motion` y los lectores de pantalla reciben siempre el contenido final. QA: suite 1112/1112 con RLS, E2E 4/4.

## [0.0.70] — 2026-07-18

### Cambiado

- **La home estrena el diseño nuevo de la web (FEATURE-034)**: primera pantalla de la **tanda de rediseño con wireframes de Stitch**. El hero recibe una foto ambiente cálida con degradado al crema y el buscador se afina (iconos huella/ubicación en terracota, esquinas del design system); las tarjetas de animales llevan el chip **«Recién llegado» sobre la foto** y se elevan al pasar el ratón; «¿Cómo funciona?» unifica sus tres pasos sobre fondo tintado; la cabecera pasa a **glassmorphism** con el enlace activo subrayado y el pie muestra marca + tagline manteniendo todos sus enlaces. Accesibilidad reforzada a petición del usuario: labels en los dos campos del buscador, foto del hero invisible para lectores de pantalla, foco visible en todo lo nuevo y animaciones que respetan `prefers-reduced-motion`. Sin cambios de datos ni API — misma búsqueda, mismos contadores reales. QA: suite 1101/1101 con RLS, E2E del área pública 4/4.

## [0.0.69] — 2026-07-18

### Añadido

- **Los particulares donan el material que ya no usan (FEATURE-032)**: a quien se le muere su animal (o le sobra material en buen estado) ya no tiene que tirarlo ni peregrinar por redes — publica una **oferta de donación** desde su cuenta (comida, accesorios, mantas y ropa, juguetes…) con su ciudad, un **pin redondeado ~200 m** (la dirección exacta nunca se guarda, mismo patrón que acogidas) y el radio en el que le viene bien entregar. Las **protectoras verificadas de la zona** ven las ofertas en su panel (tablón «Donaciones», ordenado por cercanía) y pulsan **«Contactar»**: el email va **al donante** con los datos de la protectora — nunca al revés. El donante gestiona lo suyo: editar, **marcar entregada**, borrar (borrado real) y **renovar** cuando caduca (a los 60 días, automático, para que el tablón no crie zombis; con tope de 5 abiertas contra el abuso). Complementa al tablón de necesidades: allí la protectora pide, aquí el particular ofrece. Migración `20260718110000` **aplicada en producción el 2026-07-18** (dry-run previo, confirmada con `migration list --linked`) y release `cee7448` desplegado y verificado en Vercel (READY).

## [0.0.68] — 2026-07-18

### Descartado

- **FEATURE-033 (alertas de búsqueda guardada) descartada como duplicado de FEATURE-010**: lo pedido ya está en producción desde el hito 0.3 — guardar la búsqueda con sus filtros desde el listado, email diario agrupado cuando entra un animal que encaja (cron de GitHub Actions a las 09:00 UTC), gestión en `/mi-cuenta/alertas` (pausar/activar/borrar, tope de 5 en BD), baja en un clic desde el email sin login y RLS probada. Verificación criterio a criterio documentada en el item, con los tests de la zona re-ejecutados en verde (10/10). Deltas menores anotados como candidatos a mejora: editar una alerta existente y casar el filtro de edad en el matching.

## [0.0.67] — 2026-07-18

### Añadido

- **Las protectoras piden ayuda material sin gritar en redes (FEATURE-031)**: estrenan **tablón de necesidades** — comida, mantas y ropa, medicinas, transporte… Desde su panel publican qué les falta (con marca de **urgente**), lo editan, lo marcan cubierto cuando llega (queda en su historial, reabrible) y se muestra en dos sitios: su **perfil público** (sección «Necesitamos») y el **tablón general** `/necesidades`, filtrable por categoría, urgencia y **ciudad** (urgentes primero, después cercanía). Cualquier persona con cuenta pulsa **«Puedo ayudar»** y su mensaje llega a la protectora por email — avisándole de que al responder verán su dirección. Solo publican protectoras verificadas. Migración `20260718100000` **aplicada en producción el 2026-07-18** (dry-run previo, confirmada) y release desplegado y verificado en Vercel.

## [0.0.66] — 2026-07-17

### Añadido

- **La casa de acogida puede pedir relevo sin dramas (FEATURE-030)**: si al acogedor le surge una emergencia (obras, inundación, hospitalización…), ya no tiene que resolverlo por WhatsApp ni abandonar la acogida sin rastro. En su pantalla de acogida, sobre la propuesta aceptada, pulsa **«Necesito relevo»**, cuenta el motivo y hasta cuándo puede seguir — la protectora recibe el aviso por email y ve un **chip de «Relevo pedido»** con el motivo en su panel, desde donde propone la acogida a otros acogedores de la zona con el flujo de siempre. El acogedor puede cancelar la petición si su situación se arregla. Y un detalle fino por debajo: mientras el relevo está en marcha conviven dos acogidas aceptadas del mismo animal — cerrar la primera ya no lo marca «En adopción» por error. Migración `20260717210000` **aplicada en producción el 2026-07-18** (dry-run previo, confirmada con `migration list --linked`) y release desplegado y verificado en Vercel.

## [0.0.65] — 2026-07-17

### Corregido

- **El animal acogido por fin dice que está «En acogida» (IMPROVEMENT-026)**: aceptar una propuesta de acogida no cambiaba el estado del animal — el panel decía «aceptada» pero el catálogo lo seguía ofreciendo «En adopción». Ahora la base de datos los mantiene sincronizados sola: propuesta aceptada → animal «En acogida»; acogida finalizada (o el acogedor se da de baja) → vuelve a «En adopción». Los reservados y adoptados no se tocan. Detectado por el usuario probando el flujo recién liberado. Remate el mismo día: **backfill** de las acogidas aceptadas antes del arreglo (seguían sin marcar) y el trigger cubre también propuestas que nacen ya aceptadas.

## [0.0.64] — 2026-07-17

### Añadido

- **Las propuestas de acogida dejan rastro y dicen algo (FEATURE-029)**: hasta ahora «Proponer acogida» disparaba un email genérico que no se guardaba en ningún sitio — al recargar, la protectora podía reenviar avisos infinitos y no había manera de saber qué animales dejó en acogida ni con quién. Ahora proponer abre un **formulario** (para qué animal —opcional—, cuánto tiempo y un mensaje), el email al acogedor llega con esos datos, y la propuesta queda **guardada con estado**: en el panel, el acogedor con propuesta abierta muestra «Propuesta enviada el X» en vez del botón (y la base de datos impide duplicarla aunque se intente por otra vía), y un **historial** permite marcarla aceptada, rechazada o finalizada — la trazabilidad que faltaba. El acogedor ve sus **propuestas recibidas** en su pantalla de acogida. Si el acogedor se da de baja, sus propuestas se borran con él (supresión real, decisión #40). Migración `20260717150000` **aplicada en producción el 2026-07-17** (dry-run previo, confirmada con `migration list --linked`) y release desplegado y verificado en Vercel.

## [0.0.63] — 2026-07-17

### Añadido

- **«Acogidas» aparece por fin en la navegación del usuario (IMPROVEMENT-025)**: hasta ahora ofrecerse como casa de acogida solo se descubría por un enlace del pie de página. Ahora el adoptante tiene la entrada «Acogidas» en su área personal (**Mi cuenta**) y en el menú del avatar, que lleva a una pantalla propia con todo lo que ya existía: darse de alta, ver si está disponible o en pausa, editar condiciones, pausarse o darse de baja. La página pública sigue igual para quien llegue sin cuenta. También se capturaron seis items nuevos del análisis de acogidas y ayuda material (FEATURE-029 a 033 e IMPROVEMENT-025).

## [0.0.62] — 2026-07-17

### Cambiado

- **Los huecos sin foto muestran una huella en vez de texto suelto (IMPROVEMENT-024)**: el avatar del perfil de protectora sin logo y las tarjetas de animales sin foto (en el perfil y en la búsqueda, que comparten tarjeta) enseñan ahora el icono de huella, como pedía el mockup. El «Sin foto» no desaparece: queda como etiqueta accesible para lectores de pantalla. Salió del QA de FEATURE-028.

## [0.0.61] — 2026-07-17

### Añadido

- **El perfil público de la protectora deja de ser una ficha plana y se convierte en un escaparate (FEATURE-028)**, a partir del mockup aportado: cabecera con **foto de portada** (la sube la protectora desde su editor; con degradado de marca si no hay), avatar redondo, badge de «Protectora verificada» y dos acciones directas — **Contactar** (abre el correo de la protectora) y **Donar** (el enlace externo de siempre, con su aviso). Debajo, una franja de **métricas que se ganan sola**s: adopciones conseguidas, animales en adopción y años de labor (con el nuevo campo «Año de fundación» del editor); cada cifra solo aparece si existe. «Sobre nosotros» y los servicios (voluntariado, acogida, web) conviven ahora a dos columnas con «Horario y ubicación», que estrena **mini-mapa** y dirección. Y la lista de animales pasa a las **tarjetas estándar de la búsqueda** (foto, raza, edad, corazón de favorito, «Adoptar») con **buscador por nombre y filtros de especie y edad** al instante, con contador. El recuento de adopciones sale de una función blindada en la base de datos que cuenta también los animales adoptados ya despublicados, sin exponer sus fichas. Migración `20260717090000` **aplicada en producción el 2026-07-17**, verificada antes en local (dry-run y `migration list --linked`); release desplegado y comprobado en real.

## [0.0.60] — 2026-07-16

### Cambiado

- **La sección de perdidos estrena diseño en sus tres pantallas (FEATURE-025, FEATURE-026, FEATURE-027)**, a partir de los mockups aportados: el **listado** pasa a tarjetas verticales con foto grande, badge sobre la imagen y «Ver detalles», con los filtros avanzados recogidos tras «Más filtros» y la lista de «Avisos recientes» desplegable con «Ver todos»; la **ficha** se reorganiza a dos columnas con las acciones siempre a la vista («He visto a este animal», **compartir el aviso** —novedad: comparte por el móvil o copia el enlace—, señas en tarjetitas, mapa, contacto y **consejos de seguridad** distintos para perdidos y encontrados) y migas de pan; y el **alta** se agrupa en tarjetas de sección con **subida de fotos arrastrando** y «Cancelar y volver». Solo cambia la presentación: mismos datos, filtros, validaciones y privacidad. Los tres rediseños se entregaron juntos con la suite completa pasada una única vez al final (decisión del usuario para acelerar la entrega).

## [0.0.59] — 2026-07-16

### Añadido

- **Los avisos de perdidos admiten varias fotos (FEATURE-024)**: hasta ahora cabía una sola, y con «perro marrón + una foto de espaldas» no lo reconoce nadie. Ahora se pueden subir varias al publicar —de frente, de perfil, la mancha del lomo—, elegir cuál es la principal y quitarlas antes de enviar; la ficha las muestra en una galería con miniaturas navegables. Con una sola foto se ve como antes, y sin fotos no deja hueco. Por dentro se copia el patrón de las fichas de animales (`lost_found_media`, con una sola portada garantizada por la base de datos), se migran las fotos que ya había y se retira la columna vieja. Migración `20260716120000` **aplicada en producción el 2026-07-16**, verificada antes en local y en CI. No hay edición de la galería una vez publicado el aviso: eso queda para más adelante.

## [0.0.58] — 2026-07-16

### Corregido

- **La suite E2E vuelve a funcionar y CI la ejecuta en cada push (BUG-008)**: de **8 tests verdes de 28 a 28**. No estaba rota la aplicación: estaban podridos los tests, porque nadie los ejecutaba (BUG-007) y la interfaz siguió cambiando sin ellos — «Salir» se mudó al menú de usuario, la home pasó de enlaces por especie a un buscador, el cuestionario se convirtió en wizard, la protectora empezó a aterrizar en su panel al entrar, y el mapa estrenó clustering. Ahora el job de E2E está **activo en cada push**, así que la próxima vez se ve al momento.
- **El mapa: seleccionar una protectora en la lista ya la muestra siempre (BUG-008)**: si su marcador estaba agrupado en un cluster —basta con que haya otra protectora cerca— pinchar en la lista no hacía absolutamente nada. Tampoco si el mapa aún no había terminado de cargar. Ambos casos los encontró la suite E2E al sanearla, que es justo para lo que existe.

## [0.0.57] — 2026-07-15

### Añadido

- **Los avisos de perdidos ya describen al animal, y dicen cuándo pasó (FEATURE-023)**: un aviso se publicaba con poco más que «perro marrón», y con eso no lo reconoce nadie por la calle. Ahora se pueden contar las **señas** —raza, color, sexo, tamaño, si lleva collar y cómo es, y si tiene microchip—, todas opcionales: el alta sigue cabiendo en menos de dos minutos desde el móvil y lo que no se sabe se queda en «no lo sé» (y no ocupa sitio en la ficha). Se añade también **la fecha real del suceso**: hasta hoy solo constaba cuándo se publicó el aviso, así que quien publicaba tres días tarde tenía un aviso que mentía; ahora el listado y la ficha muestran cuándo se perdió o se encontró, y enseñan la de publicación solo si difiere. Y el listado gana **filtros de especie, tamaño y fecha**, combinables con perdido/encontrado, que filtran el mapa y la lista a la vez. **El número de microchip no se pide ni se guarda** —identifica al dueño en el registro autonómico— y hay un test que vigila que no vuelva. Migración `20260715180000` **aplicada en producción el 2026-07-15**, verificada antes en local. La galería multi-foto queda para FEATURE-024.

## [0.0.56] — 2026-07-15

### Cambiado

- **Los E2E dejan de poder saltarse en silencio, y hay job de CI listo para ellos (IMPROVEMENT-022)**: como los tests de RLS antes de BUG-007, los E2E se saltaban solos cuando faltaba el stack — invisibles y verdes. Ahora el entorno vive en un módulo compartido (`e2e/entorno.ts`) que **aborta en CI** si faltan las variables, en vez de saltar. Se añade el job `e2e` (Playwright + Supabase local), de momento **solo lanzable a mano**: al ejecutar la suite entera por primera vez aparecieron 14 fallos de 26 — no está rota la app, están podridos los tests, y activarlo en cada push dejaría CI en rojo crónico. El saneado es **BUG-008**. De paso se corrige el rate limit del Auth del stack local (`sign_in_sign_ups`: 30 → 1000 en 5 min), que la suite en paralelo agotaba en segundos.

## [0.0.55] — 2026-07-15

### Cambiado

- **CI corre en la misma versión de Node que producción (IMPROVEMENT-023)**: había tres versiones distintas conviviendo —Vercel en 24.x, CI en 20 y el desarrollo en 22.19—, y precisamente la que decide si algo se despliega era la más alejada de producción. Con Node 20 los tests de RLS ni arrancaban (`supabase-js` necesita el WebSocket nativo de Node 22+), lo que había obligado a parchear ese job a 22. Ahora la versión vive en un único `.nvmrc` (24, la de Vercel) que ambos jobs leen con `node-version-file`, así que no pueden volver a separarse en silencio; `engines` documenta el suelo real (>=22). De paso desaparecen los avisos de deprecación de `supabase-js` en cada run.

## [0.0.54] — 2026-07-15

### Corregido

- **CI ejecuta por fin los tests de RLS (BUG-007)**: `ci.yml` no levantaba el stack de Supabase ni definía las variables `SUPABASE_TEST_*`, así que los **123 tests de RLS se saltaban en verde en cada push** desde que existen — un `skipIf` silencioso se ve igual que un test que pasa. Como "RLS es el pilar de seguridad" del proyecto, eso dejaba sin vigilar que un borrador no sea legible por `anon`, que una protectora no toque los animales de otra, o que la coordenada exacta nunca llegue a existir en BD. Ahora hay un job `rls` que levanta un Postgres real y los corre de verdad, y **el salto deja de ser silencioso**: con `CI=true` y sin variables, la suite falla en vez de saltarse. Comprobado abriendo una política a propósito: CI se pone en rojo. Este era el agujero por el que BUG-006 llegó a producción. El job va en Node 22 porque `supabase-js` necesita el WebSocket nativo: con el Node 20 del resto de CI, los tests ni arrancan (queda IMPROVEMENT-023 para alinear versiones).

## [0.0.53] — 2026-07-15

### Corregido

- **La tarjeta de un animal ya no intenta mostrar un vídeo como foto (BUG-006)**: un animal con vídeo de YouTube y sin foto marcada como portada mostraba una imagen rota en el listado, porque el RPC `animals_search` devolvía la URL del vídeo (`https://youtu.be/…`) como `cover_url`. FEATURE-020 filtraba explícitamente por fotos; IMPROVEMENT-021, al reescribir la función para añadir la búsqueda por texto, perdió ese filtro. Se restaura: sin foto, la tarjeta cae al placeholder. Migración `20260715160000` **aplicada en producción el 2026-07-15**, verificada antes en local. De paso se arregla el test que debía haberlo cazado y que nunca ejercitó el escenario: su `insert` masivo pasaba objetos con claves distintas, PostgREST lo rechazaba entero y el test no miraba el error.

## [0.0.52] — 2026-07-15

### Corregido

- **El informe de cobertura vuelve a generarse (BUG-005)**: `npm run test -- --coverage` —el comando que corre CI— terminaba en error desde hacía tiempo. `coverage.include` era `src/**`, así que el proveedor v8 intentaba parsear como JavaScript ficheros que no lo son (`globals.css`, las guías `.md` de `src/content/guias/`) al listar los no cubiertos, y rolldown abortaba el informe entero. Ahora se restringe a `src/**/*.{ts,tsx}`. Buena noticia de paso: no había deuda escondida — con el informe visible, los umbrales se cumplen sin tocar un solo test (80,85% de sentencias, `src/lib` al 96,6%).

## [0.0.51] — 2026-07-15

### Añadido

- **Contacto y avistamientos en los avisos de perdidos (FEATURE-022)**: hasta ahora publicar que habías perdido a tu animal era gritar a una pared — no había forma de que nadie te diera una pista. Ahora la ficha de un aviso abierto ofrece dos cosas a quien tenga cuenta: **escribir al autor** (el mensaje viaja por la plataforma; ninguna de las dos partes ve el correo de la otra, y quien escribe cede el suyo para que puedan responderle) y **"He visto a este animal"**, marcando dónde y cuándo, con nota y foto opcionales. Los avistamientos se pintan en el mapa de la ficha, se listan en un timeline y avisan al dueño por correo. El autor puede además publicar un **teléfono opcional** (con aviso de la estafa del rescate a la vista) o cerrar los mensajes del todo. El pin de un avistamiento pasa por **el mismo redondeo de ~200 m** que el del aviso: ni la ubicación de quien reporta ni la del animal se publican exactas. Una pista fresca cuenta como actividad, así que el aviso deja de archivarse a los 60 días mientras la gente lo alimente. Migración `20260715120000` **aplicada en producción el 2026-07-15**, sin verificación previa en local (Docker no disponible): los tests RLS y E2E que respaldan el redondeo del pin y las políticas de acceso siguen sin ejecutarse — ver la deuda de verificación en el item.

## [0.0.50] — 2026-07-14

### Añadido

- **Búsqueda por texto (nombre o raza) en el listado de animales (IMPROVEMENT-021)**: el buscador de la cabecera deja de ser un simple enlace y ahora filtra de verdad — envía a `/animales?q=…` y el RPC `animals_search` gana el parámetro `p_query` (`ilike` sobre `name` y `breed`). El listado suma un campo de texto en los filtros; el término viaja en la URL (compartible) y se combina con el resto de filtros. El texto del usuario se acota a 60 caracteres y se escapan los metacaracteres de LIKE. Se mantiene SECURITY INVOKER: la RLS sigue mandando (un borrador no aparece aunque el término coincida). **Requiere `supabase db push` en producción** (migración `20260714150000`).

## [0.0.49] — 2026-07-14

### Rediseñado

- **Cabecera pública (FEATURE-021, fase 2)**: la barra superior se rediseña con la identidad «Warm Earth & Tail» — marca con huella, enlaces de navegación con estado activo en terracota y un buscador tipo pill. Se añade una **fila de migas de pan** bajo la barra (oculta en la home) y un **menú móvil** en drawer (con gestión de foco y cierre con Escape). El buscador es de momento un enlace a la exploración de animales; la búsqueda por texto/raza real queda pendiente (IMPROVEMENT-021), porque `animals_search` aún no admite texto libre.

## [0.0.48] — 2026-07-14

### Añadido

- **Acceso al panel desde el menú del avatar (FEATURE-021, fase 1)**: el menú de usuario solo ofrecía «Mi cuenta» y «Cerrar sesión», así que una protectora no tenía forma visible de llegar a su panel de gestión. Ahora el menú se adapta al rol: una **protectora** ve «Panel de protectora» (→ `/panel`), un **adoptante** ve accesos directos a favoritos, solicitudes y citas, y un **admin** ve «Panel de administración». El rol se lee en servidor (`profiles.role`, solo el del propio usuario); la visibilidad del enlace es cosmética, el acceso real sigue protegido por el middleware. Queda pendiente la **fase 2** (rediseño visual del top bar público: buscador, breadcrumbs y menú móvil), a la espera de mockups.

## [0.0.47] — 2026-07-14

### Corregido

- **«Reservar cita» llevaba a un 404 (BUG-004)**: tras aprobar una solicitud el animal pasa a `reserved` y la protectora suele despublicarlo; la RLS `animals_public_read` (solo `published_at is not null`) dejaba de mostrárselo al adoptante, así que la página de reserva no encontraba el animal y hacía `notFound()`. Nueva policy RLS: el adoptante puede leer el animal (y su media) mientras tenga una solicitud viva (`pending|approved|completed`) sobre él, aunque esté despublicado — mediante la función `security definer` `adopter_has_request_for()` (evita la recursión `animals`↔`adoption_requests`). La lista de solicitudes vuelve a mostrar nombre y foto del animal. **Requiere `supabase db push` en producción.**

### Rediseñado

- **Vista de alta de adopción (cuestionario de pre-adopción)**: cabecera con avatar del animal, barra de progreso «Paso X de 4» y paso 1 con tarjetas de tipo de vivienda, selector de régimen y toggle para «¿permite mascotas tu casero?». Nuevo primitivo `Switch`.

## [0.0.46] — 2026-07-14

### Añadido

- **Validación del enlace de YouTube en el alta del animal (FEATURE-020)**: al añadir un vídeo, además de comprobar que el enlace tiene forma válida, se verifica contra YouTube (endpoint oEmbed, vía nuevo Route Handler `GET /api/youtube`) que el vídeo es **público y embebible**. Un vídeo privado, borrado o con la inserción desactivada se marca en el campo («Vídeo válido» / mensaje de error) y bloquea el guardado, evitando el «vídeo no disponible» en la ficha. Si YouTube no responde, no se bloquea (se deja pasar).

## [0.0.45] — 2026-07-14

### Corregido

- **CSP bloqueaba los vídeos de YouTube** en la ficha: la directiva `frame-src` no incluía el dominio del embed. Añadido `https://www.youtube-nocookie.com` a `frame-src` — ahora el reproductor carga.
- **El carrusel automático se llevaba el vídeo**: al seleccionar o reproducir un vídeo el auto-avance ya no salta a la siguiente imagen. El auto-avance (cada 5 s) se detiene en cuanto la persona interactúa con la galería (navegar por miniaturas o reproducir).

## [0.0.44] — 2026-07-14

### Corregido

- **Vídeo de YouTube en la ficha (FEATURE-020)**: la miniatura mostraba una caja gris con el icono ▶ sin frame, y al pulsar el vídeo el `iframe` podía quedarse en blanco. Ahora el carrusel usa el **póster real** del vídeo (`i.ytimg.com`) como miniatura y como portada del reproductor; al pulsar, carga el embed `youtube-nocookie` con autoplay (patrón fachada, mejor rendimiento y play explícito).

### Añadido

- **Carrusel automático** en la galería de la ficha: las imágenes avanzan solas cada 5 s. Se pausa mientras un vídeo se está reproduciendo y al navegar manualmente por las miniaturas.

## [0.0.43] — 2026-07-14

### Añadido

- **FEATURE-020 — Vídeos en la ficha del animal**: las protectoras pueden añadir vídeo por dos vías. **YouTube** (pegar el enlace en el alta) ya se guardaba pero la ficha lo pintaba como imagen rota; ahora el carrusel lo muestra como embed `youtube-nocookie`. **MP4 subido** (≤ 25 MB) desde el gestor de fotos, con validación de tipo/tamaño y reproductor nativo en la ficha. Las miniaturas de vídeo llevan overlay ▶.

### Cambiado

- La **miniatura** de un animal (tarjetas del listado, `og:image`, imagen social y schema.org) es ahora **siempre una foto**, nunca la URL de un vídeo: `animals_search` y las rutas OG filtran `type='photo'`. El mínimo para publicar sigue exigiendo al menos una foto (un vídeo no basta).

### Seguridad

- El enlace de YouTube nunca se renderiza crudo: solo se pinta el embed derivado de un `videoId` validado (sin XSS). Nueva restricción en BD: la portada (`is_cover`) solo puede ser una foto. Tope de tamaño del bucket `animal-media` a 25 MB (`file_size_limit`).

## [0.0.42] — 2026-07-13

### Cambiado

- **IMPROVEMENT-020 — Rediseño de la ficha de animal** (`/animales/[slug]`): la ficha estrena una columna de acción sticky «¿Te has enamorado?» con el CTA «Me interesa adoptar», «Guardar para luego» y un contador real y anónimo de «N personas interesadas», más una tarjeta verde «Proceso de adopción» con los cuatro pasos. La columna de contenido reordena galería, estado + «Publicado hace …», rasgos inline con iconos, compatibilidad en pills de color (verde sí / rojo no) y salud con checks. Se conserva la barra de acción sticky en móvil.

### Añadido

- RPC `contar_interesados` (SECURITY DEFINER): expone de forma agregada y anónima cuántas personas se han interesado por un animal publicado, sin filtrar identidades ni permitir sondear borradores.

## [0.0.40] — 2026-07-13

### Cambiado

- **IMPROVEMENT-019 — Rediseño del listado /animales**: los filtros pasan a una barra horizontal con combos (especie, tamaño, edad, sexo), slider de distancia y botón «Aplicar filtros» — ahora se editan en local y se aplican de golpe. Cabecera «Peludos cerca de ti (N resultados)» con «Ordenar por» a la derecha. Las tarjetas ganan corazón de favorito (sin pasar por la ficha; sin sesión lleva a login), badge «Recién llegado», icono de sexo junto al nombre en terracota, línea «edad · tamaño · distancia» y protectora con icono. Paginación numerada con elipsis y «Ver más resultados». Fuera de alcance (sin dato en el modelo): badge «Urgente» y filtro «Apto para piso».

## [0.0.39] — 2026-07-13

### Cambiado

- **IMPROVEMENT-018 — Rediseño de la home pública**: el hero estrena buscador real — especie + ciudad/código postal (geocodificado) o «Usar mi ubicación» — que lleva al listado ordenado por cercanía. «Recién llegados» sube bajo el hero con badge «Recién llegado» (<14 días) y botón «Adoptar» en cada tarjeta; «¿Cómo funciona Adoptia?» pasa a tres tarjetas con el paso final «Concierta una cita»; las estadísticas reales se muestran en una banda teal y el bloque de protectoras gana overline, foto y CTA «Registrar mi protectora».

## [0.0.38] — 2026-07-13

### Cambiado

- **IMPROVEMENT-017 — Rediseño del dashboard de protectora**: el panel gana identidad visual con tres tarjetas de color sobre la paleta de marca — solicitudes pendientes (coral, con variación semanal real «+N% desde la última semana»), citas de hoy (teal, con la hora de la próxima) y perfiles activos (crema, con pila de avatares de los animales publicados). Nueva sección «Próximas Citas» con bloque de fecha, «adoptante - animal (raza)» y franja horaria, más enlace al calendario. El botón principal pasa a «Publicar mascota». Se conservan banners de verificación, primeros pasos, animales y solicitudes recientes.

## [0.0.37] — 2026-07-13

### Añadido

- **IMPROVEMENT-016 — Redirección post-login según rol**: al iniciar sesión (contraseña o Google), cada perfil aterriza donde trabaja: la protectora en su panel (`/panel`), el administrador en `/admin` y el adoptante en la home. Si venías redirigido desde una página protegida, se respeta ese destino; los redirects externos (open redirect) se descartan siempre.

## [0.0.36] — 2026-07-13

### Añadido

- **FEATURE-019 — Directorio público de protectoras**: nueva página `/protectoras` que arregla el 404 del enlace "Protectoras" de la cabecera. Lista las protectoras **verificadas** ordenadas por nombre, con logo, ubicación, extracto y el número de animales que tienen en adopción; cada tarjeta lleva a su perfil público y hay enlace al mapa. Estado vacío cuidado, textos en `es.json`, metadatos SEO y la ruta añadida al sitemap.

## [0.0.35] — 2026-07-12

### Añadido

- **IMPROVEMENT-015 — README de calidad y manual de usuario (entrega TFM)**: nuevo **manual de usuario** (`docs/manual/MANUAL_USUARIO.md`, navegable en MkDocs) que explica toda la plataforma por perfiles —visitante/adoptante, protectora y administración— en formato "cómo hacer X" con pasos numerados, FAQ y glosario. El **README** se reescribe por completo como portada del repositorio: badges, funcionalidades por perfil, diagrama de arquitectura Mermaid, stack justificado pieza a pieza, puesta en marcha paso a paso verificada contra `package.json`, tabla de scripts, calidad/CI, despliegue, estructura del repo alineada con `src/` real y mapa de documentación. De paso corrige la referencia a Resend: los emails van por SMTP de Gmail con Nodemailer (Decisión #22).

## [0.0.34] — 2026-07-12

### Corregido

- **IMPROVEMENT-014 — CI verde de nuevo y suite estable**: el CI llevaba en rojo desde la 0.0.29 porque la cobertura había caído por debajo del umbral con el volumen de interfaz nueva (el control de calidad local corría los tests sin medir cobertura — corregido el proceso). Se añaden ~60 tests de los formularios, acciones y páginas de las últimas features, devolviendo los cuatro umbrales por encima del 70% (funciones 71,7%, líneas 80,6%). Además, los tests de base de datos corren ahora en serie entre sí (adiós al flaky ocasional) y los tests de interacción largos ya no expiran bajo la instrumentación de cobertura.

## [0.0.33] — 2026-07-11

### Añadido

- **FEATURE-016 — Registro de casas de acogida**: cualquier persona con cuenta puede ofrecerse como **casa de acogida temporal** en `/acogida` (especies, vivienda, jardín, disponibilidad, zona en el mapa y radio), con **consentimiento explícito** para ser contactada. Las protectoras **verificadas** ven en su panel a los acogedores disponibles de su zona —solo zona aproximada y condiciones: la dirección exacta se redondea al guardar y nunca existe— y les proponen acogidas con un clic: el aviso llega **al acogedor por email con los datos de la protectora**, sin exponer nunca el contacto del acogedor. Pausa para vacaciones y baja con borrado completo de datos.

## [0.0.32] — 2026-07-11

### Añadido

- **FEATURE-015 — Guías de adopción responsable**: nueva sección `/guias` con las cuatro primeras guías —los primeros días en casa (regla 3-3-3), cuánto cuesta tener un perro de verdad, cómo preparar la casa y por qué adoptar un animal mayor— maquetadas con tabla de contenidos, tiempo de lectura, avisos y checklists, y rematadas con la llamada "buscar animales cerca". Cada guía tiene SEO completo (metadatos, datos estructurados `Article`, sitemap) y se enlazan desde la home, el pie de cada ficha de animal y el footer. Añadir una guía nueva es soltar un fichero Markdown en `src/content/guias/`: el índice, las rutas y el sitemap se generan solos.

## [0.0.31] — 2026-07-11

### Añadido

- **FEATURE-014 — Estadísticas y difusión en redes**: nueva sección **Estadísticas** en el panel de la protectora con las visitas de sus fichas (agregadas por día y completamente anónimas: solo un contador, sin ningún dato del visitante), solicitudes recibidas y tiempo medio hasta adopción, con gráfica de 30 días y desglose por animal. Desde ahí, un clic genera la **imagen lista para redes** de cada ficha publicada —foto, nombre, protectora y marca Adoptia— descargable en cuadrado (1080×1080) y vertical para stories (1080×1920).

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
