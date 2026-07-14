/**
 * Validación y rutas de vídeo MP4 subido de un animal (FEATURE-020 Fase B).
 * El MP4 no se comprime en cliente (a diferencia de las fotos), así que el
 * tope de tamaño protege el Storage del free tier — reforzado por el
 * `file_size_limit` del bucket `animal-media` en la migración.
 */

/** Tope de tamaño de un vídeo MP4 subido. */
export const VIDEO_MAX_MB = 25;

export function esVideoMp4(file: File): boolean {
  return file.type === "video/mp4";
}

export function excedeTamanoVideo(file: File): boolean {
  return file.size > VIDEO_MAX_MB * 1024 * 1024;
}

/**
 * Ruta de Storage de un vídeo: `{shelterId}/{animalId}/{uuid}.mp4`.
 * La primera carpeta es el shelter (la política RLS valida foldername[1]),
 * igual que `rutaFoto`.
 */
export function rutaVideo(shelterId: string, animalId: string): string {
  return `${shelterId}/${animalId}/${crypto.randomUUID()}.mp4`;
}
