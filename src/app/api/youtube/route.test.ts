import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock } = vi.hoisted(() => ({ getUserMock: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ auth: { getUser: getUserMock } })),
}));

import { GET } from "./route";

function req(url?: string) {
  const qs = url === undefined ? "" : `?url=${encodeURIComponent(url)}`;
  return new Request(`http://localhost/api/youtube${qs}`);
}

describe("GET /api/youtube", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "owner1" } } });
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  it("401 sin sesión", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await GET(req("https://youtu.be/dQw4w9WgXcQ"));
    expect(res.status).toBe(401);
  });

  it("422 si el enlace no es de YouTube", async () => {
    const res = await GET(req("https://vimeo.com/123"));
    expect(res.status).toBe(422);
  });

  it("embeddable=true cuando oEmbed responde 200", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, status: 200 });
    const res = await GET(req("https://youtu.be/dQw4w9WgXcQ"));
    const body = await res.json();
    expect(body.data).toEqual({ embeddable: true, id: "dQw4w9WgXcQ" });
  });

  it("embeddable=false (not_embeddable) cuando oEmbed responde 401", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 401 });
    const res = await GET(req("https://youtu.be/dQw4w9WgXcQ"));
    const body = await res.json();
    expect(body.data.embeddable).toBe(false);
    expect(body.data.reason).toBe("not_embeddable");
  });

  it("embeddable=null (check_failed) si falla la red — no bloquea", async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network"));
    const res = await GET(req("https://youtu.be/dQw4w9WgXcQ"));
    const body = await res.json();
    expect(body.data.embeddable).toBeNull();
  });
});
