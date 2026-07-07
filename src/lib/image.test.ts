import { beforeEach, describe, expect, it, vi } from "vitest";

const { compressMock } = vi.hoisted(() => ({ compressMock: vi.fn() }));
vi.mock("browser-image-compression", () => ({ default: compressMock }));

import {
  comprimirFoto,
  comprimirLogo,
  esImagen,
  FOTO_MAX_KB,
  LOGO_MAX_KB,
  rutaFoto,
  rutaLogo,
} from "./image";

function archivo(nombre: string, tipo: string, kb: number): File {
  return new File([new Uint8Array(kb * 1024)], nombre, { type: tipo });
}

describe("esImagen", () => {
  it("acepta imágenes y rechaza otros tipos", () => {
    expect(esImagen(archivo("logo.png", "image/png", 1))).toBe(true);
    expect(esImagen(archivo("doc.pdf", "application/pdf", 1))).toBe(false);
  });
});

describe("comprimirLogo", () => {
  beforeEach(() => compressMock.mockReset());

  it("comprime a un tamaño ≤ 300 KB", async () => {
    const grande = archivo("logo.png", "image/png", 900);
    const pequeño = archivo("logo.png", "image/png", 120);
    compressMock.mockResolvedValue(pequeño);

    const resultado = await comprimirLogo(grande);

    expect(compressMock).toHaveBeenCalledOnce();
    const opciones = compressMock.mock.calls[0][1];
    expect(opciones.maxSizeMB).toBeCloseTo(LOGO_MAX_KB / 1024);
    expect(resultado.size).toBeLessThanOrEqual(LOGO_MAX_KB * 1024);
  });
});

describe("rutaLogo", () => {
  it("construye la ruta dentro de la carpeta del shelter", () => {
    const ruta = rutaLogo("shelter-123", archivo("mi Logo.PNG", "image/png", 1));
    expect(ruta).toBe("shelter-123/logo.png");
  });

  it("usa jpg si el archivo no tiene extensión", () => {
    expect(rutaLogo("s1", archivo("sinextension", "image/jpeg", 1))).toBe("s1/logo.jpg");
  });
});

describe("comprimirFoto", () => {
  beforeEach(() => compressMock.mockReset());

  it("comprime a un tamaño ≤ 300 KB", async () => {
    const grande = archivo("foto.jpg", "image/jpeg", 5000);
    const pequeño = archivo("foto.jpg", "image/jpeg", 250);
    compressMock.mockResolvedValue(pequeño);

    const resultado = await comprimirFoto(grande);

    const opciones = compressMock.mock.calls[0][1];
    expect(opciones.maxSizeMB).toBeCloseTo(FOTO_MAX_KB / 1024);
    expect(resultado.size).toBeLessThanOrEqual(FOTO_MAX_KB * 1024);
  });
});

describe("rutaFoto", () => {
  it("construye {shelterId}/{animalId}/{uuid}.{ext}", () => {
    const ruta = rutaFoto("s1", "a1", archivo("Foto.JPG", "image/jpeg", 1));
    expect(ruta).toMatch(/^s1\/a1\/[0-9a-f-]{36}\.jpg$/);
  });
});
