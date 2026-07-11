/**
 * Plantillas HTML de email en español, tono cálido. Sin dependencias de React
 * para poder enviarse desde cualquier handler de servidor.
 */

const BASE = (contenido: string) => `
<div style="font-family:'Open Sans',Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1d1b17;background:#fef8f0;border-radius:16px">
  <h1 style="font-family:Montserrat,Arial,sans-serif;color:#9f402d;font-size:22px;margin:0 0 16px">Adoptia</h1>
  ${contenido}
  <p style="margin-top:24px;font-size:12px;color:#6b6b6b">Hecho con cariño por y para las protectoras.</p>
</div>`;

export function plantillaVerificada({ shelterName }: { shelterName: string }) {
  return {
    subject: `¡${shelterName} ya está verificada en Adoptia!`,
    html: BASE(`
      <p>¡Buenas noticias! Hemos verificado <strong>${shelterName}</strong>.</p>
      <p>Tu protectora ya es <strong>pública</strong>: aparecerá en el mapa y en las búsquedas,
      y podrás publicar tus animales en adopción.</p>
      <p><a href="https://adoptia-eight.vercel.app/panel" style="color:#396662">Ir a mi panel</a></p>
    `),
  };
}

export function plantillaSolicitudRecibida({
  shelterName,
  animalName,
}: {
  shelterName: string;
  animalName: string;
}) {
  return {
    subject: `Nueva solicitud de adopción para ${animalName}`,
    html: BASE(`
      <p>Hola <strong>${shelterName}</strong>,</p>
      <p>Has recibido una nueva solicitud de adopción para <strong>${animalName}</strong>.</p>
      <p>Entra en tu bandeja de solicitudes para ver el cuestionario completo y decidir.</p>
      <p><a href="https://adoptia-eight.vercel.app/panel/solicitudes" style="color:#396662">Ver solicitud</a></p>
    `),
  };
}

export function plantillaSolicitudResuelta({
  adopterName,
  animalName,
  resultado,
  motivo,
}: {
  adopterName: string;
  animalName: string;
  resultado: "approved" | "rejected";
  motivo?: string;
}) {
  if (resultado === "approved") {
    return {
      subject: `¡Tu solicitud para ${animalName} ha sido aprobada!`,
      html: BASE(`
        <p>Hola ${adopterName},</p>
        <p>¡Buenas noticias! La protectora ha <strong>aprobado</strong> tu solicitud de adopción de
        <strong>${animalName}</strong>. Se pondrán en contacto contigo para dar los siguientes pasos.</p>
      `),
    };
  }
  return {
    subject: `Novedades sobre tu solicitud para ${animalName}`,
    html: BASE(`
      <p>Hola ${adopterName},</p>
      <p>Gracias por tu interés en <strong>${animalName}</strong>. Por ahora, la protectora no ha podido
      seguir adelante con tu solicitud.</p>
      ${motivo ? `<p><strong>Motivo:</strong> ${motivo}</p>` : ""}
      <p>No te desanimes: hay muchos otros peludos esperando un hogar como el tuyo.
      <a href="https://adoptia-eight.vercel.app/animales" style="color:#396662">Sigue buscando en Adoptia</a>.</p>
    `),
  };
}

export function plantillaSolicitudCerradaPorAdopcion({
  adopterName,
  animalName,
  animalesSimilares = [],
}: {
  adopterName: string;
  animalName: string;
  animalesSimilares?: { name: string; slug: string }[];
}) {
  const seccionSimilares = animalesSimilares.length
    ? `
      <p style="margin-top:20px"><strong>Puede que te interese conocer a:</strong></p>
      <ul style="padding-left:20px">
        ${animalesSimilares
          .map(
            (a) =>
              `<li><a href="https://adoptia-eight.vercel.app/animales/${a.slug}" style="color:#396662">${a.name}</a></li>`,
          )
          .join("")}
      </ul>`
    : "";
  return {
    subject: `${animalName} ya ha encontrado hogar`,
    html: BASE(`
      <p>Hola ${adopterName},</p>
      <p><strong>${animalName}</strong> ya ha sido adoptado/a por otra familia, así que la protectora ha
      cerrado tu solicitud. Sentimos no poder darte mejores noticias esta vez.</p>
      <p>Hay muchos otros animales esperando un hogar como el tuyo:
      <a href="https://adoptia-eight.vercel.app/animales" style="color:#396662">sigue buscando en Adoptia</a>.</p>
      ${seccionSimilares}
    `),
  };
}

