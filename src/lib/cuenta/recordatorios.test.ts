import { describe, expect, it } from "vitest";
import { componerRecordatorios } from "./recordatorios";

const cita = (id: string, horas: number, extra: Record<string, unknown> = {}) => ({
  id,
  request_id: `r-${id}`,
  starts_at: new Date(Date.now() + horas * 3_600_000).toISOString(),
  animal: "Luna",
  protectora: "Refugio Uno",
  ...extra,
});

const solicitud = (id: string, status: string, extra: Record<string, unknown> = {}) => ({
  id,
  status,
  animal: "Bruno",
  ...extra,
});

const propuesta = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  animal: "Copito",
  protectora: "Refugio Dos",
  ...extra,
});

describe("componerRecordatorios", () => {
  it("devuelve lista vacía cuando no hay nada pendiente", () => {
    expect(componerRecordatorios({ citas: [], solicitudes: [], propuestas: [] })).toEqual([]);
  });

  it("incluye la próxima cita con su animal y protectora", () => {
    const [r] = componerRecordatorios({
      citas: [cita("c1", 20)],
      solicitudes: [],
      propuestas: [],
    });
    expect(r).toMatchObject({ tipo: "cita", id: "c1", animal: "Luna", protectora: "Refugio Uno" });
    expect(r.href).toBe("/mi-cuenta/citas");
  });

  it("ordena las citas de más próxima a más lejana", () => {
    const rs = componerRecordatorios({
      citas: [cita("lejana", 100), cita("cercana", 3)],
      solicitudes: [],
      propuestas: [],
    });
    expect(rs.map((r) => r.id)).toEqual(["cercana", "lejana"]);
  });

  it("pide reservar visita cuando una solicitud aprobada no tiene cita", () => {
    const [r] = componerRecordatorios({
      citas: [],
      solicitudes: [solicitud("s1", "approved")],
      propuestas: [],
    });
    expect(r).toMatchObject({ tipo: "reservar", id: "s1", animal: "Bruno" });
    expect(r.href).toBe("/mi-cuenta/citas/nueva/s1");
  });

  it("no pide reservar visita si esa solicitud ya tiene cita", () => {
    const rs = componerRecordatorios({
      citas: [{ ...cita("c1", 20), request_id: "s1" }],
      solicitudes: [solicitud("s1", "approved")],
      propuestas: [],
    });
    expect(rs.filter((r) => r.tipo === "reservar")).toEqual([]);
  });

  it("ignora las solicitudes que no están aprobadas", () => {
    const rs = componerRecordatorios({
      citas: [],
      solicitudes: [solicitud("s1", "pending"), solicitud("s2", "rejected")],
      propuestas: [],
    });
    expect(rs).toEqual([]);
  });

  it("incluye las propuestas de acogida pendientes de responder", () => {
    const [r] = componerRecordatorios({
      citas: [],
      solicitudes: [],
      propuestas: [propuesta("p1")],
    });
    expect(r).toMatchObject({ tipo: "acogida", id: "p1", animal: "Copito", protectora: "Refugio Dos" });
    expect(r.href).toBe("/mi-cuenta/acogida");
  });

  it("prioriza citas, luego reservas y por último acogida", () => {
    const rs = componerRecordatorios({
      citas: [cita("c1", 5)],
      solicitudes: [solicitud("s1", "approved")],
      propuestas: [propuesta("p1")],
    });
    expect(rs.map((r) => r.tipo)).toEqual(["cita", "reservar", "acogida"]);
  });

  it("recorta la lista a un máximo de tres recordatorios", () => {
    const rs = componerRecordatorios({
      citas: [cita("c1", 5), cita("c2", 8), cita("c3", 10)],
      solicitudes: [solicitud("s1", "approved")],
      propuestas: [propuesta("p1")],
    });
    expect(rs).toHaveLength(3);
  });
});
