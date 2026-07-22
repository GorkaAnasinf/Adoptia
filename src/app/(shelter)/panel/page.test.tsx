import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../../../messages/es.json";
import PanelPage from "./page";

const state = vi.hoisted(() => ({
  shelter: { id: "s1", name: "Refugio Uno", status: "verified", verification_note: null, description: "x" } as
    | Record<string, unknown>
    | null,
  animals: [] as Array<Record<string, unknown>>,
  pendingCount: 0,
  count7: 0, // solicitudes creadas en los últimos 7 días
  countPrev7: 0, // solicitudes creadas entre hace 14 y hace 7 días
  requests: [] as Array<Record<string, unknown>>,
  citas: [] as Array<Record<string, unknown>>,
  perfiles: [] as Array<Record<string, unknown>>,
}));

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async (ns: string) => (key: string, vars?: Record<string, unknown>) => {
    const obj = (messages as unknown as Record<string, Record<string, string>>)[ns];
    let s = obj?.[key] ?? `${ns}.${key}`;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
    return s;
  }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: () => ({ in: async () => ({ data: state.perfiles }) }),
    })),
  })),
}));

vi.mock("@/lib/supabase/server", () => {
  // Builder encadenable que registra qué filtros se han aplicado para
  // distinguir las tres consultas de recuento sobre adoption_requests.
  const builder = (table: string) => {
    const flags = { gte: false, lt: false, head: false };
    const b: Record<string, unknown> = {};
    for (const m of ["select", "eq", "order", "limit", "in"]) {
      b[m] = (...args: unknown[]) => {
        if (m === "select" && typeof args[1] === "object" && args[1] !== null) {
          flags.head = Boolean((args[1] as { head?: boolean }).head);
        }
        return b;
      };
    }
    b.gte = () => ((flags.gte = true), b);
    b.lt = () => ((flags.lt = true), b);
    b.then = (resolve: (v: unknown) => void) => {
      if (table === "animals") return resolve({ data: state.animals });
      if (table === "appointments") return resolve({ data: state.citas });
      if (table === "adoption_requests" && flags.head) {
        if (flags.lt) return resolve({ count: state.countPrev7 });
        if (flags.gte) return resolve({ count: state.count7 });
        return resolve({ count: state.pendingCount });
      }
      return resolve({ data: state.requests });
    };
    return b;
  };
  return {
    createClient: vi.fn(async () => ({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })) },
      from: vi.fn((table: string) => {
        if (table === "shelters") {
          return {
            select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.shelter }) }) }),
          };
        }
        return builder(table);
      }),
    })),
  };
});

function conIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="es" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  );
}

/** Cita futura hoy/mañana con animal y adoptante para las pruebas. */
function cita(horasDesdeAhora: number, extra: Record<string, unknown> = {}) {
  const inicio = new Date(Date.now() + horasDesdeAhora * 3_600_000);
  const fin = new Date(inicio.getTime() + 45 * 60_000);
  return {
    id: `c${horasDesdeAhora}`,
    starts_at: inicio.toISOString(),
    ends_at: fin.toISOString(),
    adopter_id: "adopter1",
    adoption_requests: { animals: { name: "Luna", breed: "Podenco" } },
    ...extra,
  };
}

const animalPublicado = (n: number, extra: Record<string, unknown> = {}) => ({
  id: `a${n}`,
  name: `Animal${n}`,
  slug: `animal${n}`,
  status: "available",
  published_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  animal_media: [],
  ...extra,
});

