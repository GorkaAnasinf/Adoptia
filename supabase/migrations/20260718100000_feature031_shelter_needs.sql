-- FEATURE-031 — Tablón de necesidades de protectoras. Solo protectoras
-- VERIFICADAS publican (anti-spam); el público lee únicamente las abiertas de
-- verificadas; la dueña conserva su historial de cubiertas (reabrible). El
-- contacto «Puedo ayudar» va por handler (relay), no toca esta tabla.

create table public.shelter_needs (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  categoria text not null
    check (categoria in ('comida', 'mantas_ropa', 'medicinas', 'transporte', 'otros')),
  descripcion text not null check (char_length(descripcion) between 1 and 500),
  urgencia text not null default 'normal' check (urgencia in ('normal', 'urgente')),
  status text not null default 'abierta' check (status in ('abierta', 'cubierta')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shelter_needs_shelter_idx on public.shelter_needs (shelter_id);
create index shelter_needs_status_idx on public.shelter_needs (status);

create trigger shelter_needs_set_updated_at
  before update on public.shelter_needs
  for each row execute function public.set_updated_at();

alter table public.shelter_needs enable row level security;

-- Público (anon incluido): solo abiertas de protectoras verificadas.
create policy "shelter_needs_public_read" on public.shelter_needs for select
  using (
    status = 'abierta'
    and exists (
      select 1 from public.shelters s
      where s.id = shelter_id and s.status = 'verified'
    )
  );

-- La dueña ve todas las suyas (historial de cubiertas incluido).
create policy "shelter_needs_owner_read" on public.shelter_needs for select
  using (
    exists (
      select 1 from public.shelters s
      where s.id = shelter_id and s.owner_id = auth.uid()
    )
  );

-- Escritura: solo la dueña de una protectora VERIFICADA.
create policy "shelter_needs_owner_write" on public.shelter_needs for insert
  with check (
    exists (
      select 1 from public.shelters s
      where s.id = shelter_id and s.owner_id = auth.uid() and s.status = 'verified'
    )
  );

create policy "shelter_needs_owner_update" on public.shelter_needs for update
  using (
    exists (
      select 1 from public.shelters s
      where s.id = shelter_id and s.owner_id = auth.uid() and s.status = 'verified'
    )
  )
  with check (
    exists (
      select 1 from public.shelters s
      where s.id = shelter_id and s.owner_id = auth.uid() and s.status = 'verified'
    )
  );

create policy "shelter_needs_owner_delete" on public.shelter_needs for delete
  using (
    exists (
      select 1 from public.shelters s
      where s.id = shelter_id and s.owner_id = auth.uid()
    )
    or public.is_admin()
  );

grant select on public.shelter_needs to anon;
grant select, insert, update, delete on public.shelter_needs to authenticated;
grant select, insert, update, delete on public.shelter_needs to service_role;

-- Tablón por zona: abiertas de verificadas dentro del radio, urgentes primero
-- y después las más cercanas. Usable por anon (datos ya públicos por RLS).
create or replace function public.shelter_needs_nearby(
  p_lat double precision,
  p_lng double precision,
  p_radius_km integer
)
returns table (
  id uuid,
  categoria text,
  descripcion text,
  urgencia text,
  created_at timestamptz,
  shelter_name text,
  shelter_slug text,
  shelter_city text,
  distance_km double precision
)
language sql
security definer
set search_path = public, extensions
stable
as $$
  select
    n.id,
    n.categoria,
    n.descripcion,
    n.urgencia,
    n.created_at,
    s.name as shelter_name,
    s.slug as shelter_slug,
    s.city as shelter_city,
    round((st_distance(s.location, st_makepoint(p_lng, p_lat)::geography) / 1000)::numeric, 1)::double precision as distance_km
  from public.shelter_needs n
  join public.shelters s on s.id = n.shelter_id
  where n.status = 'abierta'
    and s.status = 'verified'
    and s.location is not null
    and st_dwithin(s.location, st_makepoint(p_lng, p_lat)::geography, p_radius_km * 1000)
  order by (n.urgencia = 'urgente') desc, st_distance(s.location, st_makepoint(p_lng, p_lat)::geography), n.created_at desc
$$;

grant execute on function public.shelter_needs_nearby(double precision, double precision, integer) to anon, authenticated, service_role;
