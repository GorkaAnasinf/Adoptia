-- ============================================================
-- ADOPTIA — Migración baseline (FEATURE-000)
-- Esquema fase 1: profiles, shelters, animals, animal_media,
-- shelter_media, adoption_requests. RLS deny-by-default en todo.
-- ============================================================

-- ---------- Extensiones ----------
create extension if not exists postgis with schema extensions;

-- ---------- Enums ----------
create type public.user_role as enum ('adopter', 'shelter', 'admin');
create type public.shelter_status as enum ('pending', 'verified', 'suspended');
create type public.animal_species as enum ('dog', 'cat', 'other');
create type public.animal_sex as enum ('male', 'female', 'unknown');
create type public.animal_size as enum ('small', 'medium', 'large');
create type public.animal_status as enum ('available', 'reserved', 'adopted', 'fostered', 'not_listed');
create type public.energy_level as enum ('low', 'medium', 'high');
create type public.media_type as enum ('photo', 'video', 'youtube');
create type public.request_status as enum ('pending', 'approved', 'rejected', 'withdrawn', 'completed');

-- ---------- Utilidades ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- profiles (extiende auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'adopter',
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- is_admin como security definer para evitar recursión RLS sobre profiles
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create policy "profiles_self_read" on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_self_update" on public.profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- El rol es inmutable para el propio usuario (solo admin o service_role)
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'No puedes cambiar tu propio rol';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- Alta automática de profile al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'adopter'),
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- shelters ----------
create table public.shelters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  cif text,
  email text,
  phone text,
  website text,
  address text,
  city text,
  province text,
  postal_code text,
  location extensions.geography (point, 4326),
  logo_url text,
  status public.shelter_status not null default 'pending',
  social_links jsonb,
  opening_hours jsonb,
  accepts_volunteers boolean not null default false,
  accepts_fostering boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shelters_location_idx on public.shelters using gist (location);
create index shelters_owner_id_idx on public.shelters (owner_id);

create trigger shelters_set_updated_at
  before update on public.shelters
  for each row execute function public.set_updated_at();

alter table public.shelters enable row level security;

create policy "shelters_public_read" on public.shelters for select
  using (status = 'verified' or owner_id = auth.uid() or public.is_admin());

create policy "shelters_owner_insert" on public.shelters for insert
  with check (owner_id = auth.uid() or public.is_admin());

create policy "shelters_owner_update" on public.shelters for update
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy "shelters_owner_delete" on public.shelters for delete
  using (owner_id = auth.uid() or public.is_admin());

