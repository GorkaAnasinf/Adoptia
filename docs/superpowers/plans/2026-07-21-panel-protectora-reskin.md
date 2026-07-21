# Reskin del panel de la protectora — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alinear el home del panel de protectora con el wireframe Stitch: "Tus animales" como rejilla de tarjetas con foto y "Solicitudes recientes" enriquecidas, manteniendo coherencia con el dashboard de adoptante.

**Architecture:** Cambios acotados a `src/app/(shelter)/panel/page.tsx` (Server Component). Se reutilizan helpers y componentes ya existentes (`edadAproximada`, `AnimalStatusBadge`, claves i18n de `busqueda` y `solicitudesPanel`). Se añade **una** clave i18n. Layout `1fr` + aside `20rem` sin cambios.

**Tech Stack:** Next.js 15 App Router (RSC), TypeScript, Tailwind + shadcn, next-intl, Supabase (server + admin clients), Vitest + Testing Library.

## Global Constraints

- Textos de UI SIEMPRE en `messages/es.json` (next-intl); nunca hardcodeados.
- Imágenes vía `next/image`.
- TDD: test que falla antes del código de producción.
- No cambios de esquema en BD. No banner promocional. No etiquetas de modalidad de cita.
- El nombre del adoptante vive en `profiles` (RLS solo dueño) → se resuelve con `createAdminClient()`, el mismo bypass acotado que este fichero YA usa para las citas.
- Layout de columnas: `lg:grid-cols-[1fr_20rem]` (sin cambios).

---

### Task 1: Solicitudes recientes enriquecidas (aside)

Sustituye la lista mínima del aside (solo nombre de mascota + chip "Pendiente") por filas con mascota + adoptante + fecha + chip de estado real. Se dejan de filtrar solo las `pending`: se muestran las 5 más recientes de cualquier estado.

**Files:**
- Modify: `src/app/(shelter)/panel/page.tsx`
- Test: `src/app/(shelter)/panel/page.test.tsx`

**Interfaces:**
- Consumes: `createAdminClient` (ya importado), `getTranslations` (ya importado). Nuevo import `EstadoSolicitud` de `@/lib/schemas/solicitud`.
- Produces: `recentRequests` pasa a tipo `{ id: string; created_at: string; status: EstadoSolicitud; adopter_id: string; animal: { name: string; slug: string } | null }` enriquecido con `adopterName: string | null`. El mapa `nombres` (admin lookup) pasa a cubrir ids de citas **y** de solicitudes.

- [ ] **Step 1: Escribir el test que falla**

En `src/app/(shelter)/panel/page.test.tsx`, dentro del `describe`, añade:

```tsx
it("Solicitudes recientes muestra mascota, adoptante, fecha y chip de estado", async () => {
  state.animals = [animalPublicado(1)];
  state.requests = [
    {
      id: "r1",
      created_at: "2026-07-10T09:00:00Z",
      status: "approved",
      adopter_id: "adopter1",
      animal: { name: "Bruno", slug: "bruno" },
    },
  ];
  state.perfiles = [{ id: "adopter1", full_name: "Familia Martínez" }];
  conIntl(await PanelPage());

  // Sin citas en este test, así que "Familia Martínez" solo aparece en el aside.
  expect(screen.getByText("Bruno")).toBeInTheDocument();
  expect(screen.getByText(/Familia Martínez/)).toBeInTheDocument();
  expect(screen.getByText(messages.solicitudesPanel.statusApproved)).toBeInTheDocument();
});
```

> Nota: se consulta con `screen` directamente (no `within`) porque las filas del
> aside son hermanas del encabezado, no descendientes; `Bruno`, `Familia
> Martínez` y `Aprobada` son únicos en la pantalla con este estado.

- [ ] **Step 2: Ejecutar el test y verificar que falla**

Run: `npm run test -- src/app/(shelter)/panel/page.test.tsx -t "Solicitudes recientes muestra mascota"`
Expected: FAIL (no aparece "Familia Martínez" ni el chip "Aprobada"; el aside solo pinta el nombre del animal con chip "Pendiente").

- [ ] **Step 3: Ampliar la consulta y el enriquecido en `page.tsx`**

