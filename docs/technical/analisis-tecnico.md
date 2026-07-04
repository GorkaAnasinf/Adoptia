# ADOPTIA — Análisis técnico completo (Biblia del proyecto)

> Documento de referencia técnica del proyecto. Complementa a `01-analisis-funcional.md`.
> Última actualización: 2026-07-03

---

## 1. Visión técnica general

Aplicación web responsive (*mobile first*) con dos áreas diferenciadas:

- **Área pública / adoptante**: mapa, búsqueda, fichas de animales, solicitudes y citas.
- **Área protectora**: panel de gestión (animales, media, solicitudes, citas, perfil).

Restricción principal: **coste cero**. Todo el stack se apoya en capas gratuitas (free tiers) de servicios cloud. La arquitectura debe permitir escalar a planes de pago sin reescribir nada.

---

## 2. Stack tecnológico

### 2.1. Resumen

| Capa | Tecnología | Servicio (free tier) | Motivo |
|------|-----------|----------------------|--------|
| Frontend + SSR | **Next.js 15 (React, App Router) + TypeScript** | **Vercel** (Hobby) | Framework dominante, SSR/SEO, despliegue git-push, HTTPS y CDN gratis |
| Estilos | **Tailwind CSS + shadcn/ui** | — | Rapidez, consistencia, encaja con salidas de Stitch |
| Base de datos | **PostgreSQL** | **Supabase** (Free) | 500 MB BD, API REST autogenerada, realtime |
| Autenticación | **Supabase Auth** | Supabase | Email/password + OAuth Google gratis, gestión de roles vía RLS |
| Almacenamiento (fotos/vídeos) | **Supabase Storage** | Supabase (1 GB) | Integrado con la BD y sus políticas de acceso |
| Mapas | **Leaflet + OpenStreetMap** | — | 100% gratis, sin API key ni tarjeta (Google Maps exige tarjeta) |
| Geocodificación | **Nominatim** (OSM) | — | Convertir dirección → coordenadas en el alta de protectoras |
| Emails transaccionales | **Resend** (free: 100/día) | Resend | Confirmaciones de cita, avisos, alertas |
| Validación | **Zod** | — | Validación de formularios y API en un solo esquema |
| Formularios | **React Hook Form** | — | Estándar de facto con Zod |
| ORM (opcional) | **Drizzle ORM** | — | Tipado TS sobre Postgres; alternativa: cliente supabase-js directo |
| Analítica | **Vercel Analytics** o **Umami cloud free** | — | Sin cookies, RGPD-friendly |
| Control de versiones | **GitHub** (repo privado) | — | CI/CD automático con Vercel |

### 2.2. Decisiones y alternativas

- **¿Por qué Next.js y no SPA pura?** El SEO es crítico: las fichas de animales deben indexarse en Google ("adoptar perro en Bilbao"). SSR/SSG lo resuelve.
- **¿Por qué Supabase y no Render + Postgres?** Render apaga los servicios free tras 15 min de inactividad (arranque lento) y su Postgres gratuito expira a los 30 días. Supabase da BD + Auth + Storage + API en un solo servicio sin esos límites. **Render queda como alternativa** si más adelante hace falta un backend propio (por ejemplo, procesado de vídeo o cron jobs pesados).
- **Vídeos**: el free tier de Storage (1 GB) se agota rápido con vídeo. Estrategia: limitar vídeo subido a 30–60 s / 50 MB, y **permitir también enlazar vídeos de YouTube/Instagram** (coste cero, las protectoras ya los publican ahí).
- **Imágenes**: comprimir en cliente antes de subir (browser-image-compression) y servir con `next/image`. Tamaño objetivo: ≤ 300 KB por foto.

### 2.3. Arquitectura

```
[Navegador]
    │
    ▼
[Vercel — Next.js]
    ├── Páginas públicas (SSR/ISR): home, mapa, fichas, protectoras
    ├── Panel protectora (CSR autenticado)
    └── Route Handlers /api/* (lógica de servidor: citas, emails, alertas)
    │
    ▼
[Supabase]
    ├── PostgreSQL (+ PostGIS para proximidad)
    ├── Auth (adoptantes, protectoras, admin)
    ├── Storage (fotos, vídeos)
    └── Row Level Security (cada protectora solo toca lo suyo)
    │
    ▼
[Resend] emails  ·  [OSM/Nominatim] mapas y geocoding
```

