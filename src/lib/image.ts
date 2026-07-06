import imageCompression from "browser-image-compression";

/** Tamaño máximo de logo tras compresión (Decisión #15: proteger Storage free). */
export const LOGO_MAX_KB = 300;

export function esImagen(file: File): boolean {
  return file.type.startsWith("image/");
}

/** Comprime un logo en el cliente hasta ≤300 KB antes de subirlo. */
export async function comprimirLogo(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: LOGO_MAX_KB / 1024,
    maxWidthOrHeight: 512,
    useWebWorker: true,
  });
}

/** Ruta de Storage del logo dentro de la carpeta del shelter (bucket `logos`). */
export function rutaLogo(shelterId: string, file: File): string {
  const ext = file.name.includes(".")
    ? (file.name.split(".").pop() as string).toLowerCase()
    : "jpg";
  return `${shelterId}/logo.${ext}`;
}
