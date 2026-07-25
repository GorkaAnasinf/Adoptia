-- FEATURE-062 — Jornadas de adopción (F1).
-- Eventos presenciales de captación que organiza una protectora VERIFICADA.
-- Ubicación PROPIA del evento (una plaza/parque), no la sede: por eso `events`
-- lleva su `location`. Aforo (`capacity`) es informativo. Los animales que van
-- son opcionales (evento genérico permitido). Solo la protectora dueña gestiona
-- su jornada; el público ve las publicadas (no borradores) de verificadas; cada
-- usuario gestiona su propia asistencia (RSVP) y solo la dueña ve la lista.

create type public.event_status as enum ('draft', 'published', 'cancelled', 'finished');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location extensions.geography (point, 4326),   -- ubicación PROPIA del evento
  address text,
  city text,
  poster_url text,                               -- cartel (opcional)
  capacity int,                                  -- aforo informativo (nullable)
  status public.event_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (capacity is null or capacity > 0),
  -- una jornada publicada necesita ubicación para pintarse en el mapa
  check (status <> 'published' or location is not null)
);

create index events_status_starts_idx on public.events (status, starts_at);
create index events_shelter_idx on public.events (shelter_id);
create index events_location_idx on public.events using gist (location);

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- Animales que la protectora lleva a la jornada (opcional).
create table public.event_animals (
  event_id uuid not null references public.events (id) on delete cascade,
  animal_id uuid not null references public.animals (id) on delete cascade,
  primary key (event_id, animal_id)
);

-- Asistencia confirmada (RSVP). Presencia = "voy a ir".
create table public.event_attendees (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- ---------- RLS: events ----------

alter table public.events enable row level security;

-- Público (anon incluido): cualquier estado salvo borrador, de protectora
-- verificada. La dueña ve todas las suyas (borradores incluidos). Admin todo.
create policy "events_public_read" on public.events for select
  using (
    (
      status <> 'draft'
      and exists (
        select 1 from public.shelters s
        where s.id = shelter_id and s.status = 'verified'
      )
    )
    or exists (
      select 1 from public.shelters s
      where s.id = shelter_id and s.owner_id = auth.uid()
    )
    or public.is_admin()
  );

-- Alta: solo la dueña de una protectora VERIFICADA.
create policy "events_owner_insert" on public.events for insert
  with check (
    exists (
      select 1 from public.shelters s
      where s.id = shelter_id and s.owner_id = auth.uid() and s.status = 'verified'
    )
  );

-- Edición: la dueña (verificada) o admin (moderación: cancelar/ocultar).
create policy "events_owner_update" on public.events for update
  using (
    exists (
      select 1 from public.shelters s
      where s.id = shelter_id and s.owner_id = auth.uid() and s.status = 'verified'
    )
    or public.is_admin()
  )
  with check (
    exists (
      select 1 from public.shelters s
      where s.id = shelter_id and s.owner_id = auth.uid() and s.status = 'verified'
    )
    or public.is_admin()
  );

create policy "events_owner_delete" on public.events for delete
  using (
    exists (
      select 1 from public.shelters s
      where s.id = shelter_id and s.owner_id = auth.uid()
    )
    or public.is_admin()
  );

grant select on public.events to anon;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.events to service_role;

-- ---------- RLS: event_animals ----------

alter table public.event_animals enable row level security;

-- Se leen si el evento es legible por el que consulta (misma lógica que events).
create policy "event_animals_read" on public.event_animals for select
  using (
    exists (
      select 1 from public.events e
      join public.shelters s on s.id = e.shelter_id
      where e.id = event_id
        and (
          (e.status <> 'draft' and s.status = 'verified')
          or s.owner_id = auth.uid()
          or public.is_admin()
        )
    )
  );

-- Escritura: la dueña del evento; además el animal debe ser de SU protectora.
create policy "event_animals_owner_write" on public.event_animals for insert
  with check (
    exists (
      select 1 from public.events e
      join public.shelters s on s.id = e.shelter_id
      where e.id = event_id and s.owner_id = auth.uid()
    )
    and exists (
      select 1 from public.animals a
      where a.id = animal_id
        and a.shelter_id = (select shelter_id from public.events where id = event_id)
    )
  );

create policy "event_animals_owner_delete" on public.event_animals for delete
  using (
    exists (
      select 1 from public.events e
      join public.shelters s on s.id = e.shelter_id
      where e.id = event_id and (s.owner_id = auth.uid() or public.is_admin())
    )
  );

grant select on public.event_animals to anon;
grant select, insert, delete on public.event_animals to authenticated;
grant select, insert, update, delete on public.event_animals to service_role;

-- ---------- RLS: event_attendees ----------

alter table public.event_attendees enable row level security;

-- Cada uno ve su propia asistencia; la dueña del evento ve la lista completa
-- (para preparar el aforo); admin todo. Un asistente NO ve a otro asistente.
create policy "event_attendees_read" on public.event_attendees for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.events e
      join public.shelters s on s.id = e.shelter_id
      where e.id = event_id and s.owner_id = auth.uid()
    )
    or public.is_admin()
  );

