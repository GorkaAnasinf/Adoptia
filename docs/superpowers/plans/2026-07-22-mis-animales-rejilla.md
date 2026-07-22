# Rediseño "Mis animales" (rejilla + acciones) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir `/panel/animales` de tabla a rejilla de tarjetas con búsqueda/filtros instantáneos (cliente) y acciones a nivel de lista (publicar/despublicar/eliminar) vía una nueva API.

**Architecture:** La página servidor carga todos los animales y monta un client component `AnimalesGrid` (búsqueda + filtros + tarjetas + menú de acciones). Las acciones llaman a un nuevo Route Handler `/api/animales/[id]` que opera bajo la sesión del usuario (RLS `animals_owner_write` restringe a los animales de su protectora) y reutiliza `validarPublicacion` para el gate de publicación.

**Tech Stack:** Next.js 15 App Router (RSC + client), TypeScript, Supabase (server client, RLS), zod, Tailwind + shadcn (`Input`, `Button`), next-intl, lucide-react, Vitest + Testing Library.

## Global Constraints

- Textos de UI SIEMPRE en `messages/es.json` (namespace `animales` salvo edad, que usa `busqueda.edadAnios/edadMeses`). Nunca hardcodeados.
- Sin cambios de esquema de BD. Imágenes vía `next/image`.
- Autorización: la API usa el cliente con sesión (`@/lib/supabase/server`); RLS restringe la propiedad. Publicar exige además protectora **verificada** (`shelters.status === "verified"`) y ficha válida (`validarPublicacion`).
- Forma de error de la API: `{ error: { code, message } }` con status HTTP; éxito `{ ok: true }`.
- Descartado del pantallazo: chip "Urgentes" y badge "Caso urgente" (no hay campo de urgencia en `animals`).
- TDD: test que falla antes del código.

---

### Task 1: API `/api/animales/[id]` (publicar/despublicar/eliminar)

**Files:**
- Modify: `src/lib/schemas/animal.ts` (añadir `accionAnimalSchema`)
- Create: `src/app/api/animales/[id]/route.ts`
- Test: `src/app/api/animales/[id]/route.test.ts`

**Interfaces:**
- Consumes: `validarPublicacion(data, photoCount)` de `@/lib/schemas/animal` (ya existe; `{ ok, errores }`), `createClient` de `@/lib/supabase/server`.
- Produces: `PATCH(req, { params })` y `DELETE(req, { params })`; `accionAnimalSchema` = `z.object({ accion: z.enum(["publish","unpublish"]) })`.

- [ ] **Step 1: Escribir el test que falla**

Crear `src/app/api/animales/[id]/route.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, state } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  state: {
    // animal completo y publicable por defecto
    animal: {
      id: "a1",
      name: "Luna",
      species: "dog",
      sex: "female",
      size: "medium",
      description: "Perra dulce y sociable.",
      published_at: null,
      shelters: { status: "verified" },
      animal_media: [{ type: "photo" }],
    } as Record<string, unknown> | null,
    lastUpdate: null as Record<string, unknown> | null,
    deleted: false,
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.animal }) }) }),
      update: (payload: Record<string, unknown>) => ({
        eq: () => ({ select: () => ({ maybeSingle: async () => {
          state.lastUpdate = payload;
          return { data: state.animal ? { id: "a1" } : null };
        } }) }),
      }),
      delete: () => ({
        eq: () => ({ select: () => ({ maybeSingle: async () => {
          state.deleted = true;
          return { data: state.animal ? { id: "a1" } : null };
        } }) }),
      }),
    }),
  })),
}));

import { DELETE, PATCH } from "./route";

function patchReq(body: unknown) {
  return new Request("http://localhost/api/animales/a1", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}
const params = { params: Promise.resolve({ id: "a1" }) };

describe("/api/animales/[id]", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "u1" } } });
    state.animal = {
      id: "a1", name: "Luna", species: "dog", sex: "female", size: "medium",
      description: "Perra dulce y sociable.", published_at: null,
      shelters: { status: "verified" }, animal_media: [{ type: "photo" }],
    };
    state.lastUpdate = null;
    state.deleted = false;
  });

  it("401 sin sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await PATCH(patchReq({ accion: "unpublish" }), params);
    expect(res.status).toBe(401);
  });

  it("400 con body inválido", async () => {
    const res = await PATCH(patchReq({ accion: "nope" }), params);
    expect(res.status).toBe(400);
  });

  it("PATCH unpublish pone published_at a null", async () => {
    state.animal!.published_at = "2026-01-01";
    const res = await PATCH(patchReq({ accion: "unpublish" }), params);
    expect(res.status).toBe(200);
    expect(state.lastUpdate).toMatchObject({ published_at: null });
  });

  it("PATCH publish con protectora no verificada → 403", async () => {
    state.animal!.shelters = { status: "pending" };
    const res = await PATCH(patchReq({ accion: "publish" }), params);
    expect(res.status).toBe(403);
    expect(state.lastUpdate).toBeNull();
  });

  it("PATCH publish con ficha incompleta (sin foto) → 422", async () => {
    state.animal!.animal_media = [];
    const res = await PATCH(patchReq({ accion: "publish" }), params);
    expect(res.status).toBe(422);
    expect(state.lastUpdate).toBeNull();
  });

  it("PATCH publish válido pone published_at no nulo", async () => {
    const res = await PATCH(patchReq({ accion: "publish" }), params);
    expect(res.status).toBe(200);
    expect(state.lastUpdate!.published_at).not.toBeNull();
  });

  it("404 si el animal no existe / no es suyo", async () => {
    state.animal = null;
    const res = await PATCH(patchReq({ accion: "unpublish" }), params);
    expect(res.status).toBe(404);
  });

  it("DELETE borra el animal", async () => {
    const res = await DELETE(new Request("http://localhost/api/animales/a1", { method: "DELETE" }), params);
    expect(res.status).toBe(200);
    expect(state.deleted).toBe(true);
  });
});
```

