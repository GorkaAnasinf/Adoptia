const DOMAINS = ["@adoptiademo.com", "@circuito.adoptia.es", "@masivo.adoptia.es"];
const DOMAIN_ALLOWLIST = DOMAINS.map((domain) => `lower(email) like '%${domain}'`).join(" or ");
const ALIASED_DOMAIN_ALLOWLIST = DOMAINS.map(
  (domain) => `lower(u.email) like '%${domain}'`,
).join(" or ");
const CREATE_SEED_USER_IDS =
  `create temporary table seed_user_ids on commit drop as select id from auth.users where ${DOMAIN_ALLOWLIST}`;
const DELETE_SEED_USER_IDS =
  `delete from auth.users u where u.id in (select id from seed_user_ids) and (${ALIASED_DOMAIN_ALLOWLIST})`;
const EXPECTED_DEMO_USERS = [
  ["d0000000-0000-4000-8000-000000000001", "protectoraaitana@adoptiademo.com", true],
  ["d0000000-0000-4000-8000-000000000002", "protectorabaluarte@adoptiademo.com", true],
  ["d0000000-0000-4000-8000-000000000003", "protectoracalima@adoptiademo.com", true],
  ["d0000000-0000-4000-8000-000000000004", "protectoraduero@adoptiademo.com", true],
  ["d0000000-0000-4000-8000-000000000005", "protectoraespiga@adoptiademo.com", true],
  ["d0000000-0000-4000-8000-000000000006", "protectorafaro@adoptiademo.com", true],
  ["d0000000-0000-4000-8000-000000000007", "protectoragaraia@adoptiademo.com", true],
  ["d0000000-0000-4000-8000-000000000008", "protectorahuerta@adoptiademo.com", true],
  ["d0000000-0000-4000-8000-000000000011", "adoptantealcaraz@adoptiademo.com", true],
  ["d0000000-0000-4000-8000-000000000012", "adoptantebeltran@adoptiademo.com", true],
  ["d0000000-0000-4000-8000-000000000013", "adoptantecarmona@adoptiademo.com", true],
  ["d0000000-0000-4000-8000-000000000014", "adoptantedelgado@adoptiademo.com", true],
  ["d0000000-0000-4000-8000-000000000015", "adoptanteesteban@adoptiademo.com", true],
  ["d0000000-0000-4000-8000-000000000016", "adoptantefuentes@adoptiademo.com", true],
  ["d0000000-0000-4000-8000-000000000017", "adoptantegallardo@adoptiademo.com", true],
  ["d0000000-0000-4000-8000-000000000018", "adoptanteherrero@adoptiademo.com", true],
  ["d0000000-0000-4000-8000-000000000019", "adoptanteiglesias@adoptiademo.com", true],
  ["d0000000-0000-4000-8000-000000000020", "adoptantejimenez@adoptiademo.com", true],
  ["d0000000-0000-4000-8000-000000000031", "admin@adoptiademo.com", false],
] as const;

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
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim()
    .toLowerCase();
}

function statementStartingAt(sql: string, marker: string): string {
  const start = sql.indexOf(marker);
  const end = sql.indexOf(";", start);
  return start >= 0 && end >= 0 ? sql.slice(start, end + 1) : "";
}

function containsEvery(sql: string, fragments: string[]): boolean {
  return fragments.every((fragment) => sql.includes(fragment));
}

function hasExactDemoUserMapping(sql: string): boolean {
  const insert = statementStartingAt(sql, "insert into demo_expected_users");
  const rows = [...insert.matchAll(/\(\s*'([0-9a-f-]{36})'\s*,\s*'([^']+)'\s*,\s*(true|false)\s*\)/g)].map(
    ([, id, email, passwordLoginEnabled]) =>
      `${id}|${email}|${passwordLoginEnabled}`,
  );
  const expectedRows = EXPECTED_DEMO_USERS.map(
    ([id, email, passwordLoginEnabled]) => `${id}|${email}|${passwordLoginEnabled}`,
  );

  return rows.length === expectedRows.length && new Set(rows).size === rows.length &&
    expectedRows.every((row) => rows.includes(row));
}

