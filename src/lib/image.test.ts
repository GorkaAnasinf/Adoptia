import { beforeEach, describe, expect, it, vi } from "vitest";

const { compressMock } = vi.hoisted(() => ({ compressMock: vi.fn() }));
vi.mock("browser-image-compression", () => ({ default: compressMock }));

import { comprimirLogo, esImagen, LOGO_MAX_KB, rutaLogo } from "./image";

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
