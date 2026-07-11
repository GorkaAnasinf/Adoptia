-- FEATURE-009 — Citas con calendario y agenda de disponibilidad.
-- La protectora define franjas semanales (availability_slots); el adoptante de
-- una solicitud aprobada reserva un hueco (appointments). La doble reserva se
-- impide en BD con una exclusion constraint sobre el rango horario.

create extension if not exists btree_gist with schema extensions;

-- ---------- Franjas semanales de disponibilidad ----------

create table public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6), -- 0 = domingo (ISO getDay)
  start_time time not null,
  end_time time not null,
  slot_minutes integer not null default 30 check (slot_minutes between 15 and 120),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index availability_slots_shelter_id_idx on public.availability_slots (shelter_id);

create trigger availability_slots_set_updated_at
  before update on public.availability_slots
  for each row execute function public.set_updated_at();

alter table public.availability_slots enable row level security;

-- El horario de visitas de una protectora verificada es información pública
-- (los huecos concretos se calculan en el RPC, que no expone citas ajenas).
create policy "availability_slots_read" on public.availability_slots for select
  using (
    exists (
      select 1 from public.shelters s
      where s.id = shelter_id and (s.status = 'verified' or s.owner_id = auth.uid())
    )
    or public.is_admin()
  );

create policy "availability_slots_owner_write" on public.availability_slots for all
  using (
    exists (select 1 from public.shelters s where s.id = shelter_id and s.owner_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.shelters s where s.id = shelter_id and s.owner_id = auth.uid())
    or public.is_admin()
  );

-- ---------- Citas ----------

create type public.appointment_status as enum
  ('pending', 'confirmed', 'cancelled', 'done', 'no_show');

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.adoption_requests (id) on delete cascade,
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  adopter_id uuid not null references public.profiles (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.appointment_status not null default 'confirmed',
  cancel_reason text,
  cancelled_by uuid references public.profiles (id),
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  -- Doble reserva: dos citas activas de la misma protectora no pueden solapar.
  constraint appointments_no_overlap exclude using gist (
    shelter_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('pending', 'confirmed'))
);

create index appointments_shelter_id_idx on public.appointments (shelter_id);
create index appointments_adopter_id_idx on public.appointments (adopter_id);
create index appointments_request_id_idx on public.appointments (request_id);
create index appointments_starts_at_idx on public.appointments (starts_at);

create trigger appointments_set_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

alter table public.appointments enable row level security;

create policy "appointments_read" on public.appointments for select
  using (
    adopter_id = auth.uid()
    or exists (select 1 from public.shelters s where s.id = shelter_id and s.owner_id = auth.uid())
    or public.is_admin()
  );

-- El adoptante crea su propia cita; la validación de negocio (solicitud
-- aprobada, hueco válido) la hace el route handler.
create policy "appointments_adopter_insert" on public.appointments for insert
  with check (adopter_id = auth.uid() or public.is_admin());

create policy "appointments_update" on public.appointments for update
  using (
    adopter_id = auth.uid()
    or exists (select 1 from public.shelters s where s.id = shelter_id and s.owner_id = auth.uid())
    or public.is_admin()
  )
  with check (
    adopter_id = auth.uid()
    or exists (select 1 from public.shelters s where s.id = shelter_id and s.owner_id = auth.uid())
    or public.is_admin()
  );

-- ---------- Huecos libres ----------
-- Genera los huecos de los próximos p_days días a partir de las franjas
-- activas menos las citas vivas. security definer: no expone las citas de
-- otros (solo devuelve horas libres); filtra protectoras verificadas.
-- Las horas de las franjas se interpretan en Europe/Madrid.

create or replace function public.appointment_free_slots(
  p_shelter_id uuid,
  p_days integer default 14
)
returns table (starts_at timestamptz, ends_at timestamptz, slot_minutes integer)
language sql
security definer
set search_path = public, extensions
stable
as $$
  with dias as (
    select d::date as dia
    from generate_series(
      (now() at time zone 'Europe/Madrid')::date,
      (now() at time zone 'Europe/Madrid')::date + least(greatest(p_days, 1), 60),
      interval '1 day'
    ) d
  ),
  huecos as (
    select
      timezone('Europe/Madrid', dia + fs.start_time + (n || ' minutes')::interval) as starts_at,
      timezone('Europe/Madrid', dia + fs.start_time + ((n + fs.slot_minutes) || ' minutes')::interval) as ends_at,
      fs.slot_minutes
    from public.availability_slots fs
    join public.shelters s on s.id = fs.shelter_id and s.status = 'verified'
    cross join dias
    cross join lateral generate_series(
      0,
      (extract(epoch from (fs.end_time - fs.start_time)) / 60)::integer - fs.slot_minutes,
      fs.slot_minutes
    ) n
    where fs.shelter_id = p_shelter_id
      and fs.active
      and extract(dow from dia)::integer = fs.weekday
  )
  select h.starts_at, h.ends_at, h.slot_minutes
  from huecos h
  where h.starts_at > now()
    and not exists (
      select 1 from public.appointments a
      where a.shelter_id = p_shelter_id
        and a.status in ('pending', 'confirmed')
        and tstzrange(a.starts_at, a.ends_at) && tstzrange(h.starts_at, h.ends_at)
    )
  order by h.starts_at
$$;

grant execute on function public.appointment_free_slots(uuid, integer) to anon, authenticated;

-- Privilegios de tabla (RLS sigue mandando por encima)
grant select on public.availability_slots to anon;
grant select, insert, update, delete on public.availability_slots to authenticated, service_role;
grant select, insert, update, delete on public.appointments to authenticated, service_role;
