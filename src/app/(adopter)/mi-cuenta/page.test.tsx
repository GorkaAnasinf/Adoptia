import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/es.json";
import MiCuentaPage from "./page";

const state = vi.hoisted(() => ({
  user: { id: "u1", user_metadata: { full_name: "Elena García" } } as Record<string, unknown> | null,
  favorites: [] as Array<Record<string, unknown>>,
  requests: [] as Array<Record<string, unknown>>,
  appointments: [] as Array<Record<string, unknown>>,
  savedSearches: [] as Array<Record<string, unknown>>,
  fosterHome: null as Record<string, unknown> | null,
  proposals: [] as Array<Record<string, unknown>>,
  donations: [] as Array<Record<string, unknown>>,
  animals: [] as Array<Record<string, unknown>>,
  usoAdmin: false,
}));

const redirigido = vi.hoisted(() => ({ a: null as string | null }));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    redirigido.a = url;
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("next-intl/server", () => ({
  getFormatter: vi.fn(async () => ({
    dateTime: (fecha: Date, opciones: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat("es-ES", { ...opciones, timeZone: "Europe/Madrid" }).format(fecha),
  })),
  getTranslations: vi.fn(async (ns: string) => (key: string, vars?: Record<string, unknown>) => {
    const obj = (messages as unknown as Record<string, Record<string, string>>)[ns];
    let s = obj?.[key] ?? `${ns}.${key}`;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
    return s;
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => {
    state.usoAdmin = true;
    throw new Error("el dashboard del adoptante no debe usar el cliente admin");
  }),
}));

vi.mock("@/lib/supabase/server", () => {
  const datos: Record<string, () => unknown> = {
    favorites: () => ({ data: state.favorites }),
    adoption_requests: () => ({ data: state.requests }),
    appointments: () => ({ data: state.appointments }),
    saved_searches: () => ({ data: state.savedSearches }),
    foster_proposals: () => ({ data: state.proposals }),
    donation_offers: () => ({ data: state.donations }),
    animals: () => ({ data: state.animals }),
  };
  const builder = (table: string) => {
    // Los `.eq()` se aplican de verdad sobre las filas que los traen: así un
    // filtro que la página olvide (p. ej. el destinatario de una propuesta)
    // hace fallar el test en vez de pasar desapercibido.
    const filtros: [string, unknown][] = [];
    const b: Record<string, unknown> = {};
    for (const m of ["select", "neq", "in", "gte", "lt", "not", "order", "limit"]) {
      b[m] = () => b;
    }
    b.eq = (columna: string, valor: unknown) => {
      filtros.push([columna, valor]);
      return b;
    };
    b.maybeSingle = async () => ({ data: table === "foster_homes" ? state.fosterHome : null });
    b.then = (resolve: (v: unknown) => void) => {
      const bruto = (datos[table]?.() ?? { data: [] }) as { data: Array<Record<string, unknown>> };
      const data = (bruto.data ?? []).filter((fila) =>
        filtros.every(([col, val]) => !(col in fila) || fila[col] === val),
      );
      resolve({ data });
    };
    return b;
  };
  return {
    createClient: vi.fn(async () => ({
      auth: { getUser: vi.fn(async () => ({ data: { user: state.user } })) },
      from: vi.fn((table: string) => builder(table)),
    })),
  };
});

function conIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages} timeZone="Europe/Madrid">
      {ui}
    </NextIntlClientProvider>,
  );
}

const animal = (nombre: string, extra: Record<string, unknown> = {}) => ({
  name: nombre,
  slug: nombre.toLowerCase(),
  status: "available",
  published_at: "2026-01-01T00:00:00.000Z",
  animal_media: [{ url: `https://ejemplo.test/${nombre}.jpg`, is_cover: true, sort_order: 0 }],
  shelters: { name: "Refugio Uno" },
  ...extra,
});

const solicitud = (id: string, status: string, nombre: string, extra: Record<string, unknown> = {}) => ({
  id,
  status,
  created_at: "2026-07-01T10:00:00.000Z",
  animals: animal(nombre),
  ...extra,
});

