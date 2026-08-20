import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { validateCleanupSeed, validateDemoSeed } from "../../scripts/validate-seed-sql";

const DEMO_PASSWORD = ["A", ".doptia", "!Demo"].join("");

const COMPLETE_DEMO_SEED = `
  begin;
  create temporary table demo_expected_users (
    id uuid primary key,
    email text not null unique,
    password_login_enabled boolean not null
  );
  insert into demo_expected_users (id, email, password_login_enabled) values
    ('d0000000-0000-4000-8000-000000000001','protectoraaitana@adoptiademo.com',true),
    ('d0000000-0000-4000-8000-000000000002','protectorabaluarte@adoptiademo.com',true),
    ('d0000000-0000-4000-8000-000000000003','protectoracalima@adoptiademo.com',true),
    ('d0000000-0000-4000-8000-000000000004','protectoraduero@adoptiademo.com',true),
    ('d0000000-0000-4000-8000-000000000005','protectoraespiga@adoptiademo.com',true),
    ('d0000000-0000-4000-8000-000000000006','protectorafaro@adoptiademo.com',true),
    ('d0000000-0000-4000-8000-000000000007','protectoragaraia@adoptiademo.com',true),
    ('d0000000-0000-4000-8000-000000000008','protectorahuerta@adoptiademo.com',true),
    ('d0000000-0000-4000-8000-000000000011','adoptantealcaraz@adoptiademo.com',true),
    ('d0000000-0000-4000-8000-000000000012','adoptantebeltran@adoptiademo.com',true),
    ('d0000000-0000-4000-8000-000000000013','adoptantecarmona@adoptiademo.com',true),
    ('d0000000-0000-4000-8000-000000000014','adoptantedelgado@adoptiademo.com',true),
    ('d0000000-0000-4000-8000-000000000015','adoptanteesteban@adoptiademo.com',true),
    ('d0000000-0000-4000-8000-000000000016','adoptantefuentes@adoptiademo.com',true),
    ('d0000000-0000-4000-8000-000000000017','adoptantegallardo@adoptiademo.com',true),
    ('d0000000-0000-4000-8000-000000000018','adoptanteherrero@adoptiademo.com',true),
    ('d0000000-0000-4000-8000-000000000019','adoptanteiglesias@adoptiademo.com',true),
    ('d0000000-0000-4000-8000-000000000020','adoptantejimenez@adoptiademo.com',true),
    ('d0000000-0000-4000-8000-000000000031','admin@adoptiademo.com',false);
  create temporary table demo_seed_config (demo_password text not null);
  insert into demo_seed_config values ('${DEMO_PASSWORD}');
  drop table if exists demo_expected_users;
  drop table if exists demo_seed_config;

  do $$
  begin
    if exists (
      select 1
      from demo_expected_users e
      join auth.users u on u.id = e.id
      where lower(u.email) <> e.email
    ) then
      raise exception 'UUID demo ocupado por otro email';
    end if;
    if exists (
      select 1
      from demo_expected_users e
      join auth.users u on lower(u.email) = e.email
      where u.id <> e.id
    ) then
      raise exception 'Email demo ocupado por otro UUID';
    end if;
    if exists (
      select 1
      from demo_expected_users e
      join auth.identities i
        on i.provider = 'email' and i.provider_id = e.id::text
      where i.user_id <> e.id
    ) then
      raise exception 'Identidad canonica asociada a otro usuario';
    end if;
    if exists (
      select 1 from public.shelters s
      where s.owner_id in (select id from demo_expected_users)
         or s.id::text like 'd1000000-0000-4000-8000-%'
    ) or exists (
      select 1 from public.animals a
      where a.id::text like 'd2000000-0000-4000-8000-%'
    ) then
      raise exception 'Restos comerciales detectados';
    end if;
  end
  $$;

  insert into auth.users (id, email, encrypted_password, instance_id, aud, role,
    email_confirmed_at, banned_until, is_sso_user, is_anonymous, deleted_at)
  select e.id, e.email,
    case when e.password_login_enabled
      then extensions.crypt(c.demo_password, extensions.gen_salt('bf'))
      else extensions.crypt(encode(extensions.gen_random_bytes(32), 'hex'), extensions.gen_salt('bf'))
    end,
    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', now(),
    case when e.password_login_enabled then null else timestamptz '9999-12-31 00:00:00+00' end,
    false, false, null
  from demo_expected_users e cross join demo_seed_config c
  on conflict (id) do update
  set encrypted_password = excluded.encrypted_password,
      instance_id = excluded.instance_id,
      email_confirmed_at = excluded.email_confirmed_at,
      banned_until = excluded.banned_until,
      deleted_at = null,
      is_sso_user = false,
      is_anonymous = false;

  insert into public.profiles (id, role, full_name)
  select id, 'adopter', email from demo_expected_users
  on conflict (id) do update set full_name = excluded.full_name;

  delete from auth.identities i
  where i.user_id in (select id from demo_expected_users);
  insert into auth.identities (id, provider_id, user_id, identity_data, provider)
  select gen_random_uuid(), e.id::text, e.id,
    jsonb_build_object('sub', e.id::text, 'email', e.email), 'email'
  from demo_expected_users e
  on conflict (provider_id, provider) do update
  set user_id = excluded.user_id, identity_data = excluded.identity_data;

  do $$
  declare
    v_mapeo_incorrecto integer;
    v_cuentas_login integer;
    v_admin_deshabilitado integer;
    v_perfiles integer;
    v_identidades_total integer;
    v_identidades_canonicas integer;
    v_protectoras integer;
    v_animales integer;
  begin
    select count(*) into v_mapeo_incorrecto
    from demo_expected_users e
    full join (
      select au.id, lower(au.email) as email
      from auth.users au
      where lower(au.email) like '%@adoptiademo.com'
         or au.id in (select id from demo_expected_users)
    ) u on u.id = e.id and u.email = e.email
    where e.id is null or u.id is null;
    select count(*) into v_cuentas_login
    from auth.users u
    join demo_expected_users e on e.id = u.id and e.email = lower(u.email)
    cross join demo_seed_config c
    where e.password_login_enabled
      and extensions.crypt(c.demo_password, u.encrypted_password) = u.encrypted_password;
    select count(*) into v_admin_deshabilitado
    from auth.users u join demo_expected_users e on e.id = u.id
    cross join demo_seed_config c
    where not e.password_login_enabled
      and extensions.crypt(c.demo_password, u.encrypted_password) <> u.encrypted_password
      and u.banned_until = timestamptz '9999-12-31 00:00:00+00';
    select count(*) into v_perfiles from public.profiles;
    select count(*) into v_identidades_total from auth.identities;
    select count(*) into v_identidades_canonicas from auth.identities;
    select count(*) into v_protectoras from public.shelters;
    select count(*) into v_animales from public.animals;
    if v_mapeo_incorrecto <> 0 then raise exception 'mapeo'; end if;
    if v_cuentas_login <> 18 then raise exception 'login'; end if;
    if v_admin_deshabilitado <> 1 then raise exception 'admin'; end if;
    if v_perfiles <> 19 then raise exception 'perfiles'; end if;
    if v_identidades_total <> 19 then raise exception 'identidades'; end if;
    if v_identidades_canonicas <> 19 then raise exception 'identidades canonicas'; end if;
    if v_protectoras <> 8 then raise exception 'protectoras'; end if;
    if v_animales <> 40 then raise exception 'animales'; end if;
  end
  $$;
  commit;
`;