- Activar la extensión **PostGIS** en Supabase (disponible en free tier) para búsquedas por proximidad reales (`ST_DWithin`, ordenación por distancia).
- **RLS (Row Level Security)** como pilar de seguridad: las políticas viven en la BD, no en el código.

---

## 3. Modelo de datos

### 3.1. Diagrama de entidades (resumen)

```
profiles ──< shelters ──< animals ──< animal_media
   │             │           │
   │             │           ├──< adoption_requests >── profiles
   │             │           │           │
   │             │           │           └──< appointments
   │             │           └──< sponsorships
   │             ├──< shelter_media
   │             └──< availability_slots
   ├──< favorites >── animals
   ├──< saved_searches
   └──< lost_found_posts
```

### 3.2. Tablas

#### `profiles` (extiende `auth.users` de Supabase)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | = auth.users.id |
| role | enum(`adopter`,`shelter`,`admin`) | |
| full_name | text | |
| phone | text | opcional |
| avatar_url | text | opcional |
| created_at | timestamptz | default now() |

#### `shelters` (protectoras)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid FK → profiles | usuario gestor principal |
| name | text | |
| slug | text unique | URL amigable `/protectoras/refugio-bilbao` |
| description | text | |
| cif | text | para verificación |
| email, phone, website | text | |
| address, city, province, postal_code | text | |
| location | geography(Point) | **PostGIS** — lat/lng geocodificadas |
| logo_url | text | |
| status | enum(`pending`,`verified`,`suspended`) | verificación manual por admin |
| social_links | jsonb | instagram, facebook… |
| opening_hours | jsonb | |
| accepts_volunteers, accepts_fostering | boolean | |
| created_at, updated_at | timestamptz | |

#### `animals`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| shelter_id | uuid FK → shelters | |
| name | text | |
| slug | text unique | `/animales/luna-a1b2c3` |
| species | enum(`dog`,`cat`,`other`) | |
| breed | text | |
| sex | enum(`male`,`female`,`unknown`) | |
| birth_date_approx | date | edad aproximada |
| size | enum(`small`,`medium`,`large`) | |
| weight_kg | numeric | opcional |
| status | enum(`available`,`reserved`,`adopted`,`fostered`,`not_listed`) | |
| description | text | historia + carácter |
| good_with_kids, good_with_dogs, good_with_cats | boolean nullable | null = desconocido |
| apartment_suitable | boolean nullable | |
| energy_level | enum(`low`,`medium`,`high`) | |
| special_needs | text nullable | |
| health: vaccinated, sterilized, microchipped | boolean | |
| health_notes | text | tratamientos, enfermedades |
| adoption_fee | numeric nullable | tasa de adopción si la hay |
| entry_date | date | cuándo llegó a la protectora |
| published_at | timestamptz nullable | null = borrador |
| created_at, updated_at | timestamptz | |

#### `animal_media` / `shelter_media`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| animal_id / shelter_id | uuid FK | |
| type | enum(`photo`,`video`,`youtube`) | youtube = solo URL |
| url | text | Storage path o URL externa |
| is_cover | boolean | foto principal |
| sort_order | int | |
| created_at | timestamptz | |

#### `adoption_requests` (solicitudes "me interesa")
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| animal_id | uuid FK | |
| adopter_id | uuid FK → profiles | |
| status | enum(`pending`,`approved`,`rejected`,`withdrawn`,`completed`) | `completed` = adoptado |
| questionnaire | jsonb | respuestas pre-adopción |
| message | text | mensaje libre del adoptante |
| shelter_notes | text | notas internas de la protectora |
| created_at, updated_at | timestamptz | |
| | | **unique(animal_id, adopter_id)** — una solicitud por animal y usuario |

#### `availability_slots` (agenda de la protectora)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| shelter_id | uuid FK | |
| weekday | int 0–6 | franjas recurrentes |
| start_time, end_time | time | |
| slot_minutes | int | duración de cada cita (ej. 30) |