Añade el import al bloque de imports:

```tsx
import type { EstadoSolicitud } from "@/lib/schemas/solicitud";
```

Sustituye el tipo `RequestRow` (líneas ~27-31) por:

```tsx
type RequestRow = {
  id: string;
  created_at: string;
  status: EstadoSolicitud;
  adopter_id: string;
  animal: { name: string; slug: string } | null;
};
```

Añade, junto a los demás formateadores de fecha (tras `DIA_NUM_MADRID`), un formato corto y el mapa de chips:

```tsx
const FECHA_CORTA_MADRID = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  timeZone: "Europe/Madrid",
});

const CHIP_SOLICITUD: Record<EstadoSolicitud, string> = {
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-tertiary/10 text-tertiary",
  rejected: "bg-destructive/10 text-destructive",
  withdrawn: "bg-muted text-muted-foreground",
  completed: "bg-primary/10 text-primary",
};

function capitaliza(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
```

Sustituye la consulta `recentRequests` (líneas ~112-118) por (sin filtro de estado, con `status` y `adopter_id`):

```tsx
    const { data: r } = await supabase
      .from("adoption_requests")
      .select("id,created_at,status,adopter_id,animal:animals(name,slug)")
      .order("created_at", { ascending: false })
      .limit(5);
    recentRequests = (r as RequestRow[] | null) ?? [];
```

- [ ] **Step 4: Extender el lookup admin para cubrir citas y solicitudes**

Sustituye la línea que construye `ids` (línea ~132) por:

```tsx
    const ids = [
      ...new Set([...filas.map((c) => c.adopter_id), ...recentRequests.map((r) => r.adopter_id)]),
    ];
```

Justo después de construir `proximasCitas` (línea ~139), enriquece las solicitudes reutilizando el mismo mapa `nombres`:

```tsx
    recentRequests = recentRequests.map((r) => ({ ...r, adopterName: nombres.get(r.adopter_id) ?? null }));
```

Y cambia la declaración de estado (línea ~80) para que lleve el nombre:

```tsx
  let recentRequests: (RequestRow & { adopterName: string | null })[] = [];
```

- [ ] **Step 5: Reescribir el render del aside**

Necesitas las etiquetas de estado del namespace `solicitudesPanel`. Añade al principio de `PanelPage`, junto a los otros `getTranslations` (líneas ~60-62):

```tsx
  const ts = await getTranslations("solicitudesPanel");
```

Sustituye el `<ul>`/estado vacío del aside "Solicitudes recientes" (líneas ~349-367) por:

