-- FEATURE-016 — Registro de casas de acogida.
-- Privacidad: la ubicación se redondea (~200 m) al guardar, como en
-- perdidos/encontrados: la dirección exacta nunca existe en BD. Los datos del
-- acogedor solo son visibles vía RPC para protectoras VERIFICADAS dentro del
-- radio que el propio acogedor declaró; el contacto va por la plataforma.

create table public.foster_homes (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  location extensions.geography (point, 4326) not null,
  city text,
  radius_km integer not null default 25 check (radius_km between 1 and 200),
  -- { especies: ["dog","cat"], vivienda: "piso"|"casa", jardin: bool,
  --   otros_animales: text, notas: text }
  condiciones jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  -- Consentimiento explícito para ser contactado por protectoras (criterio)
  consent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index foster_homes_location_idx on public.foster_homes using gist (location);

create trigger foster_homes_set_updated_at
  before update on public.foster_homes
  for each row execute function public.set_updated_at();

-- Reusa el redondeo de privacidad de FEATURE-012 (misma rejilla ~0.002°).
create trigger foster_homes_round_location
  before insert or update of location on public.foster_homes
  for each row execute function public.round_lost_found_location();

alter table public.foster_homes enable row level security;

-- Solo el propio acogedor (o admin) ve/edita/borra su registro; las
-- protectoras acceden únicamente por el RPC de abajo.
create policy "foster_homes_owner_all" on public.foster_homes for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.foster_homes to authenticated;
grant select, insert, update, delete on public.foster_homes to service_role;

-- Acogedores activos dentro de SU radio respecto a la protectora del llamante.
-- security definer con doble guarda: el llamante debe ser dueño de la
-- protectora indicada y la protectora debe estar verificada.
create or replace function public.foster_homes_nearby(p_shelter_id uuid)
returns table (
  user_id uuid,
  full_name text,
  city text,
  distance_km double precision,
  radius_km integer,
  condiciones jsonb,
  created_at timestamptz
)
language sql
security definer
set search_path = public, extensions
stable
as $$
  select
    fh.user_id,
    p.full_name,
    fh.city,
    round((st_distance(fh.location, s.location) / 1000)::numeric, 1)::double precision as distance_km,
    fh.radius_km,
    fh.condiciones,
    fh.created_at
  from public.foster_homes fh
  join public.shelters s
    on s.id = p_shelter_id
   and s.owner_id = auth.uid()
   and s.status = 'verified'
  left join public.profiles p on p.id = fh.user_id
  where fh.active
    and s.location is not null
    and st_dwithin(fh.location, s.location, fh.radius_km * 1000)
  order by st_distance(fh.location, s.location)
$$;

revoke execute on function public.foster_homes_nearby(uuid) from public, anon;
grant execute on function public.foster_homes_nearby(uuid) to authenticated, service_role;
