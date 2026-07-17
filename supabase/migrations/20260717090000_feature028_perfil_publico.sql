-- FEATURE-028 — Rediseño del perfil público de protectora.
--
-- 1) Columnas nuevas en `shelters`: foto de portada del hero y año de
--    fundación (para «años de labor»; `created_at` es el alta en la
--    plataforma y sería engañoso). Cubiertas por las políticas de fila
--    existentes: sin RLS nueva.
-- 2) RPC `shelter_public_stats`: la franja de métricas necesita contar
--    adopciones, pero los animales adoptados se despublican y la policy
--    `animals_public_read` no deja verlos. `security definer` que expone
--    SOLO agregados y SOLO de protectoras verificadas (u owner/admin).

alter table public.shelters
  add column cover_url text,
  add column founded_year smallint
    check (founded_year is null or founded_year between 1900 and 2100);

create or replace function public.shelter_public_stats(p_shelter_id uuid)
returns table (adopciones integer, disponibles integer)
language sql
security definer
set search_path = public
stable
as $$
  select
    count(*) filter (where a.status = 'adopted')::integer as adopciones,
    count(*) filter (
      where a.status = 'available' and a.published_at is not null
    )::integer as disponibles
  from public.shelters s
  left join public.animals a on a.shelter_id = s.id
  where s.id = p_shelter_id
    and (s.status = 'verified' or s.owner_id = auth.uid() or public.is_admin())
  group by s.id;
$$;

comment on function public.shelter_public_stats(uuid) is
  'Conteos agregados del perfil público (FEATURE-028): adopciones (incluye despublicados) y disponibles publicados. Solo protectoras verificadas, su owner o admin.';