- [ ] **Step 2: Ejecutar el test y verificar que falla**

Run: `npm run test -- "src/app/api/animales/[id]/route.test.ts"`
Expected: FAIL (no existe `./route`).

- [ ] **Step 3: Añadir el schema de acción**

En `src/lib/schemas/animal.ts`, tras `animalPublishSchema` (y antes de `validarPublicacion` o junto a los demás exports), añade:

```ts
export const accionAnimalSchema = z.object({
  accion: z.enum(["publish", "unpublish"]),
});
```

- [ ] **Step 4: Escribir el Route Handler**

Crear `src/app/api/animales/[id]/route.ts`:

```ts
import { accionAnimalSchema, validarPublicacion } from "@/lib/schemas/animal";
import { createClient } from "@/lib/supabase/server";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

type AnimalRow = {
  id: string;
  name: string;
  species: string | null;
  sex: string | null;
  size: string | null;
  description: string | null;
  published_at: string | null;
  shelters: { status: string } | null;
  animal_media: { type: string | null }[] | null;
};

async function cargarAnimal(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, animal: null as AnimalRow | null };
  const { data } = await supabase
    .from("animals")
    .select("id, name, species, sex, size, description, published_at, shelters(status), animal_media(type)")
    .eq("id", id)
    .maybeSingle();
  return { supabase, user, animal: (data as unknown as AnimalRow | null) };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = accionAnimalSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: { code: "validation", message: "Acción inválida" } }, 400);
  }
  const { accion } = parsed.data;

  const { supabase, user, animal } = await cargarAnimal(id);
  if (!user) return json({ error: { code: "unauthorized", message: "Inicia sesión" } }, 401);
  if (!animal) return json({ error: { code: "not_found", message: "Animal no encontrado" } }, 404);

  if (accion === "publish") {
    if (animal.shelters?.status !== "verified") {
      return json({ error: { code: "forbidden", message: "Tu protectora aún no está verificada" } }, 403);
    }
    const numFotos = (animal.animal_media ?? []).filter((m) => (m.type ?? "photo") === "photo").length;
    const { ok } = validarPublicacion(animal, numFotos);
    if (!ok) {
      return json({ error: { code: "incomplete", message: "La ficha no está lista para publicar" } }, 422);
    }
  }

  const published_at = accion === "publish" ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from("animals")
    .update({ published_at })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return json({ error: { code: "db_error", message: error.message } }, 500);
  if (!data) return json({ error: { code: "not_found", message: "Animal no encontrado" } }, 404);
  return json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: { code: "unauthorized", message: "Inicia sesión" } }, 401);

  const { data, error } = await supabase
    .from("animals")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return json({ error: { code: "db_error", message: error.message } }, 500);
  if (!data) return json({ error: { code: "not_found", message: "Animal no encontrado" } }, 404);
  return json({ ok: true });
}
```

