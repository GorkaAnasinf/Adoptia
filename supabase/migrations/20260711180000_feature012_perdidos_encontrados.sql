-- FEATURE-012 — Animales perdidos y encontrados.
-- Privacidad primero: la ubicación se REDONDEA (~200 m) en un trigger al
-- guardar, así la coordenada exacta nunca llega a existir en BD y no puede
-- filtrarse por ninguna vía. Caducidad: los avisos abiertos sin actividad en
-- 60 días se archivan por cron.

create type public.lost_found_type as enum ('lost', 'found');
create type public.lost_found_status as enum ('open', 'resolved', 'archived');

create table public.lost_found_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.lost_found_type not null,
  species public.animal_species not null,
  name text,
  description text not null,
  photo_url text,
  location extensions.geography (point, 4326) not null,
  city text,
  status public.lost_found_status not null default 'open',
  resolution_story text,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lost_found_posts_status_idx on public.lost_found_posts (status);
create index lost_found_posts_location_idx on public.lost_found_posts using gist (location);

create trigger lost_found_posts_set_updated_at
  before update on public.lost_found_posts
  for each row execute function public.set_updated_at();

-- Redondeo de privacidad: snap a una rejilla de ~0.002° (~200 m).
create or replace function public.round_lost_found_location()
returns trigger
language plpgsql
as $$
declare
  lat double precision;
  lng double precision;
begin
  if new.location is null then
    return new;
  end if;
  lat := round(extensions.st_y(new.location::extensions.geometry) / 0.002) * 0.002;
  lng := round(extensions.st_x(new.location::extensions.geometry) / 0.002) * 0.002;
  new.location := extensions.st_makepoint(lng, lat)::extensions.geography;
  return new;
end;
$$;

create trigger lost_found_posts_round_location
  before insert or update of location on public.lost_found_posts
  for each row execute function public.round_lost_found_location();

alter table public.lost_found_posts enable row level security;

-- Público: abiertos y resueltos (la historia de un final feliz es visible);
-- archivados solo para su autor y admin.
create policy "lost_found_read" on public.lost_found_posts for select
  using (
    status in ('open', 'resolved')
    or user_id = auth.uid()
    or public.is_admin()
  );

create policy "lost_found_insert_own" on public.lost_found_posts for insert
  with check (user_id = auth.uid());

create policy "lost_found_update_own" on public.lost_found_posts for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

grant select on public.lost_found_posts to anon;
grant select, insert, update on public.lost_found_posts to authenticated;
grant select, insert, update, delete on public.lost_found_posts to service_role;

-- Lectura para el mapa/listado: lat/lng ya redondeados por el trigger.
create or replace function public.lost_found_list()
returns table (
  id uuid,
  type public.lost_found_type,
  species public.animal_species,
  name text,
  description text,
  photo_url text,
  city text,
  status public.lost_found_status,
  lat double precision,
  lng double precision,
  created_at timestamptz
)
language sql
security invoker
set search_path = public, extensions
stable
as $$
  select p.id, p.type, p.species, p.name, p.description, p.photo_url, p.city,
         p.status,
         extensions.st_y(p.location::extensions.geometry) as lat,
         extensions.st_x(p.location::extensions.geometry) as lng,
         p.created_at
  from public.lost_found_posts p
  where p.status = 'open'
  order by p.created_at desc
  limit 500
$$;

grant execute on function public.lost_found_list() to anon, authenticated;

-- ---------- Bucket de fotos de avisos ----------

insert into storage.buckets (id, name, public)
values ('lost-found', 'lost-found', true)
on conflict (id) do nothing;

drop policy if exists "lost_found_public_read" on storage.objects;
create policy "lost_found_public_read" on storage.objects
  for select using (bucket_id = 'lost-found');

drop policy if exists "lost_found_owner_insert" on storage.objects;
create policy "lost_found_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'lost-found'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "lost_found_owner_delete" on storage.objects;
create policy "lost_found_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'lost-found'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
