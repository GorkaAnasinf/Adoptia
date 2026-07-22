import { accionAnimalSchema, validarPublicacion } from "@/lib/schemas/animal";
import { createClient } from "@/lib/supabase/server";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

type AnimalRow = {
  id: string;
  name: string;
  species: string | null;
  sex: string | null;
  size: string | null;
  description: string | null;
  published_at: string | null;
  shelters: { status: string } | null;
  animal_media: { type: string | null }[] | null;
};

async function cargarAnimal(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, animal: null as AnimalRow | null };
  const { data } = await supabase
    .from("animals")
    .select("id, name, species, sex, size, description, published_at, shelters(status), animal_media(type)")
    .eq("id", id)
    .maybeSingle();
  return { supabase, user, animal: (data as unknown as AnimalRow | null) };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = accionAnimalSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return json({ error: { code: "validation", message: "Acción inválida" } }, 400);
  }
  const { accion } = parsed.data;

  const { supabase, user, animal } = await cargarAnimal(id);
  if (!user) return json({ error: { code: "unauthorized", message: "Inicia sesión" } }, 401);
  if (!animal) return json({ error: { code: "not_found", message: "Animal no encontrado" } }, 404);

  if (accion === "publish") {
    if (animal.shelters?.status !== "verified") {
      return json({ error: { code: "forbidden", message: "Tu protectora aún no está verificada" } }, 403);
    }
    const numFotos = (animal.animal_media ?? []).filter((m) => (m.type ?? "photo") === "photo").length;
    // Se le pasa la fila de BD tal cual: `animalPublishSchema` no es `.strict()`, así
    // que descarta las claves extra (shelters, animal_media, …). Funciona porque los
    // campos requeridos para publicar son de una palabra e idénticos en snake/camel
    // (name, species, sex, size, description). Si se añade un requisito multi-palabra,
    // habrá que mapear la fila a camelCase antes de validar.
    const { ok } = validarPublicacion(animal, numFotos);
    if (!ok) {
      return json({ error: { code: "incomplete", message: "La ficha no está lista para publicar" } }, 422);
    }
  }

  const published_at = accion === "publish" ? new Date().toISOString() : null;
  const { data, error } = await supabase
    .from("animals")
    .update({ published_at })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return json({ error: { code: "db_error", message: error.message } }, 500);
  if (!data) return json({ error: { code: "not_found", message: "Animal no encontrado" } }, 404);
  return json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: { code: "unauthorized", message: "Inicia sesión" } }, 401);

  const { data, error } = await supabase
    .from("animals")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error) return json({ error: { code: "db_error", message: error.message } }, 500);
  if (!data) return json({ error: { code: "not_found", message: "Animal no encontrado" } }, 404);
  return json({ ok: true });
}
