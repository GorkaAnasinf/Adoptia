// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { adminClient, anonClient, ensureUser, rlsDisponible, signInAs } from "./helpers";

/**
 * FEATURE-004 — Storage bucket `shelter-media` (fotos de instalaciones).
 * Requieren `npx supabase start` + variables SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("FEATURE-004 media de protectora", () => {
  const PASS = "password-de-test-123";
  const BUCKET = "shelter-media";
  let shelterAId: string;
  let shelterBId: string;

  const jpeg = () => new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" });

  beforeAll(async () => {
    const admin = adminClient();
    const a = await ensureUser("protectora-a@test.com", PASS);
    const b = await ensureUser("protectora-b@test.com", PASS);

    const { data: sa } = await admin
      .from("shelters")
      .upsert({ owner_id: a, name: "Protectora A", slug: "protectora-a", status: "verified" }, { onConflict: "slug" })
      .select()
      .single();
    shelterAId = sa.id;
    const { data: sb } = await admin
      .from("shelters")
      .upsert({ owner_id: b, name: "Protectora B", slug: "protectora-b", status: "verified" }, { onConflict: "slug" })
      .select()
      .single();
    shelterBId = sb.id;
  });

  it("existe el bucket público shelter-media", async () => {
    const { data } = await adminClient().storage.getBucket(BUCKET);
    expect(data?.public).toBe(true);
  });

  it("la protectora dueña SÍ sube a su carpeta", async () => {
    const clientA = await signInAs("protectora-a@test.com", PASS);
    const { error } = await clientA.storage
      .from(BUCKET)
      .upload(`${shelterAId}/foto-${Date.now()}.jpg`, jpeg(), { contentType: "image/jpeg" });
    expect(error).toBeNull();
  });

  it("la protectora A NO sube a la carpeta de la B", async () => {
    const clientA = await signInAs("protectora-a@test.com", PASS);
    const { error } = await clientA.storage
      .from(BUCKET)
      .upload(`${shelterBId}/hack-${Date.now()}.jpg`, jpeg(), { contentType: "image/jpeg" });
    expect(error).not.toBeNull();
  });

  it("cualquiera (anon) puede leer el bucket público", async () => {
    const clientA = await signInAs("protectora-a@test.com", PASS);
    const path = `${shelterAId}/publica-${Date.now()}.jpg`;
    await clientA.storage.from(BUCKET).upload(path, jpeg(), { contentType: "image/jpeg" });
    const { data } = anonClient().storage.from(BUCKET).getPublicUrl(path);
    const res = await fetch(data.publicUrl);
    expect(res.ok).toBe(true);
  });
});