- [ ] **Step 5: Ejecutar el test y verificar que pasa**

Run: `npm run test -- "src/app/api/animales/[id]/route.test.ts"`
Expected: PASS (8/8).

- [ ] **Step 6: Typecheck + commit**

Run: `npx tsc --noEmit`
Expected: sin errores.

```bash
git add "src/lib/schemas/animal.ts" "src/app/api/animales/[id]/route.ts" "src/app/api/animales/[id]/route.test.ts"
git commit -m "feat(api): acciones de animal a nivel de lista (publicar/despublicar/eliminar)"
```

---

### Task 2: Client component `AnimalesGrid` (búsqueda + filtros + tarjetas + menú)

**Files:**
- Create: `src/components/panel/AnimalesGrid.tsx`
- Modify: `messages/es.json` (namespace `animales`)
- Test: `src/components/panel/AnimalesGrid.test.tsx`

**Interfaces:**
- Consumes: `AnimalStatusBadge` (prop `onImage`), `edadAproximada` de `@/lib/animal-search`, `ESTADOS`/`AnimalStatus` de `@/lib/schemas/animal`, `Input` de `@/components/ui/input`. Llama a `PATCH`/`DELETE` de `/api/animales/[id]` (Task 1).
- Produces: `AnimalesGrid({ animales, shelterVerified })` con `export type AnimalGridRow`.

- [ ] **Step 1: Añadir las claves i18n**

En `messages/es.json`, dentro del objeto `animales`, añade (junto a las claves existentes):

```json
    "searchPlaceholder": "Buscar por nombre o raza…",
    "searchEmpty": "No hay animales que coincidan con la búsqueda.",
    "viewProfile": "Ver ficha",
    "newAnimalCard": "Nueva mascota",
    "newAnimalCardHelp": "Haz clic para añadir un nuevo animal al refugio.",
    "menuLabel": "Acciones",
    "publish": "Publicar",
    "unpublish": "Despublicar",
    "delete": "Eliminar",
    "deleteConfirm": "¿Eliminar a {name}? Esta acción no se puede deshacer.",
    "publishIncomplete": "Completa la ficha para publicar.",
    "actionError": "No se pudo completar la acción.",
```

- [ ] **Step 2: Escribir el test que falla**

Crear `src/components/panel/AnimalesGrid.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../messages/es.json";
import { AnimalesGrid, type AnimalGridRow } from "./AnimalesGrid";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: refreshMock, push: vi.fn() }) }));

function conIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

const base: AnimalGridRow = {
  id: "a1", name: "Luna", slug: "luna-x", sex: "female",
  breed: "Podenco", birth_date_approx: null, status: "available",
  published_at: "2026-01-01", animal_media: [],
};
const rocky: AnimalGridRow = {
  id: "a2", name: "Rocky", slug: "rocky-x", sex: "male",
  breed: "Mestizo", birth_date_approx: null, status: "adopted",
  published_at: null, animal_media: [],
};

describe("AnimalesGrid", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200 })));
    vi.stubGlobal("confirm", vi.fn(() => true));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("la búsqueda filtra por nombre", () => {
    conIntl(<AnimalesGrid animales={[base, rocky]} shelterVerified />);
    fireEvent.change(screen.getByPlaceholderText(messages.animales.searchPlaceholder), {
      target: { value: "luna" },
    });
    expect(screen.getByText("Luna")).toBeInTheDocument();
    expect(screen.queryByText("Rocky")).not.toBeInTheDocument();
  });

  it("la búsqueda filtra por raza", () => {
    conIntl(<AnimalesGrid animales={[base, rocky]} shelterVerified />);
    fireEvent.change(screen.getByPlaceholderText(messages.animales.searchPlaceholder), {
      target: { value: "mestizo" },
    });
    expect(screen.getByText("Rocky")).toBeInTheDocument();
    expect(screen.queryByText("Luna")).not.toBeInTheDocument();
  });

  it("el chip de estado filtra (solo adoptados)", () => {
    conIntl(<AnimalesGrid animales={[base, rocky]} shelterVerified />);
    fireEvent.click(screen.getByRole("button", { name: messages.animales.statusAdopted }));
    expect(screen.getByText("Rocky")).toBeInTheDocument();
    expect(screen.queryByText("Luna")).not.toBeInTheDocument();
  });

  it("el borrador muestra 'Borrador' y no ofrece 'Ver ficha'", () => {
    conIntl(<AnimalesGrid animales={[rocky]} shelterVerified />);
    expect(screen.getByText(messages.animales.draft)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: messages.animales.viewProfile })).not.toBeInTheDocument();
  });

  it("el publicado ofrece 'Ver ficha' hacia el perfil público", () => {
    conIntl(<AnimalesGrid animales={[base]} shelterVerified />);
    expect(screen.getByRole("link", { name: messages.animales.viewProfile })).toHaveAttribute(
      "href",
      "/animales/luna-x",
    );
  });

  it("Eliminar pide confirmación y llama a la API con DELETE", async () => {
    conIntl(<AnimalesGrid animales={[base]} shelterVerified />);
    fireEvent.click(screen.getByRole("button", { name: messages.animales.menuLabel }));
    fireEvent.click(screen.getByRole("button", { name: messages.animales.delete }));
    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/animales/a1", expect.objectContaining({ method: "DELETE" })));
    expect(refreshMock).toHaveBeenCalled();
  });

  it("la tarjeta 'Nueva mascota' enlaza al alta", () => {
    conIntl(<AnimalesGrid animales={[base]} shelterVerified />);
    expect(screen.getByRole("link", { name: messages.animales.newAnimalCard })).toHaveAttribute(
      "href",
      "/panel/animales/nueva",
    );
  });
});
```

