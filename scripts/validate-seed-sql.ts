const DOMAINS = ["@adoptiademo.com", "@circuito.adoptia.es", "@masivo.adoptia.es"];
const DOMAIN_ALLOWLIST = DOMAINS.map((domain) => `lower(email) like '%${domain}'`).join(" or ");
const CREATE_SEED_USER_IDS =
  `create temporary table seed_user_ids as select id from auth.users where ${DOMAIN_ALLOWLIST}`;
const DELETE_SEED_USER_IDS = "delete from auth.users where id in (select id from seed_user_ids)";

function stripSqlComments(sql: string): string {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\r\n]*/g, " ");
}

function normalizeSql(sql: string): string {
  return stripSqlComments(sql)
    .replace(/"auth"/gi, "auth")
    .replace(/"users"/gi, "users")
    .replace(/\s*\.\s*/g, ".")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

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
  const commentFreeSql = stripSqlComments(sql);
  const normalizedSql = normalizeSql(sql);
  const statements = normalizedSql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  if (!normalizedSql.startsWith("begin;") || !normalizedSql.endsWith("commit;")) {
    errors.push("falta una transacción explícita");
  }

  const seedUserIdStatements = statements.filter((statement) =>
    statement.startsWith("create temporary table seed_user_ids"),
  );
  const authUserDeleteStatements = statements.filter((statement) =>
    /\bdelete\s+from\s+auth\.users\b/.test(statement),
  );
  const authUserReferences = normalizedSql.match(/\bauth\.users\b/g) ?? [];

  if (
    seedUserIdStatements.length !== 1 ||
    seedUserIdStatements[0] !== CREATE_SEED_USER_IDS ||
    authUserDeleteStatements.length !== 1 ||
    authUserDeleteStatements[0] !== DELETE_SEED_USER_IDS ||
    authUserReferences.length !== 2 ||
    /\bexecute\b/.test(normalizedSql) ||
    /@[a-z0-9.-]*[A-Z]/.test(commentFreeSql)
  ) {
    errors.push("la limpieza no está limitada a los tres dominios de seed");
  }

  return errors;
}
