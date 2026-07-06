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