describe("PanelPage — dashboard rediseñado", () => {
  // Hora fija a mediodía de Madrid: las citas relativas (+1h, +2h) caen
  // siempre en "hoy" y las de +30h en otro día, sin flaquear a medianoche.
  vi.setSystemTime(new Date("2026-07-15T10:00:00Z"));
  afterAll(() => vi.useRealTimers());

  beforeEach(() => {
    state.shelter = { id: "s1", name: "Refugio Uno", status: "verified", verification_note: null, description: "x" };
    state.animals = [];
    state.pendingCount = 0;
    state.count7 = 0;
    state.countPrev7 = 0;
    state.requests = [];
    state.citas = [];
    state.perfiles = [{ id: "adopter1", full_name: "Familia Martínez" }];
  });

  it("protectora nueva (sin animales) ve los primeros pasos, no las tarjetas", async () => {
    conIntl(await PanelPage());
    expect(screen.getByText(messages.panel.firstStepsTitle)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: messages.panel.addAnimal }),
    ).toHaveAttribute("href", "/panel/animales/nueva");
    expect(screen.queryByText(messages.panel.statPending)).not.toBeInTheDocument();
  });

  it("la tarjeta de solicitudes muestra el número pendiente y la subida semanal", async () => {
    state.animals = [animalPublicado(1)];
    state.pendingCount = 24;
    state.count7 = 28;
    state.countPrev7 = 25; // (28-25)/25 = +12%
    conIntl(await PanelPage());

    const tarjeta = screen.getByText(messages.panel.statPending).closest("a")!;
    expect(within(tarjeta).getByText("24")).toBeInTheDocument();
    expect(within(tarjeta).getByText("+12% desde la última semana")).toBeInTheDocument();
    expect(tarjeta).toHaveAttribute("href", "/panel/solicitudes");
  });

  it("la tarjeta de solicitudes muestra la bajada semanal", async () => {
    state.animals = [animalPublicado(1)];
    state.pendingCount = 3;
    state.count7 = 4;
    state.countPrev7 = 5; // (4-5)/5 = -20%
    conIntl(await PanelPage());
    expect(screen.getByText("-20% desde la última semana")).toBeInTheDocument();
  });

  it("sin histórico de la semana anterior no muestra delta", async () => {
    state.animals = [animalPublicado(1)];
    state.pendingCount = 2;
    state.count7 = 2;
    state.countPrev7 = 0;
    conIntl(await PanelPage());
    expect(screen.queryByText(/desde la última semana/)).not.toBeInTheDocument();
  });

  it("la tarjeta de citas de hoy cuenta solo las de hoy y anuncia la próxima hora", async () => {
    state.animals = [animalPublicado(1)];
    state.citas = [cita(1), cita(2), cita(30)]; // 2 hoy (aprox) + 1 otro día
    conIntl(await PanelPage());

    const tarjeta = screen.getByText(messages.panel.statCitasHoy).closest("a")!;
    // La próxima es la primera de hoy: su hora aparece en el subtítulo
    const horaProxima = new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Madrid",
    }).format(new Date(state.citas[0].starts_at as string));
    expect(within(tarjeta).getByText(`Próxima a las ${horaProxima}`)).toBeInTheDocument();
    expect(tarjeta).toHaveAttribute("href", "/panel/citas");
  });

  it("sin citas hoy la tarjeta lo dice", async () => {
    state.animals = [animalPublicado(1)];
    state.citas = [cita(30)];
    conIntl(await PanelPage());
    expect(screen.getByText(messages.panel.statCitasNinguna)).toBeInTheDocument();
  });

  it("la tarjeta de perfiles activos cuenta publicados disponibles y apila avatares con +N", async () => {
    state.animals = [
      animalPublicado(1, { animal_media: [{ url: "https://x/f1.jpg", is_cover: true, sort_order: 0 }] }),
      animalPublicado(2),
      animalPublicado(3),
      animalPublicado(4),
      animalPublicado(5),
      animalPublicado(6),
      animalPublicado(7, { status: "adopted" }), // adoptado NO cuenta como activo
      animalPublicado(8, { published_at: null }), // borrador NO cuenta
    ];
    conIntl(await PanelPage());

    const tarjeta = screen.getByText(messages.panel.statActiveProfiles).closest("a")!;
    expect(within(tarjeta).getByText("6")).toBeInTheDocument();
    expect(within(tarjeta).getByText("+2")).toBeInTheDocument(); // 6 activos - 4 avatares
    expect(tarjeta).toHaveAttribute("href", "/panel/animales");
  });

  it("Próximas Citas lista adoptante - animal (raza) con franja horaria y enlace al calendario", async () => {
    state.animals = [animalPublicado(1)];
    state.citas = [cita(1)];
    conIntl(await PanelPage());

    expect(screen.getByText("Familia Martínez - Luna (Podenco)")).toBeInTheDocument();
    const fmt = new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Madrid",
    });
    const franja = `${fmt.format(new Date(state.citas[0].starts_at as string))} - ${fmt.format(
      new Date(state.citas[0].ends_at as string),
    )}`;
    expect(screen.getByText(franja)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: messages.panel.viewCalendar }),
    ).toHaveAttribute("href", "/panel/citas");
  });

  it("sin citas próximas muestra el estado vacío", async () => {
    state.animals = [animalPublicado(1)];
    conIntl(await PanelPage());
    expect(screen.getByText(messages.citas.dashboardEmpty)).toBeInTheDocument();
  });

  it("en estado pending muestra el enlace para editar el alta", async () => {
    state.shelter = { id: "s1", name: "Refugio Uno", status: "pending", verification_note: null, description: null };
    conIntl(await PanelPage());
    expect(
      screen.getByRole("link", { name: messages.onboarding.bannerPendingEdit }),
    ).toHaveAttribute("href", "/panel/alta");
  });

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

    // Cabeceras de la tabla (layout wireframe: Adoptante | Mascota | Fecha | Estado).
    expect(screen.getByRole("columnheader", { name: messages.panel.colAdopter })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: messages.panel.colAnimal })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: messages.panel.colDate })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: messages.panel.colStatus })).toBeInTheDocument();
    // Sin citas en este test, así que "Familia Martínez" solo aparece en la tabla.
    expect(screen.getByText("Bruno")).toBeInTheDocument();
    expect(screen.getByText(/Familia Martínez/)).toBeInTheDocument();
    expect(screen.getByText(messages.solicitudesPanel.statusApproved)).toBeInTheDocument();
  });

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
});
