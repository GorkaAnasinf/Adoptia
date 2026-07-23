-- FEATURE-060 — Badge «Urgente»: la protectora marca casos que corren.
--
-- Añade `animals.urgent` y lo integra en `animals_search`: se devuelve, se puede
-- filtrar (`p_urgent`) y, SOLO en el orden por defecto ('recent'), los urgentes
-- salen primero. En orden por distancia manda la distancia (decisión del usuario).
--
-- La firma de `animals_search` cambia (parámetro nuevo) → soltar y recrear.

alter table public.animals
  add column if not exists urgent boolean not null default false;

drop function if exists public.animals_search(
  public.animal_species, public.animal_size[], public.animal_sex[],
  boolean, boolean, boolean, boolean, date, date,
  double precision, double precision, double precision,
  text, integer, integer, text
);

create function public.animals_search(
  p_species public.animal_species default null,
  p_sizes public.animal_size[] default null,
  p_sexes public.animal_sex[] default null,
  p_good_with_kids boolean default null,
  p_good_with_dogs boolean default null,
  p_good_with_cats boolean default null,
  p_apartment_suitable boolean default null,
  p_urgent boolean default null,
  p_birth_after date default null,
  p_birth_before date default null,
  p_lat double precision default null,
  p_lng double precision default null,
  p_radius_km double precision default null,
  p_order text default 'recent',
  p_limit integer default 24,
  p_offset integer default 0,
  p_query text default null
)
returns table (
  id uuid,
  name text,
  slug text,
  species public.animal_species,
  sex public.animal_sex,
  size public.animal_size,
  birth_date_approx date,
  status public.animal_status,
  published_at timestamptz,
  urgent boolean,
  shelter_name text,
  shelter_slug text,
  city text,
  province text,
  distance_m double precision,
  cover_url text,
  total_count bigint
)
language sql
stable
set search_path = public, extensions
as $$
  select
    a.id,
    a.name,
    a.slug,
    a.species,
    a.sex,
    a.size,
    a.birth_date_approx,
    a.status,
    a.published_at,
    a.urgent,
    s.name,
    s.slug,
    s.city,
    s.province,
    case
      when p_lat is not null and p_lng is not null and s.location is not null
      then st_distance(s.location, st_makepoint(p_lng, p_lat)::geography)
    end,
    (
      select m.url
      from public.animal_media m
      where m.animal_id = a.id
        and m.type = 'photo'   -- BUG-006: nunca un vídeo como portada
      order by m.is_cover desc, m.sort_order asc
      limit 1
    ),
    count(*) over ()
  from public.animals a
  join public.shelters s on s.id = a.shelter_id
  where a.published_at is not null
    and s.status = 'verified'
    and a.status in ('available', 'reserved')
    and (p_species is null or a.species = p_species)
    and (p_sizes is null or a.size = any (p_sizes))
    and (p_sexes is null or a.sex = any (p_sexes))
    and (p_good_with_kids is null or a.good_with_kids = p_good_with_kids)
    and (p_good_with_dogs is null or a.good_with_dogs = p_good_with_dogs)
    and (p_good_with_cats is null or a.good_with_cats = p_good_with_cats)
    and (p_apartment_suitable is null or a.apartment_suitable = p_apartment_suitable)
    and (p_urgent is null or a.urgent = p_urgent)
    and (p_birth_after is null or a.birth_date_approx >= p_birth_after)
    and (p_birth_before is null or a.birth_date_approx < p_birth_before)
    and (
      p_query is null
      or a.name ilike p_query
      or a.breed ilike p_query
    )
    and (
      p_radius_km is null or p_lat is null or p_lng is null
      or (
        s.location is not null
        and st_dwithin(
          s.location,
          st_makepoint(p_lng, p_lat)::geography,
          p_radius_km * 1000
        )
      )
    )
  order by
    case
      when p_order = 'distance' and p_lat is not null and p_lng is not null
      then st_distance(s.location, st_makepoint(p_lng, p_lat)::geography)
    end asc nulls last,
    -- Urgentes primero solo en el orden por defecto (no en distancia).
    case when p_order = 'distance' then false else a.urgent end desc,
    a.published_at desc
  limit greatest(coalesce(p_limit, 24), 0)
  offset greatest(coalesce(p_offset, 0), 0)
$$;

comment on function public.animals_search is
  'Listado público de animales con filtros combinables, búsqueda por texto (IMPROVEMENT-021), filtro «apto para piso» (IMPROVEMENT-031) y «urgente» (FEATURE-060, urgentes primero solo en orden recientes), orden por distancia y paginación. Portada solo de fotos (BUG-006). Security invoker: RLS aplica.';
