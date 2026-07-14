import { describe, expect, it } from "vitest";
import { esVideoMp4, excedeTamanoVideo, rutaVideo, VIDEO_MAX_MB } from "./video";

function fakeFile(type: string, sizeBytes: number): File {
  const f = new File([new Uint8Array(1)], "clip.mp4", { type });
  Object.defineProperty(f, "size", { value: sizeBytes });
  return f;
}

describe("esVideoMp4", () => {
  it("acepta solo video/mp4", () => {
    expect(esVideoMp4(fakeFile("video/mp4", 1000))).toBe(true);
    expect(esVideoMp4(fakeFile("video/quicktime", 1000))).toBe(false);
    expect(esVideoMp4(fakeFile("image/jpeg", 1000))).toBe(false);
  });
});

describe("excedeTamanoVideo", () => {
  it("marca los que superan el tope", () => {
    expect(excedeTamanoVideo(fakeFile("video/mp4", VIDEO_MAX_MB * 1024 * 1024))).toBe(false);
    expect(excedeTamanoVideo(fakeFile("video/mp4", VIDEO_MAX_MB * 1024 * 1024 + 1))).toBe(true);
  });
});

describe("rutaVideo", () => {
  it("usa la carpeta del shelter y extensión mp4 (política RLS por foldername[1])", () => {
    const ruta = rutaVideo("shelter-1", "animal-9");
    expect(ruta).toMatch(/^shelter-1\/animal-9\/[0-9a-f-]+\.mp4$/);
  });
});
