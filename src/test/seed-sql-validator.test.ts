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

  it("rechaza una limpieza que borra un dominio ajeno aunque mencione los permitidos", () => {
    const sql = `
      begin;
      -- @adoptiademo.com @circuito.adoptia.es @masivo.adoptia.es
      delete from auth.users where email like '%@otro-dominio.es';
      commit;
    `;

    expect(validateCleanupSeed(sql)).toContain(
      "la limpieza no está limitada a los tres dominios de seed",
    );
  });

  it("rechaza una limpieza cuyo allowlist añade or 1=1", () => {
    const sql = `
      begin;
      create temporary table seed_user_ids as
      select id from auth.users
      where lower(email) like '%@adoptiademo.com'
        or lower(email) like '%@circuito.adoptia.es'
        or lower(email) like '%@masivo.adoptia.es'
        or 1 = 1;
      delete from auth.users where id in (select id from seed_user_ids);
      commit;
    `;

    expect(validateCleanupSeed(sql)).toContain(
      "la limpieza no está limitada a los tres dominios de seed",
    );
  });

  it("rechaza un borrado por id aunque los dominios solo estén en comentarios", () => {
    const sql = `
      begin;
      -- @adoptiademo.com @circuito.adoptia.es @masivo.adoptia.es
      delete from auth.users where id is not null;
      commit;
    `;

    expect(validateCleanupSeed(sql)).toContain(
      "la limpieza no está limitada a los tres dominios de seed",
    );
  });

  it("rechaza dominios en mayúsculas en el allowlist", () => {
    const sql = `
      begin;
      create temporary table seed_user_ids as
      select id from auth.users
      where lower(email) like '%@ADOPTIAdemo.com'
        or lower(email) like '%@circuito.adoptia.es'
        or lower(email) like '%@masivo.adoptia.es';
      delete from auth.users where id in (select id from seed_user_ids);
      commit;
    `;

    expect(validateCleanupSeed(sql)).toContain(
      "la limpieza no está limitada a los tres dominios de seed",
    );
  });

  it("acepta un seed demo con todos los requisitos del contrato", () => {
    const sql = `
      begin;
      insert into auth.identities values (...);
      insert into auth.users values (...) on conflict (id) do update set encrypted_password = excluded.encrypted_password;
      select extensions.crypt('A.doptia!Demo', u.encrypted_password);
      commit;
    `;

    expect(validateDemoSeed(sql)).toEqual([]);
  });

  it("acepta una limpieza limitada a los tres dominios de seed", () => {
    const sql = `
      begin;
      create temporary table seed_user_ids as
      select id from auth.users
      where lower(email) like '%@adoptiademo.com'
        or lower(email) like '%@circuito.adoptia.es'
        or lower(email) like '%@masivo.adoptia.es';
      delete from auth.users where id in (select id from seed_user_ids);
      commit;
    `;

    expect(validateCleanupSeed(sql)).toEqual([]);
  });
});
