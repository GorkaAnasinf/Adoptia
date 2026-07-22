-- FEATURE-053 — Excepciones por día de la agenda de disponibilidad.
-- El patrón semanal (availability_slots) sigue siendo la base; esta tabla
-- guarda las excepciones de fechas concretas: día cerrado (vacaciones/festivo)
-- u horario especial que sustituye al patrón ese día. El RPC de huecos libres
-- se reescribe para aplicar estas excepciones.

-- ---------- Excepciones por fecha ----------

create table public.availability_overrides (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  date date not null,
  closed boolean not null default false,
  slots jsonb not null default '[]'::jsonb, -- [{start,end,minutes}] si no closed
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shelter_id, date),
  check (jsonb_typeof(slots) = 'array'),
  check (not closed or slots = '[]'::jsonb) -- cerrado ⇒ sin franjas
);

create index availability_overrides_shelter_date_idx
  on public.availability_overrides (shelter_id, date);

create trigger availability_overrides_set_updated_at
  before update on public.availability_overrides
  for each row execute function public.set_updated_at();

alter table public.availability_overrides enable row level security;

-- Lectura: espejo de availability_slots. El horario de una protectora
-- verificada es público; la dueña ve el suyo aunque no esté verificada.
create policy "availability_overrides_read" on public.availability_overrides for select
  using (
    exists (
      select 1 from public.shelters s
      where s.id = shelter_id and (s.status = 'verified' or s.owner_id = auth.uid())
    )
    or public.is_admin()
  );

create policy "availability_overrides_owner_write" on public.availability_overrides for all
  using (
    exists (select 1 from public.shelters s where s.id = shelter_id and s.owner_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.shelters s where s.id = shelter_id and s.owner_id = auth.uid())
    or public.is_admin()
  );

grant select on public.availability_overrides to anon;
grant select, insert, update, delete on public.availability_overrides to authenticated, service_role;

-- ---------- Huecos libres con excepciones ----------
-- Reescribe appointment_free_slots: por cada día del rango, la fuente de
-- franjas es el override (cerrado ⇒ nada; con slots ⇒ ese horario) o, en su
-- defecto, el patrón semanal. Después resta las citas vivas. Horas en
-- Europe/Madrid. Misma firma y grants que la versión de FEATURE-009.

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
  ov as (
    select o.date, o.closed, o.slots
    from public.availability_overrides o
    where o.shelter_id = p_shelter_id
  ),
  -- Días con horario especial (override no cerrado y con franjas).
  huecos_especiales as (
    select
      timezone('Europe/Madrid', dias.dia + (s->>'start')::time + (n || ' minutes')::interval) as starts_at,
      timezone('Europe/Madrid', dias.dia + (s->>'start')::time + ((n + (s->>'minutes')::int) || ' minutes')::interval) as ends_at,
      (s->>'minutes')::int as slot_minutes
    from dias
    join ov on ov.date = dias.dia and not ov.closed and jsonb_array_length(ov.slots) > 0
    join public.shelters sh on sh.id = p_shelter_id and sh.status = 'verified'
    cross join lateral jsonb_array_elements(ov.slots) s
    cross join lateral generate_series(
      0,
      (extract(epoch from ((s->>'end')::time - (s->>'start')::time)) / 60)::integer - (s->>'minutes')::int,
      (s->>'minutes')::int
    ) n
  ),
  -- Días que siguen el patrón semanal: sin override, o con override neutro
  -- (no cerrado y sin franjas). Los días cerrados quedan fuera de ambas CTE.
  huecos_patron as (
    select
      timezone('Europe/Madrid', dias.dia + fs.start_time + (n || ' minutes')::interval) as starts_at,
      timezone('Europe/Madrid', dias.dia + fs.start_time + ((n + fs.slot_minutes) || ' minutes')::interval) as ends_at,
      fs.slot_minutes
    from dias
    left join ov on ov.date = dias.dia
    join public.availability_slots fs
      on fs.shelter_id = p_shelter_id
      and fs.active
      and extract(dow from dias.dia)::integer = fs.weekday
    join public.shelters sh on sh.id = fs.shelter_id and sh.status = 'verified'
    cross join lateral generate_series(
      0,
      (extract(epoch from (fs.end_time - fs.start_time)) / 60)::integer - fs.slot_minutes,
      fs.slot_minutes
    ) n
    where ov.date is null
       or (not ov.closed and jsonb_array_length(ov.slots) = 0)
  ),
  huecos as (
    select * from huecos_especiales
    union all
    select * from huecos_patron
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