- [ ] **Step 3: Ejecutar el test y verificar que falla**

Run: `npm run test -- "src/components/panel/AnimalesGrid.test.tsx"`
Expected: FAIL (no existe el componente).

- [ ] **Step 4: Escribir el componente**

Crear `src/components/panel/AnimalesGrid.tsx`:

```tsx
"use client";

import { ExternalLink, MoreVertical, PawPrint, Pencil, Plus, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AnimalStatusBadge } from "@/components/animals/AnimalStatusBadge";
import { Input } from "@/components/ui/input";
import { edadAproximada } from "@/lib/animal-search";
import { ESTADOS, type AnimalStatus } from "@/lib/schemas/animal";
import { cn } from "@/lib/utils";

type Media = { url: string; is_cover: boolean; sort_order: number };
export type AnimalGridRow = {
  id: string;
  name: string;
  slug: string;
  sex: "male" | "female" | "unknown";
  breed: string | null;
  birth_date_approx: string | null;
  status: AnimalStatus;
  published_at: string | null;
  animal_media: Media[];
};

function portada(media: Media[]): string | null {
  if (!media || media.length === 0) return null;
  return (media.find((m) => m.is_cover) ?? [...media].sort((a, b) => a.sort_order - b.sort_order)[0]).url;
}

function normaliza(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function AnimalesGrid({
  animales,
  shelterVerified,
}: {
  animales: AnimalGridRow[];
  shelterVerified: boolean;
}) {
  const t = useTranslations("animales");
  const tb = useTranslations("busqueda");
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<AnimalStatus | "all">("all");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<{ id: string; msg: string } | null>(null);

  const filtrados = useMemo(() => {
    const term = normaliza(q.trim());
    return animales.filter(
      (a) =>
        (filtro === "all" || a.status === filtro) &&
        (term === "" || normaliza(a.name).includes(term) || normaliza(a.breed ?? "").includes(term)),
    );
  }, [animales, q, filtro]);

  async function ejecutar(a: AnimalGridRow, init: RequestInit) {
    setBusyId(a.id);
    setErrorId(null);
    setMenuId(null);
    try {
      const res = await fetch(`/api/animales/${a.id}`, init);
      if (!res.ok) {
        setErrorId({ id: a.id, msg: res.status === 422 ? t("publishIncomplete") : t("actionError") });
        return;
      }
      router.refresh();
    } catch {
      setErrorId({ id: a.id, msg: t("actionError") });
    } finally {
      setBusyId(null);
    }
  }

  function cambiarVisibilidad(a: AnimalGridRow, accion: "publish" | "unpublish") {
    void ejecutar(a, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accion }),
    });
  }

  function eliminar(a: AnimalGridRow) {
    if (window.confirm(t("deleteConfirm", { name: a.name }))) {
      void ejecutar(a, { method: "DELETE" });
    }
  }

  const chips: Array<AnimalStatus | "all"> = ["all", ...ESTADOS];

  return (
    <div className="mt-6">
      {/* Buscador */}
      <div className="relative max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="rounded-full pl-9"
        />
      </div>

      {/* Filtros de estado */}
      <nav className="mt-4 flex flex-wrap gap-2" aria-label={t("colStatus")}>
        {chips.map((key) => {
          const activo = filtro === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={activo}
              onClick={() => setFiltro(key)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                activo
                  ? "border-tertiary/40 bg-tertiary/12 text-tertiary"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {key === "all" ? t("filterAll") : t(`status${key.charAt(0).toUpperCase()}${key.slice(1)}`)}
            </button>
          );
        })}
      </nav>

      {filtrados.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">{t("searchEmpty")}</p>
      )}

      <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {filtrados.map((a) => {
          const edad = edadAproximada(a.birth_date_approx);
          const subtitulo = [
            a.breed,
            edad ? tb(edad.unidad === "anios" ? "edadAnios" : "edadMeses", { n: edad.n }) : null,
          ]
            .filter(Boolean)
            .join(" · ");
          const publicado = a.published_at != null;
          const foto = portada(a.animal_media);
          return (
            <li
              key={a.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            >
              <div className="relative aspect-square bg-muted">
                {foto ? (
                  <Image src={foto} alt="" fill sizes="(max-width: 640px) 50vw, 12rem" className="object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-muted-foreground">
                    <PawPrint className="size-8" aria-hidden="true" />
                  </span>
                )}
                <span className="absolute left-2 top-2">
                  <AnimalStatusBadge status={a.status} onImage />
                </span>
                {!publicado && (
                  <span className="absolute right-2 top-2 rounded-full bg-stone-700/90 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
                    {t("draft")}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-heading font-semibold text-primary">{a.name}</p>
                    {subtitulo && <p className="truncate text-sm text-muted-foreground">{subtitulo}</p>}
                  </div>
                  {/* Menú de acciones */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      aria-label={t("menuLabel")}
                      aria-haspopup="menu"
                      aria-expanded={menuId === a.id}
                      disabled={busyId === a.id}
                      onClick={() => setMenuId(menuId === a.id ? null : a.id)}
                      className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <MoreVertical className="size-4" aria-hidden="true" />
                    </button>
                    {menuId === a.id && (
                      <>
                        <button
                          type="button"
                          aria-hidden="true"
                          tabIndex={-1}
                          className="fixed inset-0 z-10 cursor-default"
                          onClick={() => setMenuId(null)}
                        />
                        <div
                          role="menu"
                          className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-popover py-1 shadow-md"
                        >
                          {publicado ? (
                            <MenuItem onClick={() => cambiarVisibilidad(a, "unpublish")}>{t("unpublish")}</MenuItem>
                          ) : (
                            <MenuItem
                              disabled={!shelterVerified}
                              onClick={() => cambiarVisibilidad(a, "publish")}
                            >
                              {t("publish")}
                            </MenuItem>
                          )}
                          <MenuItem destructive onClick={() => eliminar(a)}>
                            {t("delete")}
                          </MenuItem>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {errorId?.id === a.id && <p className="text-xs text-destructive">{errorId.msg}</p>}

                <div className="mt-auto flex items-center gap-3 pt-1 text-sm font-semibold">
                  <Link
                    href={`/panel/animales/${a.id}`}
                    className="inline-flex items-center gap-1 text-tertiary hover:underline"
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    {t("edit")}
                  </Link>
                  {publicado && (
                    <Link
                      href={`/animales/${a.slug}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {t("viewProfile")}
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}

        {/* Nueva mascota */}
        <li>
          <Link
            href="/panel/animales/nueva"
            className="flex h-full min-h-56 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border p-4 text-center text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Plus className="size-7" aria-hidden="true" />
            <span className="font-heading font-semibold">{t("newAnimalCard")}</span>
            <span className="text-xs">{t("newAnimalCardHelp")}</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  destructive = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50",
        destructive && "text-destructive hover:bg-destructive/10",
      )}
    >
      {children}
    </button>
  );
}
```

> Nota: si `@/components/ui` exporta un token distinto de `bg-popover`, usa `bg-card`. Verifica que la clase exista en el tema; si no, sustitúyela por `bg-card` (no bloquees por esto).

- [ ] **Step 5: Ejecutar el test y verificar que pasa**

Run: `npm run test -- "src/components/panel/AnimalesGrid.test.tsx"`
Expected: PASS (7/7).

- [ ] **Step 6: Typecheck + lint + commit**

Run: `npx tsc --noEmit && npx eslint "src/components/panel/AnimalesGrid.tsx"`
Expected: sin errores.

```bash
git add "src/components/panel/AnimalesGrid.tsx" "src/components/panel/AnimalesGrid.test.tsx" messages/es.json
git commit -m "feat(panel): rejilla de animales con búsqueda, filtros y menú de acciones"
```

---

### Task 3: Conectar la página `animales/page.tsx` a la rejilla

**Files:**
- Modify: `src/app/(shelter)/panel/animales/page.tsx`
- Test: `src/app/(shelter)/panel/animales/page.test.tsx`

**Interfaces:**
- Consumes: `AnimalesGrid` + `AnimalGridRow` de `@/components/panel/AnimalesGrid` (Task 2).
- Produces: la página deja de aceptar/usar `searchParams`; carga todos los animales (con `sex, breed, birth_date_approx`) y monta la rejilla; mantiene el estado vacío server-side y los avisos de moderación.

- [ ] **Step 1: Actualizar el test de la página**

En `src/app/(shelter)/panel/animales/page.test.tsx`:

1. Añade el mock de `next/navigation` (la rejilla usa `useRouter`) tras los otros `vi.mock`:

```tsx
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
```

2. Cambia el mock de `shelters` para que devuelva también `status`:

```tsx
        if (table === "shelters") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.shelter }) }) }),
          };
        }
