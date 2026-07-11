-- FEATURE-014 — Estadísticas para protectoras.
-- Visitas agregadas por ficha y día, sin ninguna traza del visitante
-- (RGPD-friendly): solo un contador. El incremento pasa por una función
-- security definer; la tabla no admite escritura directa de ningún rol.

create table public.page_views (
  animal_id uuid not null references public.animals (id) on delete cascade,
  day date not null default (now() at time zone 'Europe/Madrid')::date,
  views integer not null default 0,
  primary key (animal_id, day)
);

alter table public.page_views enable row level security;

-- Solo la protectora dueña del animal (o admin) lee sus métricas.
create policy "page_views_owner_read" on public.page_views for select
  using (
    exists (
      select 1 from public.animals a
      join public.shelters s on s.id = a.shelter_id
      where a.id = animal_id and s.owner_id = auth.uid()
    )
    or public.is_admin()
  );

grant select on public.page_views to authenticated;
grant select, insert, update, delete on public.page_views to service_role;

-- Incremento anónimo: solo cuenta fichas públicamente visibles (publicadas de
-- protectoras verificadas), así el endpoint no sirve para sondear borradores.
create or replace function public.registrar_visita(p_animal_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.animals a
    join public.shelters s on s.id = a.shelter_id
    where a.id = p_animal_id
      and a.published_at is not null
      and s.status = 'verified'
  ) then
    return;
  end if;

  insert into public.page_views (animal_id, day, views)
  values (p_animal_id, (now() at time zone 'Europe/Madrid')::date, 1)
  on conflict (animal_id, day)
  do update set views = public.page_views.views + 1;
end;
$$;

grant execute on function public.registrar_visita(uuid) to anon, authenticated;
