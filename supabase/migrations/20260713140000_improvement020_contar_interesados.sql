-- IMPROVEMENT-020 — Contador público de personas interesadas en un animal.
-- Agregado anónimo (nº de adoptantes distintos con solicitud), sin filtrar
-- ninguna identidad. Mismo blindaje que `registrar_visita`: solo cuenta fichas
-- públicamente visibles (publicadas de protectora verificada), así el endpoint
-- no sirve para sondear borradores. La tabla `adoption_requests` sigue sin
-- lectura pública; el conteo pasa por esta función security definer.

create or replace function public.contar_interesados(p_animal_id uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select case
    when exists (
      select 1 from public.animals a
      join public.shelters s on s.id = a.shelter_id
      where a.id = p_animal_id
        and a.published_at is not null
        and s.status = 'verified'
    )
    then (
      select count(distinct r.adopter_id)::int
      from public.adoption_requests r
      where r.animal_id = p_animal_id
    )
    else 0
  end;
$$;

grant execute on function public.contar_interesados(uuid) to anon, authenticated;