```tsx
              {recentRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noRequests")}</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {recentRequests.map((r) => (
                    <li key={r.id}>
                      <Link
                        href="/panel/solicitudes"
                        className="flex items-center justify-between gap-2 py-2.5 hover:opacity-80"
                      >
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-semibold">{r.animal?.name ?? "—"}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {`${r.adopterName ?? "—"} · ${FECHA_CORTA_MADRID.format(new Date(r.created_at))}`}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${CHIP_SOLICITUD[r.status]}`}
                        >
                          {ts(`status${capitaliza(r.status)}`)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
```

- [ ] **Step 6: Ejecutar el test y verificar que pasa**

Run: `npm run test -- src/app/(shelter)/panel/page.test.tsx -t "Solicitudes recientes muestra mascota"`
Expected: PASS

- [ ] **Step 7: Ejecutar toda la suite del panel + typecheck**

Run: `npm run test -- src/app/(shelter)/panel/page.test.tsx && npx tsc --noEmit`
Expected: PASS, sin errores de tipos.

- [ ] **Step 8: Commit**

```bash
git add src/app/(shelter)/panel/page.tsx src/app/(shelter)/panel/page.test.tsx
git commit -m "feat(panel): solicitudes recientes con adoptante, fecha y estado real"
```

---

### Task 2: "Tus animales" como rejilla de tarjetas con foto

Sustituye la lista plana "Animales recientes" (miniatura + nombre + badge en fila) por una rejilla de tarjetas: foto `aspect-square` con `AnimalStatusBadge` superpuesto, nombre + `raza · edad` debajo, y una tarjeta punteada final "Añadir nueva mascota".

**Files:**
- Modify: `src/app/(shelter)/panel/page.tsx`
- Modify: `messages/es.json`
- Test: `src/app/(shelter)/panel/page.test.tsx`

**Interfaces:**
- Consumes: `edadAproximada` de `@/lib/animal-search`, `AnimalStatusBadge` (ya importado), `getTranslations("busqueda")` para las etiquetas de edad. `AnimalRow` amplía su tipo con `breed: string | null; birth_date_approx: string | null`.
- Produces: nueva clave i18n `panel.addAnimalCard`.

- [ ] **Step 1: Añadir la clave i18n**

En `messages/es.json`, dentro del objeto `panel`, añade tras `noAnimalsYet`:

```json
    "addAnimalCard": "Añadir nueva mascota",
```

- [ ] **Step 2: Escribir el test que falla**

En `src/app/(shelter)/panel/page.test.tsx` añade:

```tsx
it("Tus animales pinta tarjetas con foto, badge de estado y tarjeta de añadir", async () => {
  state.animals = [
    animalPublicado(1, {
      breed: "Husky",
      birth_date_approx: "2021-01-01",
      status: "available",
      animal_media: [{ url: "https://x/f1.jpg", is_cover: true, sort_order: 0 }],
    }),
    animalPublicado(2, { breed: "Mestiza", birth_date_approx: null, status: "reserved" }),
  ];
  conIntl(await PanelPage());

  // El nombre en la tarjeta es texto (el alt del avatar de la stat-card no
  // cuenta como texto), así que closest("a") apunta al enlace de la ficha.
  expect(screen.getByText("Animal1").closest("a")).toHaveAttribute("href", "/panel/animales/a1");
  // Badge de estado presente (reserved → etiqueta de animales)
  expect(screen.getByText(messages.animales.statusReserved)).toBeInTheDocument();
  // Raza visible en el subtítulo
  expect(screen.getByText(/Husky/)).toBeInTheDocument();
  // Tarjeta de añadir
  expect(
    screen.getByRole("link", { name: messages.panel.addAnimalCard }),
  ).toHaveAttribute("href", "/panel/animales/nueva");
});
```

> Notas: (1) no se asertan las etiquetas de edad ("3 años") porque el mock de
> `getTranslations` del test no resuelve ICU plural; el subtítulo se valida solo
> por la raza. (2) Se consulta con `screen` directamente para evitar el choque
> con el alt del avatar en la stat-card "Perfiles activos".

- [ ] **Step 3: Ejecutar el test y verificar que falla**

Run: `npm run test -- src/app/(shelter)/panel/page.test.tsx -t "Tus animales pinta tarjetas"`
Expected: FAIL (no existe la tarjeta "Añadir nueva mascota" ni el enlace por nombre a la ficha; el subtítulo de raza no se pinta).

- [ ] **Step 4: Ampliar el tipo y la consulta de animales**

Añade el import junto a los helpers:

```tsx
import { edadAproximada } from "@/lib/animal-search";
```

Amplía `AnimalRow` (líneas ~18-26) con `breed` y `birth_date_approx`:

```tsx
type AnimalRow = {
  id: string;
  name: string;
  slug: string;
  status: AnimalStatus;
  breed: string | null;
  birth_date_approx: string | null;
  published_at: string | null;
  updated_at: string;
  animal_media: MediaRow[];
};
```

Amplía el `select` de la consulta de animales (línea ~86) para traer los campos nuevos:

```tsx
      .select(
        "id,name,slug,status,breed,birth_date_approx,published_at,updated_at,animal_media(url,is_cover,sort_order)",
      )
```

- [ ] **Step 5: Añadir la traducción de edad y reescribir el bloque "Tus animales"**

Añade junto a los otros `getTranslations` de `PanelPage`:

```tsx
  const tb = await getTranslations("busqueda");
```

Sustituye TODO el bloque "Animales recientes" (`<div className="rounded-2xl border ...">` de las líneas ~314-336) por la rejilla:

```tsx
              {/* Tus animales — rejilla de tarjetas */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-heading text-lg font-semibold">{t("recentAnimals")}</h2>
                  <Link href="/panel/animales" className="text-sm font-semibold text-tertiary hover:underline">
                    {t("viewAll")}
                  </Link>
                </div>
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {animals.slice(0, 5).map((a) => {
                    const edad = edadAproximada(a.birth_date_approx);
                    const subtitulo = [
                      a.breed,
                      edad ? tb(edad.unidad === "anios" ? "edadAnios" : "edadMeses", { n: edad.n }) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ");
                    return (
                      <li key={a.id}>
                        <Link
                          href={`/panel/animales/${a.id}`}
                          className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <span className="relative block aspect-square bg-muted">
                            <FotoAnimal url={portada(a.animal_media)} alt={a.name} />
                            <span className="absolute left-2 top-2">
                              <AnimalStatusBadge status={a.status} />
                            </span>
                          </span>
                          <span className="flex flex-col gap-0.5 p-3">
                            <span className="truncate font-heading font-semibold text-primary">{a.name}</span>
                            {subtitulo && (
                              <span className="truncate text-sm text-muted-foreground">{subtitulo}</span>
                            )}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                  <li>
                    <Link
                      href="/panel/animales/nueva"
                      className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <ImagePlus className="size-6" aria-hidden="true" />
                      {t("addAnimalCard")}
                    </Link>
                  </li>
                </ul>
              </div>
```

- [ ] **Step 6: Añadir el componente de foto y el icono**

Añade `ImagePlus` al import de `lucide-react` (línea 1), manteniendo el orden alfabético:

```tsx
import { ArrowRight, CalendarDays, CheckCircle2, ChevronRight, Clock, Heart, ImagePlus, PawPrint, Plus, Sprout } from "lucide-react";
```

Añade, junto a `Miniatura` (tras la función `Miniatura`, ~línea 404), el componente de foto cuadrada:

```tsx
function FotoAnimal({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <span className="flex size-full items-center justify-center text-muted-foreground">
        <PawPrint className="size-8" aria-hidden="true" />
      </span>
    );
  }
  return <Image src={url} alt={alt} fill sizes="(max-width: 640px) 50vw, 12rem" className="object-cover" />;
}
```

- [ ] **Step 7: Ejecutar el test y verificar que pasa**

Run: `npm run test -- src/app/(shelter)/panel/page.test.tsx -t "Tus animales pinta tarjetas"`
Expected: PASS

- [ ] **Step 8: Suite completa del panel + typecheck + lint**

Run: `npm run test -- src/app/(shelter)/panel/page.test.tsx && npx tsc --noEmit && npm run lint`
Expected: PASS en los tres.

- [ ] **Step 9: Commit**

```bash
git add src/app/(shelter)/panel/page.tsx src/app/(shelter)/panel/page.test.tsx messages/es.json
git commit -m "feat(panel): tus animales como rejilla de tarjetas con foto y estado"
```

---

## Self-Review

**Spec coverage:**
- "Tus animales" rejilla con foto + badge + raza·edad + tarjeta añadir → Task 2. ✔
- Solicitudes recientes enriquecidas (adoptante + fecha + chip) vía admin lookup → Task 1. ✔
- Layout 1fr/20rem sin cambios → ambas tareas conservan el grid existente. ✔
- Stat-cards sin cambios → no se tocan. ✔
- Próximas citas sin modalidad → no se toca ese bloque. ✔
- Descartes (banner, modalidad) → no se implementan. ✔
- i18n: `addAnimalCard` añadida; edad y estados reutilizan claves existentes. ✔
- Tests actualizados → ambas tareas. ✔

**Type consistency:**
- `RequestRow` amplía `status: EstadoSolicitud`, `adopter_id: string`; `recentRequests` enriquecido con `adopterName` (Task 1). ✔
- `AnimalRow` amplía `breed`, `birth_date_approx`; `edadAproximada` recibe `birth_date_approx` (Task 2). ✔
- `capitaliza` usada en el render coincide con la de `SolicitudesPanel` (misma firma). ✔
- `portada`, `AnimalStatusBadge`, `Image` ya existen en el fichero. ✔

**Placeholder scan:** sin TBD/TODO; todo el código a insertar está completo.
