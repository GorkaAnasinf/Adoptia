import { describe, expect, it } from "vitest";
import { validateCleanupSeed, validateDemoSeed } from "../../scripts/validate-seed-sql";

describe("contrato SQL de los seeds", () => {
  it("rechaza un seed demo que no crea identidades ni valida credenciales", () => {
    const errors = validateDemoSeed("insert into auth.users values (...); on conflict (id) do nothing;");

    expect(errors).toContain("falta una transacción explícita");
    expect(errors).toContain("falta el upsert de credenciales");
    expect(errors).toContain("faltan identidades email");
    expect(errors).toContain("faltan aserciones de autenticación");
  });

  it("rechaza una limpieza que no contiene exactamente los tres dominios", () => {
    expect(validateCleanupSeed("delete from auth.users where true")).toContain(
      "la limpieza no está limitada a los tres dominios de seed",
    );
  });
});