-- Confirmar: solo la propia fila y solo a un evento PUBLICADO de verificada.
create policy "event_attendees_insert_own" on public.event_attendees for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.events e
      join public.shelters s on s.id = e.shelter_id
      where e.id = event_id and e.status = 'published' and s.status = 'verified'
    )
  );

-- Retirar la asistencia: la propia fila (o admin).
create policy "event_attendees_delete_own" on public.event_attendees for delete
  using (user_id = auth.uid() or public.is_admin());

grant select on public.event_attendees to anon;
grant select, insert, delete on public.event_attendees to authenticated;
grant select, insert, delete on public.event_attendees to service_role;

-- ---------- RPC de descubrimiento ----------

-- Jornadas publicadas y FUTURAS de protectoras verificadas, con coordenadas,
-- nombre de la protectora y recuentos de animales/asistentes. Opcionalmente por
-- proximidad (si se pasan lat/lng/radio): filtra por radio y ordena por
-- distancia y luego por fecha. `security definer` para que los recuentos sean
-- exactos (solo expone agregados, nunca datos personales de los asistentes).
create or replace function public.events_upcoming(
  p_lat double precision default null,
  p_lng double precision default null,
  p_radius_m double precision default null
)
returns table (
  id uuid,
  shelter_id uuid,
  title text,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  city text,
  address text,
  poster_url text,
  capacity int,
  lat double precision,
  lng double precision,
  shelter_name text,
  shelter_slug text,
  animal_count bigint,
  attendee_count bigint,
  distance_m double precision
)
language sql
security definer
set search_path = public, extensions
stable
as $$
  select
    e.id,
    e.shelter_id,
    e.title,
    e.description,
    e.starts_at,
    e.ends_at,
    e.city,
    e.address,
    e.poster_url,
    e.capacity,
    st_y(e.location::geometry) as lat,
    st_x(e.location::geometry) as lng,
    s.name as shelter_name,
    s.slug as shelter_slug,
    (select count(*) from public.event_animals ea where ea.event_id = e.id) as animal_count,
    (select count(*) from public.event_attendees att where att.event_id = e.id) as attendee_count,
    case
      when p_lat is null or p_lng is null then null
      else st_distance(e.location, st_makepoint(p_lng, p_lat)::geography)
    end as distance_m
  from public.events e
  join public.shelters s on s.id = e.shelter_id
  where e.status = 'published'
    and s.status = 'verified'
    and e.ends_at >= now()
    and (
      p_lat is null or p_lng is null or p_radius_m is null
      or (
        e.location is not null
        and st_dwithin(e.location, st_makepoint(p_lng, p_lat)::geography, p_radius_m)
      )
    )
  order by
    (
      case
        when p_lat is not null and p_lng is not null and e.location is not null
        then st_distance(e.location, st_makepoint(p_lng, p_lat)::geography)
      end
    ) nulls last,
    e.starts_at
  limit 500
$$;

grant execute on function public.events_upcoming(double precision, double precision, double precision)
  to anon, authenticated, service_role;

-- Detalle de UNA jornada con coordenadas y recuento de asistentes, para la
-- ficha pública y la edición. `security definer` para dar recuentos exactos,
-- pero con guarda de visibilidad que REPLICA la RLS de lectura: nunca devuelve
-- un borrador a quien no es la dueña/admin.
create or replace function public.event_detail(p_id uuid)
returns table (
  id uuid,
  shelter_id uuid,
  title text,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  address text,
  city text,
  poster_url text,
  capacity int,
  status public.event_status,
  lat double precision,
  lng double precision,
  shelter_name text,
  shelter_slug text,
  attendee_count bigint
)
language sql
security definer
set search_path = public, extensions
stable
as $$
  select
    e.id,
    e.shelter_id,
    e.title,
    e.description,
    e.starts_at,
    e.ends_at,
    e.address,
    e.city,
    e.poster_url,
    e.capacity,
    e.status,
    st_y(e.location::geometry) as lat,
    st_x(e.location::geometry) as lng,
    s.name as shelter_name,
    s.slug as shelter_slug,
    (select count(*) from public.event_attendees att where att.event_id = e.id) as attendee_count
  from public.events e
  join public.shelters s on s.id = e.shelter_id
  where e.id = p_id
    and (
      (e.status <> 'draft' and s.status = 'verified')
      or s.owner_id = auth.uid()
      or public.is_admin()
    )
$$;

grant execute on function public.event_detail(uuid) to anon, authenticated, service_role;

-- ---------- Bucket de carteles ----------

insert into storage.buckets (id, name, public)
values ('event-posters', 'event-posters', true)
on conflict (id) do nothing;

drop policy if exists "event_posters_public_read" on storage.objects;
create policy "event_posters_public_read" on storage.objects
  for select using (bucket_id = 'event-posters');

drop policy if exists "event_posters_owner_insert" on storage.objects;
create policy "event_posters_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'event-posters'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "event_posters_owner_delete" on storage.objects;
create policy "event_posters_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'event-posters'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