export function validateDemoSeed(sql: string): string[] {
  const errors: string[] = [];
  const normalizedSql = normalizeSql(sql);
  const authInsertIndex = normalizedSql.indexOf("insert into auth.users");
  const authUserInsert = statementStartingAt(normalizedSql, "insert into auth.users");
  const identityInsert = statementStartingAt(normalizedSql, "insert into auth.identities");
  const identityDeleteIndex = normalizedSql.indexOf("delete from auth.identities i");
  const identityInsertIndex = normalizedSql.indexOf("insert into auth.identities");

  if (!normalizedSql.startsWith("begin;") || !normalizedSql.endsWith("commit;")) {
    errors.push("falta una transacción explícita");
  }

  const authUpsert =
    /insert into auth\.users(?: as [a-z_][a-z0-9_]*)?[\s\S]*?on conflict\s*\(id\)\s*do update/.test(
      authUserInsert,
    );
  if (!authUpsert) {
    errors.push("falta el upsert de credenciales");
  }

  if (!hasExactDemoUserMapping(normalizedSql)) {
    errors.push("falta el mapeo exacto de usuarios demo");
  }

  if (!identityInsert) {
    errors.push("faltan identidades email");
  }
  if (
    !identityInsert ||
    !containsEvery(identityInsert, ["provider_id", "user_id", "identity_data", "provider"]) ||
    !/(?:e|u)\.id::text/.test(identityInsert) ||
    !/jsonb_build_object\('sub', (?:e|u)\.id::text, 'email', (?:e|u)\.email\), 'email'(?:, now\(\), now\(\))? from\b/.test(
      identityInsert,
    )
  ) {
    errors.push("faltan identidades email canónicas");
  }

  const preflightFragments = [
    "create temporary table demo_expected_users",
    "join auth.users u on u.id = e.id",
    "join auth.users u on lower(u.email) = e.email",
    "i.provider_id = e.id::text",
    "i.user_id <> e.id",
  ];
  const preflightIsBeforeMutation = preflightFragments.every((fragment) => {
    const index = normalizedSql.indexOf(fragment);
    return index >= 0 && authInsertIndex >= 0 && index < authInsertIndex;
  });
  if (!preflightIsBeforeMutation) {
    errors.push("falta el preflight de colisiones Auth");
  }

  const remnantsPreflightFragments = [
    "from public.shelters s",
    "s.owner_id in (select id from demo_expected_users)",
    "from public.animals a",
    "a.id::text like 'd2000000-0000-4000-8000-%'",
    "raise exception 'restos comerciales detectados",
  ];
  const remnantsPreflightIsBeforeMutation = remnantsPreflightFragments.every((fragment) => {
    const index = normalizedSql.indexOf(fragment);
    return index >= 0 && authInsertIndex >= 0 && index < authInsertIndex;
  });
  if (!remnantsPreflightIsBeforeMutation) {
    errors.push("falta el preflight de restos comerciales");
  }

  if (!normalizedSql.includes("insert into public.profiles")) {
    errors.push("faltan perfiles demo");
  }

  if (
    identityDeleteIndex < 0 ||
    identityInsertIndex < 0 ||
    identityDeleteIndex >= identityInsertIndex ||
    !normalizedSql.includes(
      "delete from auth.identities i where i.user_id in (select id from demo_expected_users)",
    )
  ) {
    errors.push("no se reconstruyen las identidades demo");
  }

  const hasAuthAssertions = containsEvery(normalizedSql, [
    "do $$",
    "raise exception",
    "extensions.crypt(c.demo_password, u.encrypted_password)",
  ]);
  if (!hasAuthAssertions) {
    errors.push("faltan aserciones de autenticación");
  }

  const hasCardinalityAssertions = containsEvery(normalizedSql, [
    "v_perfiles <> 19",
    "v_identidades_total <> 19",
    "v_identidades_canonicas <> 19",
    "v_protectoras <> 8",
    "v_animales <> 40",
  ]);
  if (!hasCardinalityAssertions) {
    errors.push("faltan cardinalidades finales");
  }

  const hasExactMappingAssertion = containsEvery(normalizedSql, [
    "full join (",
    "where lower(au.email) like '%@adoptiademo.com'",
    "or au.id in (select id from demo_expected_users)",
    "where e.id is null or u.id is null",
    "if v_mapeo_incorrecto <> 0",
  ]);
  if (!hasExactMappingAssertion) {
    errors.push("falta la aserción final del mapeo demo");
  }

  const hasCompleteAuthState = containsEvery(normalizedSql, [
    "instance_id = excluded.instance_id",
    "email_confirmed_at = excluded.email_confirmed_at",
    "banned_until = excluded.banned_until",
    "deleted_at = null",
    "is_sso_user = false",
    "is_anonymous = false",
    "where e.password_login_enabled",
    "where not e.password_login_enabled",
    "v_cuentas_login <> 18",
  ]);
  if (!hasCompleteAuthState) {
    errors.push("faltan invariantes completas de Auth");
  }

  const hasDisabledAdmin = containsEvery(normalizedSql, [
    "extensions.gen_random_bytes(32)",
    "timestamptz '9999-12-31 00:00:00+00'",
    "v_admin_deshabilitado <> 1",
    "extensions.crypt(c.demo_password, u.encrypted_password) <> u.encrypted_password",
  ]);
  if (!hasDisabledAdmin) {
    errors.push("la cuenta admin no queda deshabilitada");
  }

  return errors;
}