```
y en el estado y `beforeEach`, usa `shelter: { id: "s1", status: "verified" }`:

```tsx
  shelter: { id: "s1", status: "verified" } as { id: string; status: string } | null,
```
```tsx
    state.shelter = { id: "s1", status: "verified" };
```

3. Sustituye las dos llamadas `await AnimalesPage({ searchParams: Promise.resolve({}) })` por `await AnimalesPage()`.

4. Sustituye el segundo test ("lista los animales…") por uno que compruebe el render de la rejilla (la tarjeta con nombre, el enlace de edición por id, el chip de borrador y la tarjeta "Nueva mascota"):

```tsx
  it("monta la rejilla con las tarjetas de los animales", async () => {
    state.animals = [
      { id: "a1", name: "Luna", slug: "luna-x", species: "dog", sex: "female", breed: "Podenco",
        birth_date_approx: null, status: "available", published_at: "2026-01-01", moderation_note: null, animal_media: [] },
      { id: "a2", name: "Rocky", slug: "rocky-x", species: "cat", sex: "male", breed: null,
        birth_date_approx: null, status: "reserved", published_at: null, moderation_note: null, animal_media: [] },
    ];
    conIntl(await AnimalesPage());

    expect(screen.getByText("Luna")).toBeInTheDocument();
    expect(screen.getByText("Rocky")).toBeInTheDocument();
    const editar = screen.getAllByRole("link", { name: messages.animales.edit });
    expect(editar[0]).toHaveAttribute("href", "/panel/animales/a1");
    expect(screen.getByText(messages.animales.draft)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: messages.animales.newAnimalCard })).toHaveAttribute(
      "href",
      "/panel/animales/nueva",
    );
  });