#### `appointments` (citas)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| request_id | uuid FK → adoption_requests | |
| starts_at | timestamptz | |
| status | enum(`proposed`,`confirmed`,`cancelled`,`done`,`no_show`) | |
| notes | text | |
| created_at | timestamptz | |

#### `favorites`
`(user_id, animal_id)` PK compuesta, created_at.

#### `saved_searches` (alertas)
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| filters | jsonb | especie, tamaño, distancia, lat/lng… |
| notify | boolean | email cuando entra animal que encaja |
| created_at | timestamptz | |

#### `sponsorships` (apadrinamientos — fase 3)
animal_id, sponsor_id, amount_monthly, status, created_at.

#### `lost_found_posts` (perdidos/encontrados — fase 3)
id, user_id, type(`lost`,`found`), species, description, photo_url, location(geography), status(`open`,`resolved`), created_at.

#### `notifications`
id, user_id, type, payload jsonb, read_at, created_at.

### 3.3. Políticas RLS (resumen)

- `animals`, `shelters`: lectura pública **solo** si `published_at is not null` / `status='verified'`. Escritura solo si `shelter.owner_id = auth.uid()`.
- `adoption_requests`: visible para el adoptante que la creó y la protectora del animal.
- `favorites`, `saved_searches`: solo su dueño.
- `admin`: rol con acceso total para verificación y moderación.

### 3.4. Consulta clave — proximidad

```sql
select a.*, s.name shelter_name,
       st_distance(s.location, st_makepoint(:lng,:lat)::geography) as distance_m
from animals a
join shelters s on s.id = a.shelter_id
where a.status = 'available'
  and a.published_at is not null
  and s.status = 'verified'
  and st_dwithin(s.location, st_makepoint(:lng,:lat)::geography, :radius_m)
order by distance_m;
```

---

## 4. Funcionalidades detalladas

### 4.1. Área pública / adoptante

| # | Funcionalidad | Detalle | Fase |
|---|---|---|---|
| U1 | Home | Propuesta de valor, buscador rápido (especie + ubicación), animales destacados/recientes, contador de adopciones | 1 |
| U2 | Mapa de protectoras | Leaflet con clustering de marcadores; geolocalización del navegador o búsqueda por ciudad/CP; tarjeta resumen al pulsar marcador | 1 |
| U3 | Listado/búsqueda de animales | Grid de tarjetas + filtros (especie, sexo, tamaño, edad, distancia, compatibilidades); ordenación por distancia/fecha; paginación | 1 |
| U4 | Ficha de animal | Galería fotos/vídeo, datos, salud, carácter (chips), protectora + mini-mapa, botón "Me interesa", compartir (WhatsApp/RRSS) | 1 |
| U5 | Ficha de protectora | Info, instalaciones, mapa, listado de sus animales, cómo colaborar | 1 |
| U6 | Registro/login adoptante | Email+password y Google OAuth (Supabase Auth) | 1 |
| U7 | Solicitud "Me interesa" | Cuestionario pre-adopción (vivienda, experiencia, otros animales, horas solo, motivación) + mensaje; email a la protectora | 1 |
| U8 | Mis solicitudes | Estado de cada solicitud, historial | 2 |
| U9 | Citas | Elegir hueco entre los ofrecidos por la protectora, confirmación y recordatorio por email | 2 |
| U10 | Favoritos | Guardar animales, aviso si cambia su estado | 2 |
| U11 | Alertas guardadas | Guardar búsqueda; email cuando entra animal que encaja | 2 |
| U12 | Perdidos/encontrados | Publicar aviso con foto y ubicación en el mapa | 3 |
| U13 | Apadrinamiento | Apadrinar animal (pasarela: enlace externo tipo Stripe Payment Link / Teaming al principio) | 3 |
| U14 | Contenido educativo | Blog/guías estáticas (MDX) — bueno para SEO | 3 |

### 4.2. Área protectora

