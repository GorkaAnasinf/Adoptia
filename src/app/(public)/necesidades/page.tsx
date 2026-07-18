import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AyudarNecesidadButton } from "@/components/necesidades/AyudarNecesidadButton";
import { buscarCiudad } from "@/lib/geocode-ciudad";
import { CATEGORIAS_NECESIDAD, type CategoriaNecesidad } from "@/lib/schemas/necesidades";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("necesidades");
  return { title: t("title"), description: t("subtitle"), alternates: { canonical: "/necesidades" } };
}

type Fila = {
  id: string;
  categoria: CategoriaNecesidad;
  descripcion: string;
  urgencia: string;
  created_at: string;
  shelter_name: string;
  shelter_slug: string;
  shelter_city: string | null;
  distance_km: number | null;
};

const RADIO_KM = 50;

/** Tablón público de necesidades de protectoras (FEATURE-031). */
export default async function NecesidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; urgente?: string; ciudad?: string }>;
}) {
  const t = await getTranslations("necesidades");
  const params = await searchParams;
  const categoria = CATEGORIAS_NECESIDAD.includes(params.categoria as CategoriaNecesidad)
    ? (params.categoria as CategoriaNecesidad)
    : null;
  const soloUrgentes = params.urgente === "si";
  const ciudad = params.ciudad?.trim() || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let filas: Fila[] = [];
  if (ciudad) {
    const coords = await buscarCiudad(ciudad);
    if (coords) {
      const { data } = await supabase.rpc("shelter_needs_nearby", {
        p_lat: coords.lat,
        p_lng: coords.lng,
        p_radius_km: RADIO_KM,
      });
      filas = (data as Fila[] | null) ?? [];
    }
  } else {
    const { data } = await supabase
      .from("shelter_needs")
      .select("id, categoria, descripcion, urgencia, created_at, shelters (name, slug, city)")
      .order("urgencia", { ascending: false })
      .order("created_at", { ascending: false });
    type Cruda = Omit<Fila, "shelter_name" | "shelter_slug" | "shelter_city" | "distance_km"> & {
      shelters: { name: string; slug: string; city: string | null } | null;
    };
    filas = (((data as unknown as Cruda[] | null) ?? []).map((f) => ({
      ...f,
      shelter_name: f.shelters?.name ?? "",
      shelter_slug: f.shelters?.slug ?? "",
      shelter_city: f.shelters?.city ?? null,
      distance_km: null,
    })) as Fila[]);
  }
  if (categoria) filas = filas.filter((f) => f.categoria === categoria);
  if (soloUrgentes) filas = filas.filter((f) => f.urgencia === "urgente");

  const CATEGORIA_TEXTO = Object.fromEntries(
    CATEGORIAS_NECESIDAD.map((c) => [c, t(`cat${c.charAt(0).toUpperCase()}${c.slice(1)}`)]),
  );

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-heading text-3xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("fCategoria")}
          <select
            name="categoria"
            defaultValue={categoria ?? ""}
            className="rounded-lg border border-input bg-white px-3 py-2"
          >
            <option value="">{t("filtroTodas")}</option>
            {CATEGORIAS_NECESIDAD.map((c) => (
              <option key={c} value={c}>
                {CATEGORIA_TEXTO[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("fCiudad")}
          <input
            name="ciudad"
            defaultValue={ciudad ?? ""}
            maxLength={120}
            className="rounded-lg border border-input bg-white px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2 pb-2.5 text-sm font-medium">
          <input type="checkbox" name="urgente" value="si" defaultChecked={soloUrgentes} className="size-4" />
          {t("filtroUrgentes")}
        </label>
        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          {t("filtrar")}
        </button>
      </form>

      {filas.length === 0 ? (
        <p className="mt-10 rounded-xl border-2 border-dashed border-border p-10 text-center text-muted-foreground">
          {t("tablonEmpty")}
        </p>
      ) : (
        <ul className="mt-8 flex flex-col gap-3">
          {filas.map((f) => (
            <li key={f.id} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                  {CATEGORIA_TEXTO[f.categoria]}
                </span>
                {f.urgencia === "urgente" && (
                  <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                    {t("urgenteChip")}
                  </span>
                )}
                <span className="ml-auto flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Link href={`/protectoras/${f.shelter_slug}`} className="font-medium text-tertiary hover:underline">
                    {f.shelter_name}
                  </Link>
                  {f.shelter_city && <span>· {f.shelter_city}</span>}
                  {f.distance_km != null && <span>· {t("aKm", { km: f.distance_km })}</span>}
                </span>
              </div>
              <p>{f.descripcion}</p>
              <AyudarNecesidadButton needId={f.id} autenticado={Boolean(user)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
