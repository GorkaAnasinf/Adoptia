-- FEATURE-022 — Contacto sin exponer datos y avistamientos ciudadanos.
-- Dos piezas sobre FEATURE-012:
--   1) El autor puede publicar un teléfono (opt-in) y permitir/impedir que le
--      escriban por la plataforma. Su email NUNCA sale de auth.users: el relay
--      lo resuelve el servidor con service_role.
--   2) lost_found_sightings: pistas de vecinos sobre un aviso abierto. El pin
--      pasa por el MISMO redondeo de ~200 m que el aviso (reusa la función de
--      FEATURE-012): un pin exacto delataría dónde vive quien reporta.

-- ---------- 1. Contacto opt-in en el aviso ----------

alter table public.lost_found_posts
  add column contact_phone text
    check (contact_phone is null or contact_phone ~ '^[+0-9][0-9 ]{5,19}$'),
  add column allow_contact boolean not null default true;

comment on column public.lost_found_posts.contact_phone is
  'Teléfono público opt-in: solo si el autor lo teclea. Nunca se rellena solo.';

-- ---------- 2. Avistamientos ----------

create table public.lost_found_sightings (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.lost_found_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  seen_at timestamptz not null check (seen_at <= now() + interval '5 minutes'),
  note text,
  photo_url text,
  location extensions.geography (point, 4326) not null,
  created_at timestamptz not null default now()
);

create index lost_found_sightings_post_idx on public.lost_found_sightings (post_id, seen_at desc);
create index lost_found_sightings_location_idx on public.lost_found_sightings using gist (location);

-- Mismo redondeo de privacidad que el aviso: la función de FEATURE-012 opera
-- sobre `new.location`, así que sirve tal cual.
create trigger lost_found_sightings_round_location
  before insert or update of location on public.lost_found_sightings
  for each row execute function public.round_lost_found_location();

-- Una pista fresca es actividad: el cron de 60 días no debe archivar un aviso
-- que la gente sigue alimentando.
create or replace function public.bump_lost_found_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.lost_found_posts
     set last_activity_at = now()
   where id = new.post_id;
  return new;
end;
$$;

create trigger lost_found_sightings_bump_activity
  after insert on public.lost_found_sightings
  for each row execute function public.bump_lost_found_activity();

alter table public.lost_found_sightings enable row level security;

-- Lectura: pública solo si el aviso padre es público (open/resolved). Si el
-- aviso se archiva, sus pistas se archivan con él.
create policy "lost_found_sightings_read" on public.lost_found_sightings for select
  using (
    exists (
      select 1 from public.lost_found_posts p
      where p.id = post_id
        and (p.status in ('open', 'resolved') or p.user_id = auth.uid())
    )
    or user_id = auth.uid()
    or public.is_admin()
  );

-- Escritura: solo en nombre propio y solo sobre avisos abiertos.
create policy "lost_found_sightings_insert_own" on public.lost_found_sightings for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.lost_found_posts p
      where p.id = post_id and p.status = 'open'
    )
  );

create policy "lost_found_sightings_update_own" on public.lost_found_sightings for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- Borrado: quien reporta se retracta, el autor del aviso barre spam de su
-- ficha, y admin todo.
create policy "lost_found_sightings_delete" on public.lost_found_sightings for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.lost_found_posts p
      where p.id = post_id and p.user_id = auth.uid()
    )
    or public.is_admin()
  );

grant select on public.lost_found_sightings to anon;
grant select, insert, update, delete on public.lost_found_sightings to authenticated;
grant select, insert, update, delete on public.lost_found_sightings to service_role;

-- Lectura para la ficha: lat/lng ya redondeados. Sin user_id — quién reporta
-- no es asunto público (minimización).
create or replace function public.lost_found_sightings_list(p_post_id uuid)
returns table (
  id uuid,
  seen_at timestamptz,
  note text,
  photo_url text,
  lat double precision,
  lng double precision,
  created_at timestamptz
)
language sql
security invoker
set search_path = public, extensions
stable
as $$
  select s.id, s.seen_at, s.note, s.photo_url,
         extensions.st_y(s.location::extensions.geometry) as lat,
         extensions.st_x(s.location::extensions.geometry) as lng,
         s.created_at
  from public.lost_found_sightings s
  where s.post_id = p_post_id
  order by s.seen_at desc
  limit 100
$$;

grant execute on function public.lost_found_sightings_list(uuid) to anon, authenticated;
