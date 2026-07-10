import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MapaShell } from "@/components/map/MapaShell";
import type { ShelterMapResult } from "@/components/map/ListaProtectoras";
import { parseSheltersSearch, searchToRpcArgs } from "@/lib/shelters-search";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mapa");
  return { title: t("title"), description: t("subtitle") };
}

async function buscarProtectoras(
  search: ReturnType<typeof parseSheltersSearch>,
): Promise<ShelterMapResult[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("shelters_nearby", searchToRpcArgs(search));
  if (error || !data) return [];
  return data as ShelterMapResult[];
}

export default async function MapaPage({ searchParams }: { searchParams: SearchParams }) {
  const search = parseSheltersSearch(await searchParams);
  const shelters = await buscarProtectoras(search);

  return <MapaShell shelters={shelters} search={search} />;
}
