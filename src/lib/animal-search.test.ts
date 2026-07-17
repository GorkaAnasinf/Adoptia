import { describe, expect, it } from "vitest";
import {
  PAGE_SIZE,
  buildQueryString,
  edadAproximada,
  edadEnBucket,
  paginasVisibles,
  parseAnimalSearch,
  searchToRpcArgs,
  totalPaginas,
} from "./animal-search";

const HOY = new Date("2026-07-09T12:00:00Z");

describe("parseAnimalSearch", () => {
  it("sin parámetros devuelve los valores por defecto (recientes, página 1)", () => {
    const s = parseAnimalSearch({});
    expect(s).toEqual({
      q: undefined,
      especie: undefined,
      tamanos: [],
      sexos: [],
      edad: undefined,
      ninos: undefined,
      perros: undefined,
      gatos: undefined,
      distanciaKm: undefined,
      lat: undefined,
      lng: undefined,
      orden: "recientes",
      pagina: 1,
    });
  });

  it("parsea filtros combinados desde la URL", () => {
    const s = parseAnimalSearch({
      especie: "dog",
      tamano: "small,medium",
      sexo: "female",
      edad: "joven",
      ninos: "si",
      distancia: "50",
      lat: "43.263",
      lng: "-2.935",
      orden: "cercanos",
      pagina: "3",
    });
    expect(s.especie).toBe("dog");
    expect(s.tamanos).toEqual(["small", "medium"]);
    expect(s.sexos).toEqual(["female"]);
    expect(s.edad).toBe("joven");
    expect(s.ninos).toBe(true);
    expect(s.perros).toBeUndefined();
    expect(s.distanciaKm).toBe(50);
    expect(s.lat).toBeCloseTo(43.263);
    expect(s.lng).toBeCloseTo(-2.935);
    expect(s.orden).toBe("cercanos");
    expect(s.pagina).toBe(3);
  });

  it("ignora valores inválidos sin romper", () => {
    const s = parseAnimalSearch({
      especie: "dragon",
      tamano: "gigante,small",
      sexo: "unknown",
      edad: "viejuno",
      distancia: "-5",
      lat: "999",
      lng: "abc",
      pagina: "0",
    });
    expect(s.especie).toBeUndefined();
    expect(s.tamanos).toEqual(["small"]);
    expect(s.sexos).toEqual([]);
    expect(s.edad).toBeUndefined();
    expect(s.distanciaKm).toBeUndefined();
    expect(s.lat).toBeUndefined();
    expect(s.lng).toBeUndefined();
    expect(s.pagina).toBe(1);
  });

  it("orden cercanos sin ubicación cae a recientes", () => {
    const s = parseAnimalSearch({ orden: "cercanos" });
    expect(s.orden).toBe("recientes");
  });

  it("acepta arrays de Next (param repetido) usando el primer valor", () => {
    const s = parseAnimalSearch({ especie: ["cat", "dog"] });
    expect(s.especie).toBe("cat");
  });
});

describe("parseAnimalSearch · texto (q)", () => {
  it("recorta espacios del término", () => {
    expect(parseAnimalSearch({ q: "  labrador  " }).q).toBe("labrador");
  });

  it("término vacío o solo espacios → undefined", () => {
    expect(parseAnimalSearch({ q: "" }).q).toBeUndefined();
    expect(parseAnimalSearch({ q: "   " }).q).toBeUndefined();
    expect(parseAnimalSearch({}).q).toBeUndefined();
  });

  it("acota la longitud del término a 60 caracteres", () => {
    const largo = "a".repeat(200);
    expect(parseAnimalSearch({ q: largo }).q).toHaveLength(60);
  });
});

describe("searchToRpcArgs · texto (q)", () => {
  it("monta el patrón %término% cuando hay texto", () => {
    const args = searchToRpcArgs(parseAnimalSearch({ q: "labrador" }), HOY);
    expect(args.p_query).toBe("%labrador%");
  });

  it("sin texto → p_query null", () => {
    expect(searchToRpcArgs(parseAnimalSearch({}), HOY).p_query).toBeNull();
  });

  it("escapa los metacaracteres LIKE del usuario (%, _, \\)", () => {
    const args = searchToRpcArgs(parseAnimalSearch({ q: "50%_a\\b" }), HOY);
    expect(args.p_query).toBe("%50\\%\\_a\\\\b%");
  });
});

describe("buildQueryString · texto (q)", () => {
  it("incluye q cuando hay término y lo omite si no", () => {
    expect(buildQueryString(parseAnimalSearch({ q: "gato" }))).toContain("q=gato");
    expect(buildQueryString(parseAnimalSearch({}))).not.toContain("q=");
  });
});

