# ADOPTIA — Prompts para Google Stitch

Dos bloques: **parte adoptante (pública)** y **parte protectora (panel)**. Stitch funciona mejor en inglés y con prompts que describen pantalla a pantalla; cada prompt de abajo es autocontenido — pégalo tal cual. Empieza con el "prompt base" para fijar el estilo y luego genera pantalla a pantalla dentro del mismo proyecto.

---

## Prompt base (estilo global — úsalo al crear cada proyecto en Stitch)

```
Design a mobile-first responsive web app called "Adoptia", a platform that connects
animal shelters with people who want to adopt pets. Visual style: warm, friendly and
trustworthy. Large pet photos are the protagonists; keep the UI clean and neutral so
photos stand out. Color palette: warm primary (terracotta/coral or sage green), warm
neutrals (cream/sand background), one accent color for call-to-action buttons. Rounded
corners, soft shadows, humanist sans-serif typography. Accessible contrast (AA),
touch-friendly targets. Language of all UI texts: Spanish.
```

---

## PARTE 1 — Área pública / adoptante

### 1.1. Home

```
Home page for Adoptia (pet adoption platform, Spanish UI). Sections:
1) Hero with a warm headline like "Encuentra a tu nuevo mejor amigo", a short subtitle,
   and a quick search bar with two fields: species selector (Perro / Gato / Otros) and
   location input ("Ciudad o código postal") plus a "Buscar" button and a secondary
   "Usar mi ubicación" link with a location icon.
2) A horizontal row of recently added animals as cards: big photo, name, age, distance
   ("a 12 km"), and small compatibility chips (niños, otros perros, piso).
3) A section "¿Cómo funciona?" with 3 steps: Busca cerca de ti → Conoce a tu match →
   Concierta una cita.
4) A counter strip: shelters registered, animals available, adoptions completed.
5) A call-to-action banner for shelters: "¿Eres una protectora? Únete gratis" with button.
6) Footer with links (Aviso legal, Privacidad, Contacto, RRSS).
```

### 1.2. Mapa de protectoras

```
Map screen for Adoptia (Spanish UI). Full-height interactive map (OpenStreetMap style)
showing animal shelter markers with clustering. Top: search bar for city/postal code and
a "Usar mi ubicación" button. Left side (desktop) or bottom sheet (mobile): scrollable
list of shelters ordered by distance, each item with logo, name, city, distance, number
of available animals and a small "Verificada" badge. Tapping a marker highlights the
shelter card and shows a popup with name, photo, distance and a button "Ver protectora".
Include a filter chip row above the list: Perros, Gatos, Acogida, Voluntariado.
```

### 1.3. Listado / búsqueda de animales

```
Animal search results screen for Adoptia (Spanish UI). Top: filter bar with chips and
dropdowns: Especie, Tamaño, Edad, Sexo, Distancia (slider), and toggles "Bueno con
niños", "Bueno con otros animales", "Apto para piso". Sort selector: "Más cercanos /
Más recientes". Below: responsive grid of animal cards (2 columns mobile, 4 desktop).
Each card: large photo, name, age ("2 años"), sex icon, size, distance ("a 8 km"),
shelter name, heart icon to save as favorite, and a status badge when reserved
("Reservado"). Empty state design too: friendly illustration with text "No hay animales
con estos filtros en tu zona" and a button "Crear alerta para esta búsqueda".
```

### 1.4. Ficha de animal

```
Animal detail page for Adoptia (Spanish UI). Content:
1) Photo gallery carousel with thumbnails, supports video.
2) Header: name ("Luna"), status badge ("En adopción"), age, sex, size, breed; heart
   icon for favorites and a share icon (WhatsApp).
3) Compatibility chips with icons: Buena con niños, Buena con perros, No gatos, Apta
   para piso, Energía media.
4) Health section with check icons: Vacunada, Esterilizada, Con microchip + free text
   health notes.
5) "Su historia" text section.
6) Shelter card: logo, name, city, distance, small static map, link "Ver protectora".
7) Sticky bottom bar (mobile) with primary button "Me interesa" and secondary
   "Guardar". Desktop: right sidebar with the same actions.
```

### 1.5. Cuestionario "Me interesa"

```
Multi-step adoption request form (stepper) for Adoptia (Spanish UI), shown after tapping
"Me interesa" on an animal named Luna. Header shows the animal's small photo and name.
4 steps with progress indicator:
Step 1 "Tu vivienda": housing type (Piso / Casa con jardín / Otro), rent or owned,
  landlord allows pets toggle.
Step 2 "Tu hogar": people at home, children ages, other animals (which).
Step 3 "Experiencia y tiempo": previous pet experience, hours the animal would be alone
  per day (slider), everyone at home agrees (toggle).
Step 4 "Cuéntanos": free text "¿Por qué quieres adoptar a Luna?" and a summary of
  answers, checkbox accepting privacy policy, submit button "Enviar solicitud".
Final success screen: warm confirmation "¡Solicitud enviada! La protectora la revisará
y te contactará" with illustration and button "Seguir buscando".
```

### 1.6. Área personal adoptante

```
Adopter personal area for Adoptia (Spanish UI) with tab navigation: "Mis solicitudes",
"Favoritos", "Mis alertas", "Citas".
- Mis solicitudes: list of request cards with animal photo, name, shelter, date and
  status badge (Pendiente / Aprobada / Rechazada / Completada).
- Favoritos: grid of saved animal cards with remove option.
- Mis alertas: saved searches as cards ("Perro pequeño · < 30 km de Bilbao") with a
  notifications toggle and delete icon, plus button "Nueva alerta".
- Citas: upcoming appointment card with date, time, animal, shelter address, map
  snippet, and buttons "Cancelar" / "Cómo llegar".
```

