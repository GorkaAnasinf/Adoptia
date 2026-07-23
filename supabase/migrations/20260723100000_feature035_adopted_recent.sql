-- FEATURE-035 (Nivel 1) — «Ya están en casa»: últimas adopciones para la home.
--
-- Datos del animal (no del adoptante): no hay RGPD nuevo. Los animales adoptados
-- conservan `published_at` (el flujo de completar adopción solo cambia `status`),
-- así que la policy pública `animals_public_read` ya deja leerlos a anónimo. La
-- función es SECURITY INVOKER: la RLS aplica igual que en `animals_search`.
--
-- No existe columna de fecha de adopción; se usa `updated_at` como aproximación
-- (el animal pasa a `adopted` en esa transición). Solo se devuelven animales con
-- al menos una FOTO de portada, para que la sección luzca bien.

create or replace function public.adopted_animals_recent(p_limit integer default 3)
returns table (
  id uuid,
  name text,
  slug text,
  species public.animal_species,
  shelter_name text,
  shelter_slug text,
  city text,
  province text,
  adopted_at timestamptz,
  cover_url text
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
    s.name,
    s.slug,
    s.city,
    s.province,
    a.updated_at,
    (
      select m.url
      from public.animal_media m
      where m.animal_id = a.id
        and m.type = 'photo'
      order by m.is_cover desc, m.sort_order asc
      limit 1
    )
  from public.animals a
  join public.shelters s on s.id = a.shelter_id
  where a.published_at is not null
    and s.status = 'verified'
    and a.status = 'adopted'
    and exists (
      select 1 from public.animal_media m
      where m.animal_id = a.id and m.type = 'photo'
    )
  order by a.updated_at desc
  limit greatest(coalesce(p_limit, 3), 0)
$$;

comment on function public.adopted_animals_recent is
  'Últimas adopciones (status=adopted) con foto de portada para la sección «Ya están en casa» de la home (FEATURE-035, Nivel 1). Fecha aproximada = updated_at. Security invoker: RLS aplica.';

grant execute on function public.adopted_animals_recent(integer) to anon, authenticated, service_role;