describe("searchToRpcArgs", () => {
  it("mapea filtros a argumentos del RPC con paginación", () => {
    const s = parseAnimalSearch({
      especie: "cat",
      tamano: "large",
      sexo: "male,female",
      gatos: "si",
      pagina: "2",
    });
    const args = searchToRpcArgs(s, HOY);
    expect(args).toMatchObject({
      p_species: "cat",
      p_sizes: ["large"],
      p_sexes: ["male", "female"],
      p_good_with_cats: true,
      p_good_with_kids: null,
      p_good_with_dogs: null,
      p_order: "recent",
      p_limit: PAGE_SIZE,
      p_offset: PAGE_SIZE,
      p_lat: null,
      p_lng: null,
      p_radius_km: null,
    });
  });

  it("traduce el bucket de edad a rango de fechas de nacimiento", () => {
    const joven = searchToRpcArgs(parseAnimalSearch({ edad: "joven" }), HOY);
    expect(joven.p_birth_after).toBe("2023-07-09");
    expect(joven.p_birth_before).toBe("2025-07-09");

    const cachorro = searchToRpcArgs(parseAnimalSearch({ edad: "cachorro" }), HOY);
    expect(cachorro.p_birth_after).toBe("2025-07-09");
    expect(cachorro.p_birth_before).toBeNull();

    const senior = searchToRpcArgs(parseAnimalSearch({ edad: "senior" }), HOY);
    expect(senior.p_birth_after).toBeNull();
    expect(senior.p_birth_before).toBe("2018-07-09");
  });

  it("con ubicación y orden cercanos pide orden por distancia y radio", () => {
    const s = parseAnimalSearch({
      orden: "cercanos",
      lat: "43.26",
      lng: "-2.93",
      distancia: "100",
    });
    const args = searchToRpcArgs(s, HOY);
    expect(args.p_order).toBe("distance");
    expect(args.p_lat).toBeCloseTo(43.26);
    expect(args.p_radius_km).toBe(100);
  });

  it("radio sin orden cercanos también filtra por distancia (con ubicación)", () => {
    const s = parseAnimalSearch({ lat: "43.26", lng: "-2.93", distancia: "25" });
    const args = searchToRpcArgs(s, HOY);
    expect(args.p_order).toBe("recent");
    expect(args.p_radius_km).toBe(25);
  });
});

describe("buildQueryString", () => {
  it("serializa solo los filtros activos y omite defaults", () => {
    const s = parseAnimalSearch({
      especie: "dog",
      tamano: "small,medium",
      ninos: "si",
      pagina: "1",
    });
    expect(buildQueryString(s)).toBe("especie=dog&tamano=small%2Cmedium&ninos=si");
  });

  it("permite fijar otra página conservando filtros (ida y vuelta estable)", () => {
    const s = parseAnimalSearch({ especie: "cat", pagina: "1" });
    const qs = buildQueryString({ ...s, pagina: 4 });
    expect(qs).toContain("pagina=4");
    const reparsed = parseAnimalSearch(Object.fromEntries(new URLSearchParams(qs)));
    expect(reparsed.especie).toBe("cat");
    expect(reparsed.pagina).toBe(4);
  });
});

describe("edadAproximada", () => {
  it("devuelve años para mayores de un año y meses para cachorros", () => {
    expect(edadAproximada("2020-01-15", HOY)).toEqual({ unidad: "anios", n: 6 });
    expect(edadAproximada("2026-02-01", HOY)).toEqual({ unidad: "meses", n: 5 });
  });

  it("devuelve null sin fecha o con fecha inválida o futura", () => {
    expect(edadAproximada(null, HOY)).toBeNull();
    expect(edadAproximada("no-fecha", HOY)).toBeNull();
    expect(edadAproximada("2030-01-01", HOY)).toBeNull();
  });
});

describe("edadEnBucket", () => {
  it("clasifica por los mismos límites que la búsqueda ([desde, hasta) en años)", () => {
    expect(edadEnBucket("2026-02-01", "cachorro", HOY)).toBe(true); // 5 meses
    expect(edadEnBucket("2024-01-15", "joven", HOY)).toBe(true); // 2 años
    expect(edadEnBucket("2020-01-15", "adulto", HOY)).toBe(true); // 6 años
    expect(edadEnBucket("2015-01-15", "senior", HOY)).toBe(true); // 11 años
    expect(edadEnBucket("2024-01-15", "cachorro", HOY)).toBe(false);
    expect(edadEnBucket("2024-01-15", "adulto", HOY)).toBe(false);
  });

  it("sin fecha o inválida no encaja en ningún bucket", () => {
    expect(edadEnBucket(null, "cachorro", HOY)).toBe(false);
    expect(edadEnBucket("no-fecha", "senior", HOY)).toBe(false);
  });
});

describe("totalPaginas", () => {
  it("redondea hacia arriba y nunca baja de 1", () => {
    expect(totalPaginas(0)).toBe(1);
    expect(totalPaginas(24)).toBe(1);
    expect(totalPaginas(25)).toBe(2);
    expect(totalPaginas(100)).toBe(5);
  });
});

describe("paginasVisibles", () => {
  it("con pocas páginas las muestra todas sin elipsis", () => {
    expect(paginasVisibles(1, 3)).toEqual([1, 2, 3]);
    expect(paginasVisibles(2, 5)).toEqual([1, 2, 3, "...", 5]);
  });

  it("desde la primera página muestra el arranque, elipsis y la última", () => {
    expect(paginasVisibles(1, 12)).toEqual([1, 2, 3, "...", 12]);
  });

  it("en una página intermedia muestra los vecinos con elipsis a ambos lados", () => {
    expect(paginasVisibles(6, 12)).toEqual([1, "...", 5, 6, 7, "...", 12]);
  });

  it("al final muestra la primera, elipsis y el tramo final", () => {
    expect(paginasVisibles(12, 12)).toEqual([1, "...", 10, 11, 12]);
  });

  it("con una sola página devuelve lista vacía (no hay nada que paginar)", () => {
    expect(paginasVisibles(1, 1)).toEqual([]);
  });
});