### 1.7. Selección de cita

```
Appointment booking screen for Adoptia (Spanish UI), shown when a shelter approves a
request. Header: "Elige un día para conocer a Luna" with animal photo and shelter name
and address. Week calendar strip to pick a day, then a grid of available time slots as
selectable pills ("10:00", "10:30"...). Selected slot highlighted. Confirmation section
with summary (day, time, address, small map) and primary button "Confirmar cita".
```

---

## PARTE 2 — Área protectora (panel de gestión)

### 2.1. Registro / onboarding de protectora

```
Shelter onboarding flow for Adoptia (Spanish UI), 3-step wizard after signup:
Step 1 "Datos de la entidad": shelter name, CIF, contact email, phone, website.
Step 2 "Ubicación": address fields (calle, ciudad, provincia, CP) with a map preview
  showing the geocoded pin the user can adjust, opening hours editor.
Step 3 "Perfil público": logo upload, description textarea, toggles "Aceptamos
  voluntarios" and "Buscamos casas de acogida", social media links.
Final screen: "¡Solicitud enviada!" explaining the profile will be reviewed and
verified by the Adoptia team before going public (pending verification state).
```

### 2.2. Dashboard

```
Shelter dashboard for Adoptia (Spanish UI). Left sidebar navigation (collapsible on
mobile): Inicio, Mis animales, Solicitudes, Citas, Agenda, Perfil público, Estadísticas.
Main area:
1) Greeting header "Hola, Refugio Esperanza" with "Verificada" badge.
2) 4 stat tiles: Animales publicados, Solicitudes pendientes, Citas esta semana,
   Adopciones este año.
3) "Solicitudes recientes" list: adopter name, animal photo + name, date, status,
   quick actions (Ver / Aprobar / Rechazar).
4) "Próximas citas" list with day, time, animal and adopter.
5) Quick action button "+ Añadir animal" prominent.
```

### 2.3. Gestión de animales (listado)

```
Shelter animals management screen for Adoptia (Spanish UI). Table/card list of the
shelter's animals with columns: photo thumbnail, name, species, age, status dropdown
(En adopción / Reservado / Adoptado / Acogida / Borrador), views count, pending
requests count, last updated. Row actions: Editar, Duplicar, Despublicar. Top bar:
search input, status filter tabs (Todos / Publicados / Borradores / Adoptados) and
primary button "+ Añadir animal". Mobile: cards instead of table rows.
```

### 2.4. Formulario de animal (crear/editar)

```
Animal create/edit form for Adoptia shelter panel (Spanish UI), organized in sections:
1) "Básico": name, species (Perro/Gato/Otro), breed, sex, approximate birth date, size,
   weight.
2) "Fotos y vídeo": drag & drop photo uploader with thumbnails, star icon to set cover
   photo, reorder by drag, and a field to paste a YouTube link.
3) "Carácter": toggles with unknown state (Sí/No/No sabemos) for: bueno con niños,
   con perros, con gatos, apto para piso; energy level selector (Baja/Media/Alta).
4) "Salud": checkboxes Vacunado, Esterilizado, Con microchip; textarea for health notes;
   special needs field.
5) "Historia": rich textarea "Cuenta su historia".
6) "Adopción": optional adoption fee, entry date.
Footer sticky bar: "Guardar borrador" secondary and "Publicar" primary buttons.
```

### 2.5. Bandeja de solicitudes

```
Adoption requests inbox for Adoptia shelter panel (Spanish UI). Two-pane layout
(list + detail on desktop, drill-down on mobile):
Left: request list grouped by animal, each item: adopter name, animal thumbnail + name,
date, status badge (Pendiente/Aprobada/Rechazada).
Right detail: adopter info header, full questionnaire answers displayed as clear
question/answer blocks (vivienda, convivientes, otros animales, experiencia, horas solo,
motivación), adopter's free message highlighted, internal notes textarea for the
shelter, and action buttons: "Aprobar y proponer cita" (primary), "Rechazar" (with
reason modal), "Marcar adoptado".
```

### 2.6. Agenda y citas

```
Shelter agenda screen for Adoptia (Spanish UI). Two tabs:
Tab 1 "Citas": weekly calendar view with appointment blocks (animal name + adopter),
  each clickable to a detail popover with actions Confirmar / Cancelar / Realizada /
  No se presentó.
Tab 2 "Disponibilidad": weekly recurring availability editor — for each weekday, add
  time ranges (start/end) and slot duration selector (15/30/60 min), with a live
  preview of generated slots.
```

### 2.7. Perfil público de la protectora

```
Shelter public profile editor for Adoptia (Spanish UI), with live preview toggle
("Ver como visitante"). Editable sections: cover photo and logo, description, facility
photos gallery uploader, contact info, opening hours, location map, collaboration
options (volunteering, fostering, donations link), social links. Save bar at bottom.
```

---

## Consejos de uso en Stitch

- Crea **dos proyectos separados** en Stitch (uno por parte) para que no mezcle estilos de panel y web pública; pega el prompt base al inicio de cada uno.
- Genera pantalla a pantalla, en el orden listado; Stitch mantiene coherencia dentro del proyecto.
- Si una pantalla sale demasiado "corporativa", añade: `warmer and friendlier, less corporate, bigger photos`.
- Pide siempre las variantes móvil y escritorio: añade `show mobile version` cuando la genere solo en desktop.
- Exporta a Figma desde Stitch para retocar y de ahí saca los tokens (colores/tipos) para Tailwind.