const COMPLETE_CLEANUP_SEED = `
  begin;
  lock table auth.users in share row exclusive mode;
  create temporary table seed_user_ids as
  select id from auth.users
  where lower(email) like '%@adoptiademo.com'
    or lower(email) like '%@circuito.adoptia.es'
    or lower(email) like '%@masivo.adoptia.es';
  create temporary table seed_shelter_ids as
  select id from public.shelters
  where owner_id in (select id from seed_user_ids);
  create temporary table audit_log_user_trigger_states as
  select tgname, tgenabled from pg_trigger
  where tgrelid = 'public.audit_log'::regclass and not tgisinternal;
  do $$
  declare trigger_row record;
  begin
    for trigger_row in select tgname from audit_log_user_trigger_states where tgenabled <> 'D'
    loop
      execute format('alter table public.audit_log disable trigger %I', trigger_row.tgname);
    end loop;
  end
  $$;
  delete from public.audit_log where admin_id in (select id from seed_user_ids);
  do $$
  declare trigger_row record;
  begin
    for trigger_row in select tgname, tgenabled from audit_log_user_trigger_states loop
      case trigger_row.tgenabled
        when 'O' then execute format('alter table public.audit_log enable trigger %I', trigger_row.tgname);
        when 'R' then execute format('alter table public.audit_log enable replica trigger %I', trigger_row.tgname);
        when 'A' then execute format('alter table public.audit_log enable always trigger %I', trigger_row.tgname);
        when 'D' then execute format('alter table public.audit_log disable trigger %I', trigger_row.tgname);
      end case;
    end loop;
  end
  $$;
  do $$
  declare
    remaining_user_count bigint;
    remaining_profile_count bigint;
    remaining_shelter_count bigint;
    remaining_animal_count bigint;
  begin
    delete from auth.users u
    where u.id in (select id from seed_user_ids)
      and (
        lower(u.email) like '%@adoptiademo.com'
        or lower(u.email) like '%@circuito.adoptia.es'
        or lower(u.email) like '%@masivo.adoptia.es'
      );
    select count(*) into remaining_user_count from auth.users u
    where lower(u.email) like '%@adoptiademo.com'
       or lower(u.email) like '%@circuito.adoptia.es'
       or lower(u.email) like '%@masivo.adoptia.es';
    select count(*) into remaining_profile_count from public.profiles
    where id in (select id from seed_user_ids);
    select count(*) into remaining_shelter_count from public.shelters
    where owner_id in (select id from seed_user_ids);
    select count(*) into remaining_animal_count from public.animals a
    where a.shelter_id in (select id from seed_shelter_ids);
    if remaining_user_count <> 0
       or remaining_profile_count <> 0
       or remaining_shelter_count <> 0
       or remaining_animal_count <> 0 then
      raise exception 'La limpieza dejo restos';
    end if;
  end
  $$;
  drop table if exists seed_user_ids;
  drop table if exists seed_shelter_ids;
  drop table if exists audit_log_user_trigger_states;
  commit;
`;