export function plantillaRechazada({
  shelterName,
  motivo,
}: {
  shelterName: string;
  motivo: string;
}) {
  return {
    subject: `Revisión de ${shelterName} en Adoptia`,
    html: BASE(`
      <p>Hemos revisado el alta de <strong>${shelterName}</strong> y, por ahora, no podemos verificarla.</p>
      <p><strong>Motivo:</strong> ${motivo}</p>
      <p>Puedes corregir los datos desde tu panel y volver a enviarla. Si crees que es un error,
      responde a este correo y lo revisamos.</p>
    `),
  };
}

// ---------- FEATURE-009: citas ----------

/** Fecha de cita legible en español peninsular (Europe/Madrid). */
export function formatearFechaCita(fecha: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(fecha);
}

export function plantillaCitaReservadaAdoptante({
  adopterName,
  animalName,
  shelterName,
  fecha,
}: {
  adopterName: string;
  animalName: string;
  shelterName: string;
  fecha: Date;
}) {
  return {
    subject: `Cita confirmada para conocer a ${animalName}`,
    html: BASE(`
      <p>Hola ${adopterName},</p>
      <p>Tu cita para conocer a <strong>${animalName}</strong> con <strong>${shelterName}</strong>
      queda confirmada:</p>
      <p style="font-size:18px"><strong>${formatearFechaCita(fecha)}</strong></p>
      <p>Si no puedes acudir, cancela la cita desde tu cuenta con la mayor antelación posible.</p>
      <p><a href="https://adoptia-eight.vercel.app/mi-cuenta/solicitudes" style="color:#396662">Ver mis solicitudes y citas</a></p>
    `),
  };
}

export function plantillaCitaReservadaProtectora({
  shelterName,
  animalName,
  fecha,
}: {
  shelterName: string;
  animalName: string;
  fecha: Date;
}) {
  return {
    subject: `Nueva cita para ${animalName}`,
    html: BASE(`
      <p>Hola <strong>${shelterName}</strong>,</p>
      <p>Un adoptante ha reservado cita para conocer a <strong>${animalName}</strong>:</p>
      <p style="font-size:18px"><strong>${formatearFechaCita(fecha)}</strong></p>
      <p><a href="https://adoptia-eight.vercel.app/panel/citas" style="color:#396662">Ver mi agenda</a></p>
    `),
  };
}

export function plantillaCitaCancelada({
  nombre,
  animalName,
  fecha,
  motivo,
  canceladaPorProtectora,
}: {
  nombre: string;
  animalName: string;
  fecha: Date;
  motivo: string;
  canceladaPorProtectora: boolean;
}) {
  const quien = canceladaPorProtectora ? "La protectora" : "El adoptante";
  return {
    subject: `Cita cancelada — ${animalName}`,
    html: BASE(`
      <p>Hola ${nombre},</p>
      <p>${quien} ha cancelado la cita para conocer a <strong>${animalName}</strong>
      (${formatearFechaCita(fecha)}).</p>
      <p><strong>Motivo:</strong> ${motivo}</p>
      <p>Podéis acordar una nueva fecha cuando queráis.</p>
    `),
  };
}

export function plantillaCitaRecordatorio({
  nombre,
  animalName,
  fecha,
}: {
  nombre: string;
  animalName: string;
  fecha: Date;
}) {
  return {
    subject: `Recordatorio: mañana tienes cita por ${animalName}`,
    html: BASE(`
      <p>Hola ${nombre},</p>
      <p>Te recordamos la cita para conocer a <strong>${animalName}</strong>:</p>
      <p style="font-size:18px"><strong>${formatearFechaCita(fecha)}</strong></p>
      <p>Si no puedes acudir, cancela la cita cuanto antes para liberar el hueco.</p>
    `),
  };
}

// ---------- FEATURE-010: alertas y favoritos ----------

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adoptia-eight.vercel.app";

