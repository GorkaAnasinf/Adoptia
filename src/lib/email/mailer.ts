import "server-only";
import nodemailer from "nodemailer";

/**
 * Email transaccional por SMTP de Gmail + plantillas HTML propias (Decisión #22:
 * Resend descartado por exigir dominio verificado). Solo desde el servidor.
 */
export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  /** Permite responder a un tercero que cedió su correo (FEATURE-022). */
  replyTo?: string;
};

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error("Faltan variables SMTP (SMTP_HOST / SMTP_USER / SMTP_PASS).");
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function enviarEmail({ to, subject, html, replyTo }: EmailPayload) {
  const from = process.env.MAIL_FROM || "Adoptia <no-reply@adoptia.example>";
  const transport = getTransport();
  await transport.sendMail({ from, to, subject, html, replyTo });
}
