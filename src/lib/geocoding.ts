/**
 * Normalización de resultados de Photon (photon.komoot.io) — autocompletado
 * de direcciones basado en OpenStreetMap. Devuelve sugerencias listas para
 * rellenar el formulario de ubicación.
 */

export type Sugerencia = {
  label: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  lat: number;
  lng: number;
};

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: Record<string, unknown>;
};

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** Nombres bilingües de OSM ("Valle de Egüés / Eguesibar") → primera forma. */
function limpio(v: string): string {
  return v.split(" / ")[0].trim();
}

/**
 * Convierte la respuesta GeoJSON de Photon en sugerencias (solo ES).
 * `tipo="place"` normaliza municipios (el `name` es la ciudad, sin dirección).
 */
export function normalizePhoton(
  features: PhotonFeature[],
  tipo: "address" | "place" = "address",
): Sugerencia[] {
  const out: Sugerencia[] = [];
  for (const f of features) {
    const p = f.properties ?? {};
    const coords = f.geometry?.coordinates;
    if (!coords || coords.length !== 2) continue;
    if (str(p.countrycode).toUpperCase() !== "ES") continue;

    const [lng, lat] = coords;
    // La provincia suele mapear a county; state es la comunidad autónoma.
    const province = limpio(str(p.county) || str(p.state));
    const postalCode = str(p.postcode);

    if (tipo === "place" || str(p.osm_key) === "place") {
      const city = limpio(str(p.name) || str(p.city) || str(p.locality));
      if (!city) continue;
      const label = [city, province].filter(Boolean).join(", ");
      out.push({ label, address: "", city, province, postalCode, lat, lng });
      continue;
    }

    const calle = str(p.street) || str(p.name);
    const numero = str(p.housenumber);
    const address = [calle, numero].filter(Boolean).join(" ").trim();
    // En España el municipio puede venir en city/district/locality/county.
    const city = limpio(str(p.city) || str(p.district) || str(p.locality) || str(p.county));

    if (!address && !city) continue;

    const label = [address || str(p.name), postalCode, city].filter(Boolean).join(", ");
    out.push({ label, address: address || str(p.name), city, province, postalCode, lat, lng });
  }
  return out;
}