| # | Funcionalidad | Detalle | Fase |
|---|---|---|---|
| P1 | Alta y onboarding | Registro, datos de entidad, dirección geocodificada (Nominatim), subida de logo; queda `pending` hasta verificación | 1 |
| P2 | Dashboard | Resumen: animales publicados, solicitudes pendientes, próximas citas | 1 |
| P3 | CRUD animales | Formulario completo de ficha, borrador/publicar, duplicar ficha | 1 |
| P4 | Gestión de media | Subir fotos (compresión en cliente), marcar portada, ordenar, enlazar YouTube | 1 |
| P5 | Bandeja de solicitudes | Ver cuestionario, aprobar/rechazar con motivo, notas internas | 1 |
| P6 | Perfil público | Editar descripción, instalaciones (fotos), horarios, colaboración | 1 |
| P7 | Agenda y citas | Definir franjas semanales; confirmar/cancelar/marcar realizada | 2 |
| P8 | Estados del animal | available → reserved → adopted; histórico | 1 |
| P9 | Estadísticas | Visitas por ficha, solicitudes, tiempo medio hasta adopción | 3 |
| P10 | Difusión | Generar imagen para RRSS de una ficha (plantilla + og-image) | 3 |
| P11 | Casas de acogida | Listado de acogedores interesados en su zona | 3 |

### 4.3. Administración (interno)

| # | Funcionalidad | Fase |
|---|---|---|
| A1 | Verificar/rechazar protectoras (revisar CIF/documentación) | 1 |
| A2 | Moderación: despublicar contenido, suspender cuentas | 2 |
| A3 | Métricas globales de la plataforma | 3 |

### 4.4. Cuestionario de pre-adopción (contenido inicial)

1. Tipo de vivienda (piso / casa con jardín / otro) y régimen (propiedad / alquiler — ¿permiten animales?)
2. ¿Cuántas personas viven en casa? ¿Niños? ¿Edades?
3. ¿Otros animales? ¿Cuáles?
4. Experiencia previa con animales.
5. Horas que el animal pasaría solo al día.
6. ¿Todos los convivientes están de acuerdo?
7. ¿Asumes gastos veterinarios y de alimentación (estimación anual)?
8. Motivación para adoptar (texto libre).

---

## 5. Diseño (genérico — se afinará con Google Stitch)

No se cierra aquí un diseño de pantallas: se definen **principios y sistema**, y las pantallas concretas se generarán con Stitch (ver `03-prompts-stitch.md`).

- **Mobile first**: el 80%+ del tráfico esperado es móvil.
- **Tono visual**: cálido, cercano y confiable. Las fotos de los animales son las protagonistas — el UI debe ser neutro y dejarles el espacio.
- **Paleta orientativa**: un color primario cálido (terracota/coral o verde salvia), neutros cálidos (crema/arena) y un color de acento para CTAs. Evitar look corporativo frío.
- **Tipografía**: una sans humanista legible (ej. Nunito, Inter, Figtree). Titulares con algo de personalidad, cuerpo neutro.
- **Componentes clave**: tarjeta de animal (foto grande, nombre, edad, distancia, chips de compatibilidad), mapa con clustering, chips de filtro, stepper para el cuestionario, calendario de citas.
- **Accesibilidad**: contraste AA, targets táctiles ≥ 44 px, textos alternativos en fotos.
- **Estados vacíos cuidados**: "aún no hay animales en tu zona" con ilustración y CTA de crear alerta.
- Implementación con **Tailwind + shadcn/ui**: lo que salga de Stitch se traduce a estos componentes.

---

## 6. Despliegue y entornos (coste 0 €)

| Servicio | Plan | Límites relevantes | Uso |
|---|---|---|---|
| **Vercel** Hobby | 0 € | 100 GB bandwidth/mes, serverless functions | Frontend + API |
| **Supabase** Free | 0 € | 500 MB BD, 1 GB storage, 50k MAU auth, pausa tras 7 días sin actividad* | BD, Auth, Storage |
| **Resend** Free | 0 € | 100 emails/día, 3.000/mes | Transaccionales |
| **GitHub** Free | 0 € | Repos privados ilimitados | Código + CI |
| **OSM/Nominatim** | 0 € | Uso razonable (cachear geocoding) | Mapas |

\* La pausa de Supabase se evita con un ping semanal (cron de GitHub Actions, también gratis).

- **Entornos**: `main` → producción (Vercel), `develop` → preview automático (Vercel Preview Deployments). Un solo proyecto Supabase al principio; si hace falta, segundo proyecto free como staging.
- **Dominio**: subdominio gratis `adoptia.vercel.app` para la demo; dominio propio (~10 €/año) es el único gasto opcional recomendable de cara a presentarlo.
- **Migraciones BD**: SQL versionado en el repo (carpeta `/supabase/migrations`, CLI de Supabase).
- **CI**: GitHub Actions — lint + typecheck + build en cada PR.

