import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendMailMock, createTransportMock } = vi.hoisted(() => {
  const sendMailMock = vi.fn();
  return {
    sendMailMock,
    createTransportMock: vi.fn(() => ({ sendMail: sendMailMock })),
  };
});

vi.mock("nodemailer", () => ({
  default: { createTransport: createTransportMock },
}));

import { enviarEmail } from "./mailer";
import {
  plantillaContactoDonacion,
  plantillaRechazada,
  plantillaSolicitudCerradaPorAdopcion,
  plantillaSolicitudRecibida,
  plantillaSolicitudResuelta,
  plantillaVerificada,
} from "./templates";

describe("enviarEmail", () => {
  beforeEach(() => {
    sendMailMock.mockReset().mockResolvedValue({ messageId: "1" });
    createTransportMock.mockClear();
    vi.stubEnv("SMTP_HOST", "smtp.gmail.com");
    vi.stubEnv("SMTP_PORT", "465");
    vi.stubEnv("SMTP_USER", "adoptia@gmail.com");
    vi.stubEnv("SMTP_PASS", "app-password");
    vi.stubEnv("MAIL_FROM", "Adoptia <adoptia@gmail.com>");
  });

  it("envía por SMTP con remitente, destinatario, asunto y html", async () => {
    await enviarEmail({ to: "gestor@refugio.org", subject: "Hola", html: "<p>Hola</p>" });
    expect(sendMailMock).toHaveBeenCalledOnce();
    const arg = sendMailMock.mock.calls[0][0];
    expect(arg.from).toBe("Adoptia <adoptia@gmail.com>");
    expect(arg.to).toBe("gestor@refugio.org");
    expect(arg.subject).toBe("Hola");
    expect(arg.html).toContain("Hola");
  });

  it("usa remitente por defecto y puerto 465 si faltan opcionales", async () => {
    vi.stubEnv("MAIL_FROM", "");
    vi.stubEnv("SMTP_PORT", "");
    await enviarEmail({ to: "x@y.z", subject: "S", html: "H" });
    const opciones = (createTransportMock.mock.calls[0] as unknown[])[0] as {
      secure: boolean;
    };
    expect(opciones.secure).toBe(true);
    expect(sendMailMock.mock.calls[0][0].from).toContain("Adoptia");
  });

  it("lanza si faltan credenciales SMTP", async () => {
    vi.stubEnv("SMTP_HOST", "");
    await expect(enviarEmail({ to: "x@y.z", subject: "S", html: "H" })).rejects.toThrow(/SMTP/);
  });
});

describe("plantillas de verificación", () => {
  it("verificada: menciona el nombre y confirma en español", () => {
    const { subject, html } = plantillaVerificada({ shelterName: "Refugio Esperanza" });
    expect(subject.toLowerCase()).toContain("verificada");
    expect(html).toContain("Refugio Esperanza");
    expect(html.toLowerCase()).toContain("pública");
  });

  it("rechazada: incluye el motivo del rechazo", () => {
    const { subject, html } = plantillaRechazada({
      shelterName: "Refugio Esperanza",
      motivo: "El CIF no coincide con el registro",
    });
    expect(subject.toLowerCase()).toMatch(/revis|rechaz/);
    expect(html).toContain("Refugio Esperanza");
    expect(html).toContain("El CIF no coincide con el registro");
  });
});

describe("plantillas de solicitudes (FEATURE-007)", () => {
  it("solicitud recibida: avisa a la protectora con el nombre del animal", () => {
    const { subject, html } = plantillaSolicitudRecibida({
      shelterName: "Refugio Esperanza",
      animalName: "Pipa",
    });
    expect(subject).toContain("Pipa");
    expect(html).toContain("Refugio Esperanza");
    expect(html).toContain("Pipa");
  });

  it("solicitud aprobada: tono positivo para el adoptante", () => {
    const { subject, html } = plantillaSolicitudResuelta({
      adopterName: "Marta",
      animalName: "Pipa",
      resultado: "approved",
    });
    expect(subject.toLowerCase()).toContain("aprobada");
    expect(html).toContain("Marta");
    expect(html.toLowerCase()).toContain("aprobado");
  });

  it("solicitud rechazada: incluye el motivo y sugiere seguir buscando", () => {
    const { html } = plantillaSolicitudResuelta({
      adopterName: "Marta",
      animalName: "Pipa",
      resultado: "rejected",
      motivo: "Ya tenemos otra familia elegida",
    });
    expect(html).toContain("Ya tenemos otra familia elegida");
    expect(html.toLowerCase()).toContain("adoptia");
  });

  it("solicitud rechazada sin motivo explícito no revienta", () => {
    const { html } = plantillaSolicitudResuelta({
      adopterName: "Marta",
      animalName: "Pipa",
      resultado: "rejected",
    });
    expect(html).toContain("Marta");
  });

  it("cierre por adopción: mensaje amable al resto de solicitantes", () => {
    const { subject, html } = plantillaSolicitudCerradaPorAdopcion({
      adopterName: "Juan",
      animalName: "Pipa",
    });
    expect(subject).toContain("Pipa");
    expect(html).toContain("Juan");
    expect(html.toLowerCase()).toContain("adoptado");
  });

  it("cierre por adopción: sugiere animales similares disponibles con enlace a su ficha", () => {
    const { html } = plantillaSolicitudCerradaPorAdopcion({
      adopterName: "Juan",
      animalName: "Pipa",
      animalesSimilares: [
        { name: "Rocky", slug: "rocky" },
        { name: "Luna", slug: "luna" },
      ],
    });
    expect(html).toContain("Rocky");
    expect(html).toContain("/animales/rocky");
    expect(html).toContain("Luna");
    expect(html).toContain("/animales/luna");
  });

  it("cierre por adopción: sin animales similares no revienta ni muestra la sección", () => {
    const { html } = plantillaSolicitudCerradaPorAdopcion({
      adopterName: "Juan",
      animalName: "Pipa",
      animalesSimilares: [],
    });
    expect(html).toContain("Juan");
  });
});

describe("plantilla de contacto de donación (FEATURE-032)", () => {
  it("el email al donante lleva la protectora, su contacto y el mensaje escapado", () => {
    const { subject, html } = plantillaContactoDonacion({
      donanteNombre: "Dani",
      shelterName: "Refugio Esperanza",
      shelterEmail: "refugio@test.com",
      shelterPhone: "600111222",
      descripcion: "Dos sacos de pienso",
      mensaje: "Nos viene genial <script>alert(1)</script>",
    });
    expect(subject).toContain("Refugio Esperanza");
    expect(html).toContain("Dani");
    expect(html).toContain("Dos sacos de pienso");
    expect(html).toContain("refugio@test.com");
    expect(html).toContain("600111222");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("sin teléfono ni nombre del donante no revienta", () => {
    const { html } = plantillaContactoDonacion({
      donanteNombre: null,
      shelterName: "Refugio",
      shelterEmail: null,
      shelterPhone: null,
      descripcion: "Mantas",
      mensaje: "Hola, nos interesan las mantas",
    });
    expect(html).toContain("Mantas");
  });
});
