-- FEATURE-006: el mapa necesita las coordenadas de cada protectora para
-- colocar los marcadores (el RPC solo exponía distance_m, útil para ordenar
-- pero no para pintar el punto).

drop function if exists public.shelters_nearby(
  double precision, double precision, double precision,
  public.animal_species, boolean, boolean
);

create or replace function public.shelters_nearby(
  lat double precision,
  lng double precision,
  radius_m double precision,
  p_species public.animal_species default null,
  p_accepts_volunteers boolean default null,
  p_accepts_fostering boolean default null
)
returns table (
  id uuid,
  name text,
  slug text,
  city text,
  distance_m double precision,
  animal_count bigint,
  lat double precision,
  lng double precision
)
language sql
security definer
set search_path = public, extensions
stable
as $$
  select
    s.id,
    s.name,
    s.slug,
    s.city,
    st_distance(s.location, st_makepoint(lng, lat)::geography) as distance_m,
    (
      select count(*)
      from public.animals a
      where a.shelter_id = s.id
        and a.published_at is not null
        and a.status in ('available', 'reserved')
        and (p_species is null or a.species = p_species)
    ) as animal_count,
    st_y(s.location::geometry) as lat,
    st_x(s.location::geometry) as lng
  from public.shelters s
  where s.status = 'verified'
    and s.location is not null
    and st_dwithin(s.location, st_makepoint(lng, lat)::geography, radius_m)
    and (p_accepts_volunteers is null or s.accepts_volunteers = p_accepts_volunteers)
    and (p_accepts_fostering is null or s.accepts_fostering = p_accepts_fostering)
    and (
      p_species is null
      or exists (
        select 1
        from public.animals a
        where a.shelter_id = s.id
          and a.published_at is not null
          and a.status in ('available', 'reserved')
          and a.species = p_species
      )
    )
  order by distance_m;
$$;

comment on function public.shelters_nearby is
  'Protectoras verificadas cerca de un punto, con filtros de especie/voluntariado/acogida, coordenadas y nº de animales publicados (FEATURE-006).';