```

(El primer test, "muestra el estado vacío con CTA cuando no hay animales", se mantiene igual salvo el cambio a `await AnimalesPage()`.)

- [ ] **Step 2: Ejecutar el test y verificar que falla**

Run: `npm run test -- "src/app/(shelter)/panel/animales/page.test.tsx"`
Expected: FAIL (la página aún renderiza la tabla; no hay "Nueva mascota" ni monta la rejilla).

- [ ] **Step 3: Reescribir la página**

Sustituye por completo el contenido de `src/app/(shelter)/panel/animales/page.tsx` por:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PawPrint, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AnimalesGrid, type AnimalGridRow } from "@/components/panel/AnimalesGrid";
import type { AnimalStatus } from "@/lib/schemas/animal";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("animales");
  return { title: t("title") };
}

type Row = AnimalGridRow & { species: string; moderation_note: string | null };

export default async function AnimalesPage() {
  const t = await getTranslations("animales");
  const tm = await getTranslations("moderacion");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: shelter } = user
    ? await supabase.from("shelters").select("id, status").eq("owner_id", user.id).maybeSingle()
    : { data: null };

  let animales: Row[] = [];
  if (shelter) {
    const { data } = await supabase
      .from("animals")
      .select(
        "id,name,slug,species,sex,breed,birth_date_approx,status,published_at,moderation_note,animal_media(url,is_cover,sort_order)",
      )
      .eq("shelter_id", shelter.id)
      .order("updated_at", { ascending: false });
    animales = (data as Row[] | null) ?? [];
  }
  const shelterVerified = (shelter as { status?: string } | null)?.status === "verified";

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link
          href="/panel/animales/nueva"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("new")}
        </Link>
      </header>

      {/* Aviso de moderación (FEATURE-011): fichas despublicadas por un admin */}
      {animales
        .filter((a) => a.moderation_note)
        .map((a) => (
          <p
            key={`mod-${a.id}`}
            className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            <strong>{a.name}:</strong> {tm("avisoFichaModerada", { motivo: a.moderation_note ?? "" })}
          </p>
        ))}

      {animales.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border py-16 text-center">
          <PawPrint className="size-10 text-muted-foreground/60" aria-hidden="true" />
          <p className="text-muted-foreground">{t("empty")}</p>
          <Link
            href="/panel/animales/nueva"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden="true" />
            {t("emptyCta")}
          </Link>
        </div>
      ) : (
        <AnimalesGrid animales={animales as AnimalGridRow[]} shelterVerified={shelterVerified} />
      )}
    </section>
  );
}
```