describe("contrato SQL de los seeds", () => {
  it("rechaza un seed demo que no crea identidades ni valida credenciales", () => {
    const errors = validateDemoSeed("insert into auth.users values (...); on conflict (id) do nothing;");

    expect(errors).toContain("falta una transacción explícita");
    expect(errors).toContain("falta el upsert de credenciales");
    expect(errors).toContain("faltan identidades email");
    expect(errors).toContain("faltan aserciones de autenticación");
  });

  it("exige BEGIN primero y COMMIT último en el seed demo", () => {
    const errors = validateDemoSeed(`select 1; ${COMPLETE_DEMO_SEED} select 2;`);

    expect(errors).toContain("falta una transacción explícita");
  });

  it("rechaza un upsert que no pertenece a auth.users", () => {
    const sql = `
      begin;
      insert into auth.users values (...);
      insert into public.profiles values (...) on conflict (id) do update set full_name = excluded.full_name;
      insert into auth.identities values (...);
      select extensions.crypt('${DEMO_PASSWORD}', u.encrypted_password);
      commit;
    `;

    expect(validateDemoSeed(sql)).toContain("falta el upsert de credenciales");
  });

  it("exige preflight de UUID, email e identidad antes de mutar Auth", () => {
    const sql = COMPLETE_DEMO_SEED.replace(/do \$\$[\s\S]*?\$\$;/, "");

    expect(validateDemoSeed(sql)).toContain("falta el preflight de colisiones Auth");
  });

  it("exige el mapeo exacto de los 19 UUID y emails demo", () => {
    const sql = COMPLETE_DEMO_SEED.replace(
      "admin@adoptiademo.com',false",
      "administracion@adoptiademo.com',false",
    );

    expect(validateDemoSeed(sql)).toContain("falta el mapeo exacto de usuarios demo");
  });

  it("exige detectar restos comerciales en el preflight antes de mutar Auth", () => {
    const sql = COMPLETE_DEMO_SEED.replace(
      /if exists \(\s*select 1 from public\.shelters[\s\S]*?Restos comerciales detectados';\s*end if;/,
      "",
    );

    expect(validateDemoSeed(sql)).toContain("falta el preflight de restos comerciales");
  });

  it("exige identidad email canónica", () => {
    const sql = COMPLETE_DEMO_SEED.replace(
      "jsonb_build_object('sub', e.id::text, 'email', e.email), 'email'",
      "jsonb_build_object('sub', e.id::text, 'email', e.email), 'github'",
    );

    expect(validateDemoSeed(sql)).toContain("faltan identidades email canónicas");
  });

  it("exige reconstruir identidades solo después de borrar las anteriores", () => {
    const sql = COMPLETE_DEMO_SEED.replace(
      /delete from auth\.identities i[\s\S]*?demo_expected_users\);/,
      "",
    );

    expect(validateDemoSeed(sql)).toContain("no se reconstruyen las identidades demo");
  });

  it("exige perfiles y cardinalidades finales reales", () => {
    const sql = COMPLETE_DEMO_SEED
      .replace("insert into public.profiles", "insert into public.profile_copies")
      .replace("if v_animales <> 40", "if v_animales <> 39");

    const errors = validateDemoSeed(sql);
    expect(errors).toContain("faltan perfiles demo");
    expect(errors).toContain("faltan cardinalidades finales");
  });

  it("exige una aserción bidireccional del mapeo final", () => {
    const sql = COMPLETE_DEMO_SEED.replace("full join (", "left join (");

    expect(validateDemoSeed(sql)).toContain("falta la aserción final del mapeo demo");
  });

  it("exige 18 cuentas habilitadas y un admin bloqueado con otro hash", () => {
    const sql = COMPLETE_DEMO_SEED
      .replace("is_anonymous = false", "is_anonymous = true")
      .replace("if v_admin_deshabilitado <> 1", "if v_admin_deshabilitado <> 0");

    const errors = validateDemoSeed(sql);
    expect(errors).toContain("faltan invariantes completas de Auth");
    expect(errors).toContain("la cuenta admin no queda deshabilitada");
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

  it("exige bloquear escrituras concurrentes sobre auth.users", () => {
    const sql = COMPLETE_CLEANUP_SEED.replace(
      "lock table auth.users in share row exclusive mode;",
      "",
    );

    expect(validateCleanupSeed(sql)).toContain("falta bloquear auth.users durante la limpieza");
  });

  it("exige que seed_user_ids se cree con el allowlist exacto", () => {
    const sql = COMPLETE_CLEANUP_SEED.replace(
      "create temporary table seed_user_ids as",
      "create temporary table seed_user_ids as select id from auth.users; --",
    );

    expect(validateCleanupSeed(sql)).toContain("seed_user_ids no se crea con el allowlist esperado");
  });

  it("rechaza atar las temporales al COMMIT (rompe en el SQL Editor)", () => {
    const sql = COMPLETE_CLEANUP_SEED.replace(
      "create temporary table seed_shelter_ids as",
      "create temporary table seed_shelter_ids on commit drop as",
    );

    expect(validateCleanupSeed(sql)).toContain(
      "las tablas temporales no pueden depender del COMMIT",
    );
  });

  it("exige liberar las temporales de la limpieza", () => {
    const sql = COMPLETE_CLEANUP_SEED.replace("drop table if exists seed_user_ids;", "");

    expect(validateCleanupSeed(sql)).toContain("la limpieza no libera sus tablas temporales");
  });

  it("exige revalidar el allowlist en el propio DELETE", () => {
    const sql = COMPLETE_CLEANUP_SEED.replace(
      /delete from auth\.users u[\s\S]*?\n\s*\);/,
      "delete from auth.users u where u.id in (select id from seed_user_ids);",
    );

    expect(validateCleanupSeed(sql)).toContain("el DELETE no revalida los tres dominios");
  });

  it("exige que el lock ocurra antes de capturar el allowlist", () => {
    const lock = "lock table auth.users in share row exclusive mode;";
    const sql = COMPLETE_CLEANUP_SEED.replace(lock, "").replace("commit;", `${lock} commit;`);

    expect(validateCleanupSeed(sql)).toContain("el orden de la limpieza no es seguro");
  });

  it("rechaza un borrado de audit_log sin el filtro de IDs capturados", () => {
    const sql = COMPLETE_CLEANUP_SEED.replace(
      "delete from public.audit_log where admin_id in (select id from seed_user_ids);",
      "delete from public.audit_log;",
    );

    expect(validateCleanupSeed(sql)).toContain(
      "la limpieza contiene DML destructivo fuera del contrato",
    );
  });

  it("exige comprobar usuarios, perfiles, protectoras y animales restantes", () => {
    const sql = COMPLETE_CLEANUP_SEED.replace(
      /select count\(\*\) into remaining_animal_count[\s\S]*?seed_shelter_ids\);/,
      "",
    );

    expect(validateCleanupSeed(sql)).toContain("faltan aserciones finales de limpieza");
  });

  it("exige capturar las protectoras antes del borrado para reconsultar sus animales", () => {
    const sql = COMPLETE_CLEANUP_SEED.replace(
      /create temporary table seed_shelter_ids[\s\S]*?seed_user_ids\);/,
      "",
    );

    expect(validateCleanupSeed(sql)).toContain("faltan aserciones finales de limpieza");
  });

  it("exige restaurar el estado exacto de los triggers de audit_log", () => {
    const sql = COMPLETE_CLEANUP_SEED
      .split("audit_log_user_trigger_states")
      .join("audit_log_trigger_names");

    expect(validateCleanupSeed(sql)).toContain("no se preserva el estado de los triggers de audit_log");
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

  it("rechaza un segundo delete con identificadores auth.users entre comillas", () => {
    const sql = `
      begin;
      create temporary table seed_user_ids as
      select id from auth.users
      where lower(email) like '%@adoptiademo.com'
        or lower(email) like '%@circuito.adoptia.es'
        or lower(email) like '%@masivo.adoptia.es';
      delete from auth.users where id in (select id from seed_user_ids);
      delete from "auth"."users" where true;
      commit;
    `;

    expect(validateCleanupSeed(sql)).toContain(
      "la limpieza no está limitada a los tres dominios de seed",
    );
  });

  it("rechaza un segundo delete con comentarios entre auth, punto y users", () => {
    const sql = `
      begin;
      create temporary table seed_user_ids as
      select id from auth.users
      where lower(email) like '%@adoptiademo.com'
        or lower(email) like '%@circuito.adoptia.es'
        or lower(email) like '%@masivo.adoptia.es';
      delete from auth.users where id in (select id from seed_user_ids);
      delete from auth /* esquema */ . /* tabla */ users where true;
      commit;
    `;

    expect(validateCleanupSeed(sql)).toContain(
      "la limpieza no está limitada a los tres dominios de seed",
    );
  });

  it("rechaza SQL dinámico que recompone otra referencia a auth.users", () => {
    const sql = `
      begin;
      create temporary table seed_user_ids as
      select id from auth.users
      where lower(email) like '%@adoptiademo.com'
        or lower(email) like '%@circuito.adoptia.es'
        or lower(email) like '%@masivo.adoptia.es';
      delete from auth.users where id in (select id from seed_user_ids);
      execute 'delete from ' || 'auth' || '.' || 'users where true';
      commit;
    `;

    expect(validateCleanupSeed(sql)).toContain(
      "la limpieza no está limitada a los tres dominios de seed",
    );
  });

  it("acepta un seed demo con estructura completa de Auth y cardinalidades", () => {
    expect(validateDemoSeed(COMPLETE_DEMO_SEED)).toEqual([]);
  });

  it("acepta una limpieza bloqueada, revalidada y con aserciones finales", () => {
    expect(validateCleanupSeed(COMPLETE_CLEANUP_SEED)).toEqual([]);
  });

  it("no contiene el literal de la contraseña demo en ningún archivo rastreado", () => {
    const result = spawnSync(
      "git",
      ["grep", "-n", "-F", DEMO_PASSWORD, "--", ".", ":(exclude)bdseed/**"],
      { encoding: "utf8" },
    );

    expect(result.status, result.stdout || result.stderr).toBe(1);
  });
});
