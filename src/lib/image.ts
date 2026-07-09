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

/** Tamaño máximo de foto de animal tras compresión (Decisión #15). */
export const FOTO_MAX_KB = 300;

/** Comprime una foto de animal en el cliente hasta ≤300 KB antes de subirla. */
export async function comprimirFoto(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: FOTO_MAX_KB / 1024,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
  });
}

/**
 * Ruta de Storage de una foto de animal: `{shelterId}/{animalId}/{uuid}.{ext}`.
 * La primera carpeta es el shelter (la política RLS valida foldername[1]).
 */
export function rutaFoto(shelterId: string, animalId: string, file: File): string {
  const ext = file.name.includes(".")
    ? (file.name.split(".").pop() as string).toLowerCase()
    : "jpg";
  return `${shelterId}/${animalId}/${crypto.randomUUID()}.${ext}`;
}

/** Ruta de una foto de instalaciones (bucket `shelter-media`): `{shelterId}/{uuid}.{ext}`. */
export function rutaMediaShelter(shelterId: string, file: File): string {
  const ext = file.name.includes(".")
    ? (file.name.split(".").pop() as string).toLowerCase()
    : "jpg";
  return `${shelterId}/${crypto.randomUUID()}.${ext}`;
}