Nota: `Row` amplía `AnimalGridRow` con `species` y `moderation_note` (usados solo en el servidor para el aviso); el cast a `AnimalGridRow[]` al pasar a la rejilla es seguro porque `AnimalGridRow` es un subconjunto.

- [ ] **Step 4: Ejecutar el test y verificar que pasa**

Run: `npm run test -- "src/app/(shelter)/panel/animales/page.test.tsx"`
Expected: PASS.

- [ ] **Step 5: Suite completa + typecheck + lint**

Run: `npm run test && npx tsc --noEmit && npm run lint`
Expected: PASS en los tres (lint puede mostrar el warning preexistente `_fila` en `DonacionForm.test.tsx`, ajeno a esta tarea).

- [ ] **Step 6: Commit**

```bash
git add "src/app/(shelter)/panel/animales/page.tsx" "src/app/(shelter)/panel/animales/page.test.tsx"
git commit -m "feat(panel): 'Mis animales' pasa a rejilla de tarjetas con acciones"
```

---

## Self-Review

**Spec coverage:**
- Rejilla de tarjetas + "Nueva mascota" → Task 2/3. ✔
- Búsqueda por nombre/raza + filtros de estado (cliente) → Task 2. ✔
- Tarjeta: foto + `AnimalStatusBadge onImage` + "Borrador" + sexo + `raza·edad` + Editar/Ver ficha + menú ⋮ → Task 2. ✔
- Menú: publicar (verificada + ficha válida vía API 422) / despublicar / eliminar (confirm) → Task 1 (API) + Task 2 (UI). ✔
- API `/api/animales/[id]` PATCH/DELETE con RLS + gate de verificación + `validarPublicacion` → Task 1. ✔
- "Ver ficha" solo si publicado → Task 2 (`publicado &&`). ✔
- Página carga todos los campos + `shelterVerified` + mantiene moderación y vacío → Task 3. ✔
- Descarte "Urgentes"/"Caso urgente" → no se implementa. ✔
- i18n nuevas claves → Task 2 Step 1. ✔

**Type consistency:**
- `accionAnimalSchema` (Task 1) = `{ accion: "publish"|"unpublish" }`, consumido por el body PATCH del grid (Task 2) y validado por la API (Task 1). ✔
- `AnimalGridRow` (Task 2) es subconjunto de `Row` (Task 3); cast seguro. ✔
- `AnimalStatusBadge onImage` ya existe (feature previa). ✔
- La API carga `shelters(status)` y `animal_media(type)`; `validarPublicacion(animal, numFotos)` recibe el row (claves de una palabra `name/species/sex/size/description` coinciden con `animalPublishSchema`; el resto se descarta al no ser `.strict()`). ✔

**Placeholder scan:** sin TBD/TODO; todo el código está completo. La única nota condicional (`bg-popover` → `bg-card`) es una verificación de token, no un placeholder de lógica.
