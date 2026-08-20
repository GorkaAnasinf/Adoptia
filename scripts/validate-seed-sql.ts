const DOMAINS = ["@adoptiademo.com", "@circuito.adoptia.es", "@masivo.adoptia.es"];

export function validateDemoSeed(sql: string): string[] {
  const errors: string[] = [];

  if (!/^\s*begin;/im.test(sql) || !/commit;\s*$/im.test(sql)) {
    errors.push("falta una transacción explícita");
  }
  if (!/on conflict\s*\(id\)\s*do update/is.test(sql)) {
    errors.push("falta el upsert de credenciales");
  }
  if (!/insert into auth\.identities/is.test(sql)) {
    errors.push("faltan identidades email");
  }
  if (!/extensions\.crypt\('A\.doptia!Demo',\s*u\.encrypted_password\)/is.test(sql)) {
    errors.push("faltan aserciones de autenticación");
  }

  return errors;
}

export function validateCleanupSeed(sql: string): string[] {
  const errors: string[] = [];

  if (!/^\s*begin;/im.test(sql) || !/commit;\s*$/im.test(sql)) {
    errors.push("falta una transacción explícita");
  }

  const exactDomains = DOMAINS.every((domain) => sql.includes(domain));
  const hasUnexpectedDomain = (sql.match(/@[a-z0-9][a-z0-9.-]*/gi) ?? []).some(
    (domain) => !DOMAINS.includes(domain.toLowerCase()),
  );
  if (
    !exactDomains ||
    hasUnexpectedDomain ||
    /delete\s+from\s+auth\.users\s+where\s+true/i.test(sql)
  ) {
    errors.push("la limpieza no está limitada a los tres dominios de seed");
  }

  return errors;
}