-- ---------- animals ----------
create table public.animals (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  name text not null,
  slug text not null unique,
  species public.animal_species not null,
  breed text,
  sex public.animal_sex not null default 'unknown',
  birth_date_approx date,
  size public.animal_size,
  weight_kg numeric,
  status public.animal_status not null default 'available',
  description text,
  good_with_kids boolean,
  good_with_dogs boolean,
  good_with_cats boolean,
  apartment_suitable boolean,
  energy_level public.energy_level,
  special_needs text,
  vaccinated boolean not null default false,
  sterilized boolean not null default false,
  microchipped boolean not null default false,
  health_notes text,
  adoption_fee numeric,
  entry_date date,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index animals_shelter_id_idx on public.animals (shelter_id);
create index animals_status_published_idx on public.animals (status, published_at);

create trigger animals_set_updated_at
  before update on public.animals
  for each row execute function public.set_updated_at();

alter table public.animals enable row level security;

-- Lectura pública SOLO de contenido publicado de protectora verificada
create policy "animals_public_read" on public.animals for select
  using (
    (published_at is not null
     and exists (
       select 1 from public.shelters s
       where s.id = shelter_id and s.status = 'verified'
     ))
    or exists (
      select 1 from public.shelters s
      where s.id = shelter_id and s.owner_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "animals_owner_write" on public.animals for all
  using (
    exists (
      select 1 from public.shelters s
      where s.id = shelter_id and s.owner_id = auth.uid()
    )
    or public.is_admin()
  )
  with check (
    exists (
      select 1 from public.shelters s
      where s.id = shelter_id and s.owner_id = auth.uid()
    )
    or public.is_admin()
  );

-- ---------- animal_media ----------
create table public.animal_media (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals (id) on delete cascade,
  type public.media_type not null default 'photo',
  url text not null,
  is_cover boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index animal_media_animal_id_idx on public.animal_media (animal_id);

alter table public.animal_media enable row level security;

create policy "animal_media_public_read" on public.animal_media for select
  using (
    exists (
      select 1
      from public.animals a
      join public.shelters s on s.id = a.shelter_id
      where a.id = animal_id
        and ((a.published_at is not null and s.status = 'verified')
             or s.owner_id = auth.uid())
    )
    or public.is_admin()
  );

create policy "animal_media_owner_write" on public.animal_media for all
  using (
    exists (
      select 1
      from public.animals a
      join public.shelters s on s.id = a.shelter_id
      where a.id = animal_id and s.owner_id = auth.uid()
    )
    or public.is_admin()
  )
  with check (
    exists (
      select 1
      from public.animals a
      join public.shelters s on s.id = a.shelter_id
      where a.id = animal_id and s.owner_id = auth.uid()
    )
    or public.is_admin()
  );

-- ---------- shelter_media ----------
create table public.shelter_media (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  type public.media_type not null default 'photo',
  url text not null,
  is_cover boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index shelter_media_shelter_id_idx on public.shelter_media (shelter_id);

alter table public.shelter_media enable row level security;

create policy "shelter_media_public_read" on public.shelter_media for select
  using (
    exists (
      select 1 from public.shelters s
      where s.id = shelter_id
        and (s.status = 'verified' or s.owner_id = auth.uid())
    )
    or public.is_admin()
  );

create policy "shelter_media_owner_write" on public.shelter_media for all
  using (
    exists (
      select 1 from public.shelters s
      where s.id = shelter_id and s.owner_id = auth.uid()
    )
    or public.is_admin()
  )
  with check (
    exists (
      select 1 from public.shelters s
      where s.id = shelter_id and s.owner_id = auth.uid()
    )
    or public.is_admin()
  );

-- ---------- adoption_requests ----------
create table public.adoption_requests (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals (id) on delete cascade,
  adopter_id uuid not null references public.profiles (id) on delete cascade,
  status public.request_status not null default 'pending',
  questionnaire jsonb,
  message text,
  shelter_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (animal_id, adopter_id)
);

create index adoption_requests_animal_id_idx on public.adoption_requests (animal_id);
create index adoption_requests_adopter_id_idx on public.adoption_requests (adopter_id);

create trigger adoption_requests_set_updated_at
  before update on public.adoption_requests
  for each row execute function public.set_updated_at();

alter table public.adoption_requests enable row level security;

-- Visible para el adoptante que la creó y la protectora del animal
create policy "adoption_requests_read" on public.adoption_requests for select
  using (
    adopter_id = auth.uid()
    or exists (
      select 1
      from public.animals a
      join public.shelters s on s.id = a.shelter_id
      where a.id = animal_id and s.owner_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "adoption_requests_adopter_insert" on public.adoption_requests for insert
  with check (adopter_id = auth.uid() or public.is_admin());

-- El adoptante retira la suya; la protectora gestiona estado/notas
create policy "adoption_requests_update" on public.adoption_requests for update
  using (
    adopter_id = auth.uid()
    or exists (
      select 1
      from public.animals a
      join public.shelters s on s.id = a.shelter_id
      where a.id = animal_id and s.owner_id = auth.uid()
    )
    or public.is_admin()
  )
  with check (
    adopter_id = auth.uid()
    or exists (
      select 1
      from public.animals a
      join public.shelters s on s.id = a.shelter_id
      where a.id = animal_id and s.owner_id = auth.uid()
    )
    or public.is_admin()
  );

-- ---------- RPC: protectoras cercanas (PostGIS) ----------
create or replace function public.shelters_nearby(lat double precision, lng double precision, radius_m double precision)
returns table (
  id uuid,
  name text,
  slug text,
  city text,
  distance_m double precision
)
language sql
security definer
set search_path = public, extensions
stable
as $$
  select s.id, s.name, s.slug, s.city,
         st_distance(s.location, st_makepoint(lng, lat)::geography) as distance_m
  from public.shelters s
  where s.status = 'verified'
    and s.location is not null
    and st_dwithin(s.location, st_makepoint(lng, lat)::geography, radius_m)
  order by distance_m;
$$;

-- ---------- Grants (el acceso real lo gobierna RLS) ----------
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;