### Ruta de escalado futuro (cuando haya presupuesto)
Supabase Pro (25 $/mes) → más storage y sin pausas · Vercel Pro → más bandwidth · Cloudinary/Bunny para media pesada · Stripe para donaciones integradas.

---

## 7. Cosas que no se nos pueden olvidar (checklist)

**Legal / confianza**
- [ ] RGPD: política de privacidad, consentimiento explícito en registro y cuestionario, derecho de supresión.
- [ ] Aviso legal y condiciones de uso (la plataforma **intermedia**, la adopción la formaliza la protectora — dejarlo claro para limitar responsabilidad).
- [ ] Política de cookies (mínima si se usa analítica sin cookies).
- [ ] Verificación documental de protectoras antes de publicarlas.
- [ ] Consentimiento de las protectoras sobre el uso de sus fotos.

**Producto**
- [ ] SEO: metadatos por ficha, `og:image` con la foto del animal (clave para compartir en WhatsApp), sitemap.xml, datos estructurados (schema.org).
- [ ] Textos de email transaccional (solicitud recibida, cita confirmada, recordatorio 24 h antes).
- [ ] Flujo de "animal adoptado": qué pasa con las demás solicitudes pendientes (email amable + sugerencia de animales similares).
- [ ] Multiidioma futuro (ES primero; preparar i18n aunque no se traduzca aún — next-intl).
- [ ] Página 404 y estados de error amables.
- [ ] Rate limiting básico en formularios públicos (anti-spam, honeypot).

**Técnico**
- [ ] Backups: Supabase free no tiene backups automáticos — exportación semanal con GitHub Actions (`pg_dump`).
- [ ] Monitorización de errores: Sentry free tier.
- [ ] Compresión de imágenes en cliente antes de subir (proteger el 1 GB).
- [ ] Cachear resultados de Nominatim (guardar lat/lng en BD, no geocodificar en cada visita).
- [ ] Seed de datos de demo (3–4 protectoras ficticias con animales) para la presentación.

**Presentación a dirección**
- [ ] Demo con datos ficticios realistas y fotos libres (Unsplash/Pexels).
- [ ] Métricas objetivo: nº protectoras registradas, nº animales publicados, solicitudes/mes, adopciones completadas.
- [ ] Posibles vías de sostenibilidad (patrocinio veterinarias/marcas de pienso, subvenciones, donaciones).

---

## 8. Estructura del repositorio (propuesta)

```
adoptia/
├── docs/                    # este análisis y decisiones
├── supabase/
│   ├── migrations/          # SQL versionado
│   └── seed.sql             # datos de demo
├── src/
│   ├── app/
│   │   ├── (public)/        # home, mapa, animales/[slug], protectoras/[slug]
│   │   ├── (adopter)/       # mis-solicitudes, favoritos, alertas
│   │   ├── (shelter)/panel/ # dashboard, animales, solicitudes, agenda, perfil
│   │   ├── (admin)/
│   │   └── api/             # route handlers (citas, emails, cron)
│   ├── components/          # ui/ (shadcn), animals/, map/, forms/
│   ├── lib/                 # supabase client, zod schemas, utils
│   └── emails/              # plantillas (react-email)
└── .github/workflows/       # ci.yml, backup.yml, keepalive.yml
```

---

## 9. Roadmap técnico

| Sprint (orientativo) | Entregable |
|---|---|
| 1 | Setup: repo, Next.js, Supabase, auth, esquema BD fase 1, CI |
| 2 | Panel protectora: alta, CRUD animales, subida de fotos |
| 3 | Público: home, listado con filtros, ficha animal, ficha protectora |
| 4 | Mapa con proximidad (PostGIS + Leaflet), geocoding en alta |
| 5 | Solicitudes: cuestionario, bandeja protectora, emails |
| 6 | Pulido, SEO, seed de demo, panel admin de verificación → **MVP presentable** |
| 7–8 | Fase 2: citas + agenda, favoritos, alertas |
| 9+ | Fase 3 según feedback |