describe("MiCuentaPage — dashboard del adoptante", () => {
  vi.setSystemTime(new Date("2026-07-20T10:00:00Z"));
  afterAll(() => vi.useRealTimers());

  beforeEach(() => {
    state.user = { id: "u1", user_metadata: { full_name: "Elena García" } };
    state.favorites = [];
    state.requests = [];
    state.appointments = [];
    state.savedSearches = [];
    state.fosterHome = null;
    state.proposals = [];
    state.donations = [];
    state.animals = [];
    state.usoAdmin = false;
    redirigido.a = null;
  });

  it("redirige a login si no hay sesión", async () => {
    state.user = null;
    await expect(MiCuentaPage()).rejects.toThrow("REDIRECT:/login");
    expect(redirigido.a).toBe("/login");
  });

  it("saluda por el nombre del usuario", async () => {
    conIntl(await MiCuentaPage());
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("¡Hola, Elena García!");
  });

  it("saluda sin nombre cuando el perfil no lo tiene, sin enseñar el correo", async () => {
    state.user = { id: "u1", email: "elena@ejemplo.test", user_metadata: {} };
    conIntl(await MiCuentaPage());
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("¡Hola!");
    expect(h1).not.toHaveTextContent("elena@ejemplo.test");
  });

  it("muestra primeros pasos y ninguna métrica cuando no hay actividad", async () => {
    conIntl(await MiCuentaPage());
    expect(screen.getByText(messages.account.primerosPasosTitulo)).toBeInTheDocument();
    expect(screen.queryByText(messages.account.metricaFavoritos)).not.toBeInTheDocument();
  });

  it("no da por vacío a quien ayuda por otras vías aunque no tenga favoritos ni solicitudes", async () => {
    state.fosterHome = { user_id: "u1", active: true };
    state.savedSearches = [{ id: "b1" }];
    conIntl(await MiCuentaPage());
    expect(screen.queryByText(messages.account.primerosPasosTitulo)).not.toBeInTheDocument();
    expect(screen.getByText(messages.account.aportacionAcogida)).toBeInTheDocument();
  });

  it("solo cuenta como recordatorio la propuesta de acogida dirigida al usuario", async () => {
    state.requests = [solicitud("s1", "pending", "Bruno")];
    state.proposals = [
      { id: "p1", foster_user_id: "u1", animals: { name: "Copito" }, shelters: { name: "Refugio Dos" } },
      // Enviada por una protectora del propio usuario: RLS se la deja leer,
      // pero él no es el destinatario y no debe salirle como recordatorio.
      { id: "p2", foster_user_id: "otro", animals: { name: "Nala" }, shelters: { name: "Refugio Tres" } },
    ];
    conIntl(await MiCuentaPage());
    expect(screen.getByText(/Copito/)).toBeInTheDocument();
    expect(screen.queryByText(/Nala/)).not.toBeInTheDocument();
  });

  it("cuenta favoritos, solicitudes en curso y citas próximas", async () => {
    state.favorites = [
      { animal_id: "a1", animals: animal("Copito") },
      { animal_id: "a2", animals: animal("Sombra") },
    ];
    state.requests = [
      solicitud("s1", "pending", "Bruno"),
      solicitud("s2", "approved", "Luna"),
      solicitud("s3", "rejected", "Nube"),
    ];
    state.appointments = [
      {
        id: "c1",
        request_id: "s2",
        starts_at: "2026-07-22T16:30:00.000Z",
        adoption_requests: { animals: { name: "Luna", shelters: { name: "Refugio Uno" } } },
      },
    ];
    conIntl(await MiCuentaPage());

    const favoritos = screen.getByText(messages.account.metricaFavoritos).closest("a");
    expect(favoritos).toHaveTextContent("2");
    expect(favoritos).toHaveAttribute("href", "/mi-cuenta/favoritos");
    // pending + approved cuentan como "en curso"; la rechazada no
    expect(screen.getByText(messages.account.metricaSolicitudes).closest("a")).toHaveTextContent("2");
    expect(screen.getByText(messages.account.metricaCitas).closest("a")).toHaveTextContent("1");
  });

  it("lista las solicitudes recientes con el chip de su estado real", async () => {
    state.requests = [solicitud("s1", "pending", "Bruno"), solicitud("s2", "approved", "Luna")];
    conIntl(await MiCuentaPage());
    expect(screen.getByText("Bruno")).toBeInTheDocument();
    expect(screen.getByText(messages.account.statusPending)).toBeInTheDocument();
    expect(screen.getByText(messages.account.statusApproved)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: messages.account.verTodas })).toHaveAttribute(
      "href",
      "/mi-cuenta/solicitudes",
    );
  });

  it("aguanta una solicitud cuyo animal ya no está publicado", async () => {
    state.requests = [solicitud("s1", "pending", "Bruno", { animals: null })];
    conIntl(await MiCuentaPage());
    expect(screen.getByText(messages.account.solicitudAnimalNoDisponible)).toBeInTheDocument();
  });

  it("enseña hasta tres favoritos y el acceso a explorar", async () => {
    state.favorites = ["Copito", "Sombra", "Milo", "Nala"].map((n, i) => ({
      animal_id: `a${i}`,
      animals: animal(n),
    }));
    conIntl(await MiCuentaPage());
    expect(screen.getByText("Copito")).toBeInTheDocument();
    expect(screen.queryByText("Nala")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: messages.account.favoritosExplorar })).toHaveAttribute(
      "href",
      "/animales",
    );
  });

  it("cae al marcador de huella cuando el favorito no tiene foto válida", async () => {
    state.favorites = [
      { animal_id: "a1", animals: { ...animal("Copito"), animal_media: [] } },
      { animal_id: "a2", animals: { ...animal("Sombra"), animal_media: [{ url: "", is_cover: true, sort_order: 0 }] } },
    ];
    conIntl(await MiCuentaPage());
    // Ninguna imagen rota: los dos favoritos se pintan sin <img>
    expect(screen.queryAllByRole("img")).toHaveLength(0);
    expect(screen.getByText("Copito")).toBeInTheDocument();
    expect(screen.getByText("Sombra")).toBeInTheDocument();
  });

  it("recuerda reservar la visita de una solicitud aprobada sin cita", async () => {
    state.requests = [solicitud("s1", "approved", "Bruno")];
    conIntl(await MiCuentaPage());
    expect(screen.getByRole("link", { name: /Reserva tu visita/ })).toHaveAttribute(
      "href",
      "/mi-cuenta/citas/nueva/s1",
    );
  });

  it("destaca al animal publicado que más lleva esperando, saltándose los favoritos", async () => {
    state.favorites = [{ animal_id: "a1", animals: animal("Copito") }];
    state.animals = [
      { ...animal("Copito"), id: "a1", published_at: "2025-01-01T00:00:00.000Z" },
      { ...animal("Koda"), id: "a2", published_at: "2025-06-01T00:00:00.000Z" },
    ];
    conIntl(await MiCuentaPage());
    expect(screen.getByRole("link", { name: /Conocer a Koda/ })).toBeInTheDocument();
  });

  it("resume la aportación real del usuario", async () => {
    state.requests = [solicitud("s1", "pending", "Bruno")];
    state.donations = [{ id: "d1" }];
    state.fosterHome = { user_id: "u1", active: true };
    state.savedSearches = [{ id: "b1" }, { id: "b2" }];
    conIntl(await MiCuentaPage());
    expect(screen.getByText("1 ofrecimiento de donación activo")).toBeInTheDocument();
    expect(screen.getByText(messages.account.aportacionAcogida)).toBeInTheDocument();
    expect(screen.getByText("2 alertas activas")).toBeInTheDocument();
  });

  it("no usa el cliente admin: todo se lee con la sesión del usuario bajo RLS", async () => {
    state.requests = [solicitud("s1", "pending", "Bruno")];
    conIntl(await MiCuentaPage());
    expect(state.usoAdmin).toBe(false);
  });
});
