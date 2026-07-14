// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import {
  adminClient,
  anonClient,
  ensureUser,
  rlsDisponible,
  signInAs,
  upsertShelterFixture,
} from "./helpers";

/**
 * FEATURE-003 — Storage bucket `animal-media` y constraint de portada única.
 * Requieren `npx supabase start` + variables SUPABASE_TEST_*.
 */
describe.skipIf(!rlsDisponible)("FEATURE-003 media de animales", () => {
  const PASS = "password-de-test-123";
  const BUCKET = "animal-media";
  let shelterAUserId: string;
  let shelterBUserId: string;
  let shelterAId: string;
  let shelterBId: string;
  let animalAId: string;

  const jpeg = () => new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" });

  beforeAll(async () => {
    const admin = adminClient();

    shelterAUserId = await ensureUser("protectora-a@test.com", PASS);
    shelterBUserId = await ensureUser("protectora-b@test.com", PASS);

    const { data: sa, error: ea } = await upsertShelterFixture({
      owner_id: shelterAUserId,
      name: "Protectora A",
      slug: "protectora-a",
      status: "verified",
    });
    if (ea) throw ea;
    shelterAId = sa.id;

    const { data: sb, error: eb } = await upsertShelterFixture({
      owner_id: shelterBUserId,
      name: "Protectora B",
      slug: "protectora-b",
      status: "verified",
    });
    if (eb) throw eb;
    shelterBId = sb.id;

    const { data: an, error: ean } = await admin
      .from("animals")
      .upsert(
        {
          shelter_id: shelterAId,
          name: "Luna",
          slug: "luna-test",
          species: "dog",
          sex: "female",
          size: "medium",
          status: "available",
        },
        { onConflict: "slug" },
      )
      .select()
      .single();
    if (ean) throw ean;
    animalAId = an.id;
  });

  it("existe el bucket público animal-media", async () => {
    const admin = adminClient();
    const { data } = await admin.storage.getBucket(BUCKET);
    expect(data?.public).toBe(true);
  });

  it("la protectora dueña SÍ sube a la carpeta de su shelter", async () => {
    const clientA = await signInAs("protectora-a@test.com", PASS);
    const path = `${shelterAId}/${animalAId}/foto-${Date.now()}.jpg`;
    const { error } = await clientA.storage.from(BUCKET).upload(path, jpeg(), {
      contentType: "image/jpeg",
      upsert: true,
    });
    expect(error).toBeNull();
  });

  it("la protectora A NO sube a la carpeta de la protectora B", async () => {
    const clientA = await signInAs("protectora-a@test.com", PASS);
    const path = `${shelterBId}/${animalAId}/hack-${Date.now()}.jpg`;
    const { error } = await clientA.storage.from(BUCKET).upload(path, jpeg(), {
      contentType: "image/jpeg",
    });
    expect(error).not.toBeNull();
  });

  it("cualquiera (anon) puede leer el bucket público", async () => {
    const clientA = await signInAs("protectora-a@test.com", PASS);
    const path = `${shelterAId}/${animalAId}/publica-${Date.now()}.jpg`;
    await clientA.storage.from(BUCKET).upload(path, jpeg(), { contentType: "image/jpeg" });

    const anon = anonClient();
    const { data } = anon.storage.from(BUCKET).getPublicUrl(path);
    const res = await fetch(data.publicUrl);
    expect(res.ok).toBe(true);
  });

  it("solo una portada por animal (índice único parcial)", async () => {
    const admin = adminClient();
    await admin.from("animal_media").delete().eq("animal_id", animalAId);

    const { error: e1 } = await admin
      .from("animal_media")
      .insert({ animal_id: animalAId, type: "photo", url: "a.jpg", is_cover: true });
    expect(e1).toBeNull();

    const { error: e2 } = await admin
      .from("animal_media")
      .insert({ animal_id: animalAId, type: "photo", url: "b.jpg", is_cover: true });
    expect(e2).not.toBeNull(); // viola el índice único de portada
  });

  // FEATURE-020 — un vídeo nunca puede ser la portada (miniatura solo-foto).
  it("no admite marcar un vídeo de YouTube como portada (constraint)", async () => {
    const admin = adminClient();
    await admin.from("animal_media").delete().eq("animal_id", animalAId);
    const { error } = await admin.from("animal_media").insert({
      animal_id: animalAId,
      type: "youtube",
      url: "https://youtu.be/dQw4w9WgXcQ",
      is_cover: true,
    });
    expect(error).not.toBeNull(); // check animal_media_cover_is_photo
  });

  it("animals_search devuelve una foto como cover_url aunque el vídeo tenga sort_order menor", async () => {
    const admin = adminClient();
    await admin.from("animals").update({ published_at: new Date().toISOString() }).eq("id", animalAId);
    await admin.from("animal_media").delete().eq("animal_id", animalAId);
    await admin.from("animal_media").insert([
      { animal_id: animalAId, type: "youtube", url: "https://youtu.be/dQw4w9WgXcQ", sort_order: 0 },
      { animal_id: animalAId, type: "photo", url: "portada.jpg", sort_order: 1, is_cover: true },
    ]);

    const anon = anonClient();
    const { data } = await anon.rpc("animals_search", { p_limit: 50 });
    const fila = (data ?? []).find((r: { id: string }) => r.id === animalAId);
    expect(fila?.cover_url).toBe("portada.jpg"); // nunca la URL de YouTube
  });
});