export function plantillaAlertaAnimales({
  nombre,
  secciones,
}: {
  nombre: string;
  secciones: {
    searchName: string;
    unsubscribeToken: string;
    animales: { name: string; slug: string }[];
  }[];
}) {
  const total = secciones.reduce((n, s) => n + s.animales.length, 0);
  const bloques = secciones
    .map(
      (s) => `
      <h2 style="font-family:Montserrat,Arial,sans-serif;font-size:16px;margin:16px 0 4px">${s.searchName}</h2>
      <ul style="margin:4px 0;padding-left:18px">
        ${s.animales
          .map((a) => `<li><a href="${SITE}/animales/${a.slug}" style="color:#396662">${a.name}</a></li>`)
          .join("")}
      </ul>
      <p style="font-size:12px;color:#6b6b6b;margin:4px 0 0">
        <a href="${SITE}/alertas/baja?token=${s.unsubscribeToken}" style="color:#6b6b6b">Darme de baja de esta alerta</a>
      </p>`,
    )
    .join("");
  return {
    subject: `${total === 1 ? "Un nuevo peludo encaja" : `${total} nuevos peludos encajan`} con tu búsqueda`,
    html: BASE(`
      <p>Hola ${nombre},</p>
      <p>Hay animales recién publicados que encajan con lo que buscas:</p>
      ${bloques}
    `),
  };
}

export function plantillaFavoritoAdoptado({
  nombre,
  animales,
}: {
  nombre: string;
  animales: { name: string; slug: string }[];
}) {
  return {
    subject:
      animales.length === 1
        ? `${animales[0].name} ya ha encontrado hogar 🧡`
        : "Algunos de tus favoritos ya han encontrado hogar 🧡",
    html: BASE(`
      <p>Hola ${nombre},</p>
      <p>Te avisamos de que ${animales.length === 1 ? "uno de tus favoritos ha sido adoptado" : "algunos de tus favoritos han sido adoptados"}:</p>
      <ul style="margin:4px 0;padding-left:18px">
        ${animales.map((a) => `<li><a href="${SITE}/animales/${a.slug}" style="color:#396662">${a.name}</a></li>`).join("")}
      </ul>
      <p>¡Buenas noticias para ellos! Hay muchos más esperando:
      <a href="${SITE}/animales" style="color:#396662">sigue buscando en Adoptia</a>.</p>
    `),
  };
}

// ---------- FEATURE-011: moderación ----------

const CONTACTO = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hola@adoptia.app";

export function plantillaFichaDespublicada({
  shelterName,
  animalName,
  motivo,
}: {
  shelterName: string;
  animalName: string;
  motivo: string;
}) {
  return {
    subject: `La ficha de ${animalName} se ha despublicado`,
    html: BASE(`
      <p>Hola <strong>${shelterName}</strong>,</p>
      <p>Nuestro equipo de moderación ha despublicado temporalmente la ficha de
      <strong>${animalName}</strong>.</p>
      <p><strong>Motivo:</strong> ${motivo}</p>
      <p>Puedes corregir la ficha desde tu panel. Si crees que es un error,
      escríbenos a <a href="mailto:${CONTACTO}" style="color:#396662">${CONTACTO}</a>
      y lo revisamos.</p>
    `),
  };
}

// ---------- FEATURE-016: casas de acogida ----------

export function plantillaContactoAcogida({
  fosterName,
  shelterName,
  shelterEmail,
  shelterPhone,
}: {
  fosterName: string;
  shelterName: string;
  shelterEmail: string | null;
  shelterPhone: string | null;
}) {
  const contacto = [
    shelterEmail ? `<li>Email: <a href="mailto:${shelterEmail}" style="color:#396662">${shelterEmail}</a></li>` : "",
    shelterPhone ? `<li>Teléfono: ${shelterPhone}</li>` : "",
  ].join("");
  return {
    subject: `${shelterName} busca casa de acogida y ha pensado en ti`,
    html: BASE(`
      <p>Hola ${fosterName},</p>
      <p>La protectora <strong>${shelterName}</strong> ha visto tu registro de casa de acogida
      y le encajas para una acogida temporal.</p>
      <p>Si te viene bien, ponte en contacto con ellos:</p>
      <ul style="margin:4px 0;padding-left:18px">${contacto}</ul>
      <p>Tus datos de contacto <strong>no</strong> se han compartido: eres tú quien decide responder.
      Si ahora no puedes acoger, puedes pausar tu disponibilidad desde
      <a href="https://adoptia-eight.vercel.app/acogida" style="color:#396662">tu registro de acogida</a>.</p>
    `),
  };
}