export function validateCleanupSeed(sql: string): string[] {
  const errors: string[] = [];
  const commentFreeSql = stripSqlComments(sql);
  const normalizedSql = normalizeSql(sql);
  const authUserDeleteCount = normalizedSql.match(/\bdelete\s+from\s+auth\.users\b/g)?.length ?? 0;
  const deleteCount = normalizedSql.match(/\bdelete\s+from\b/g)?.length ?? 0;
  const dynamicDml = /\bexecute\b[^;]*\b(?:delete|insert|update)\b/.test(normalizedSql);
  const mentionedDomains = [...commentFreeSql.matchAll(/@[a-z0-9.-]+/gi)].map(
    ([domain]) => domain.toLowerCase(),
  );
  const hasUnknownDomain = mentionedDomains.some((domain) => !DOMAINS.includes(domain));

  if (!normalizedSql.startsWith("begin;") || !normalizedSql.endsWith("commit;")) {
    errors.push("falta una transacción explícita");
  }

  if (!normalizedSql.includes("lock table auth.users in share row exclusive mode")) {
    errors.push("falta bloquear auth.users durante la limpieza");
  }

  if (!normalizedSql.includes(CREATE_SEED_USER_IDS)) {
    errors.push("seed_user_ids no usa ON COMMIT DROP");
  }

  const allowlistIsClosed =
    normalizedSql.includes(CREATE_SEED_USER_IDS) &&
    authUserDeleteCount === 1 &&
    normalizedSql.includes(DELETE_SEED_USER_IDS) &&
    !dynamicDml &&
    !hasUnknownDomain &&
    !/@[a-z0-9.-]*[A-Z]/.test(commentFreeSql);
  if (!allowlistIsClosed) {
    errors.push("la limpieza no está limitada a los tres dominios de seed");
  }

  if (!normalizedSql.includes(DELETE_SEED_USER_IDS)) {
    errors.push("el DELETE no revalida los tres dominios");
  }

  const auditDelete = statementStartingAt(normalizedSql, "delete from public.audit_log");
  if (
    deleteCount !== 2 ||
    auditDelete !==
      "delete from public.audit_log where admin_id in (select id from seed_user_ids);"
  ) {
    errors.push("la limpieza contiene DML destructivo fuera del contrato");
  }

  const hasFinalAssertions = containsEvery(normalizedSql, [
    "create temporary table seed_shelter_ids on commit drop as",
    "select id from public.shelters where owner_id in (select id from seed_user_ids)",
    "remaining_user_count",
    "remaining_profile_count",
    "remaining_shelter_count",
    "remaining_animal_count",
    "from auth.users u",
    "from public.profiles",
    "from public.shelters",
    "from public.animals a",
    "a.shelter_id in (select id from seed_shelter_ids)",
    "raise exception",
  ]);
  if (!hasFinalAssertions) {
    errors.push("faltan aserciones finales de limpieza");
  }

  const orderedFragments = [
    "lock table auth.users in share row exclusive mode",
    "create temporary table seed_user_ids on commit drop as",
    "create temporary table seed_shelter_ids on commit drop as",
    "create temporary table audit_log_user_trigger_states on commit drop as",
    "alter table public.audit_log disable trigger %i",
    "delete from public.audit_log",
    "when 'o' then",
    "delete from auth.users u",
    "select count(*) into remaining_user_count",
    "if remaining_user_count <> 0",
  ];
  const orderedIndexes = orderedFragments.map((fragment) => normalizedSql.indexOf(fragment));
  const hasSafeOrder = orderedIndexes.every(
    (index, position) => index >= 0 && (position === 0 || index > orderedIndexes[position - 1]),
  );
  if (!hasSafeOrder) {
    errors.push("el orden de la limpieza no es seguro");
  }

  const preservesAuditTriggerState = containsEvery(normalizedSql, [
    "create temporary table audit_log_user_trigger_states on commit drop as",
    "select tgname, tgenabled from",
    "where tgenabled <> 'd'",
    "when 'o' then",
    "when 'r' then",
    "when 'a' then",
    "when 'd' then",
    "enable replica trigger %i",
    "enable always trigger %i",
  ]);
  if (!preservesAuditTriggerState) {
    errors.push("no se preserva el estado de los triggers de audit_log");
  }

  return errors;
}
