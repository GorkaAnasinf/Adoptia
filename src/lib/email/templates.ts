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
