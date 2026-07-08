import { describe, expect, it } from "vitest";
import { esYoutubeValido, parseYoutubeId, youtubeEmbedUrl } from "./youtube";

describe("parseYoutubeId", () => {
  it("acepta los formatos habituales de YouTube", () => {
    const id = "dQw4w9WgXcQ";
    expect(parseYoutubeId(`https://www.youtube.com/watch?v=${id}`)).toBe(id);
    expect(parseYoutubeId(`https://youtu.be/${id}`)).toBe(id);
    expect(parseYoutubeId(`https://www.youtube.com/embed/${id}`)).toBe(id);
    expect(parseYoutubeId(`https://www.youtube.com/shorts/${id}`)).toBe(id);
    expect(parseYoutubeId(`https://m.youtube.com/watch?v=${id}&t=10s`)).toBe(id);
  });

  it("rechaza enlaces que no son de YouTube o mal formados", () => {
    expect(parseYoutubeId("https://vimeo.com/12345")).toBeNull();
    expect(parseYoutubeId("no soy una url")).toBeNull();
    expect(parseYoutubeId("https://www.youtube.com/watch?v=corto")).toBeNull();
    expect(parseYoutubeId("")).toBeNull();
  });
});

describe("youtubeEmbedUrl", () => {
  it("normaliza a embed nocookie", () => {
    expect(youtubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
    expect(youtubeEmbedUrl("https://vimeo.com/1")).toBeNull();
  });
});

describe("esYoutubeValido", () => {
  it("refleja parseYoutubeId", () => {
    expect(esYoutubeValido("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
    expect(esYoutubeValido("basura")).toBe(false);
  });
});
