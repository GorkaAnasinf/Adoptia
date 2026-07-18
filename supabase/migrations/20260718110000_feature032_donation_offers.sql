-- FEATURE-032 — Ofertas de donación de particulares.
-- Espejo del patrón de privacidad de foster_homes (FEATURE-016): el pin se
-- redondea (~200 m) al guardar — la dirección exacta nunca existe en BD — y
-- las ofertas solo son visibles vía RPC para protectoras VERIFICADAS dentro
-- del radio que el propio donante declaró; el contacto va por la plataforma
-- (el email sale hacia el donante, nunca al revés).

create table public.donation_offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  categoria text not null
    check (categoria in ('comida', 'accesorios', 'mantas_ropa', 'juguetes', 'otros')),
  descripcion text not null check (char_length(descripcion) between 1 and 1000),
  city text,
  location extensions.geography (point, 4326) not null,
  radius_km integer not null default 25 check (radius_km between 1 and 200),
  status text not null default 'abierta'
    check (status in ('abierta', 'entregada', 'caducada')),
  -- Base de la caducidad (60 días sin renovar → el cron la marca caducada).
  -- El trigger de abajo la fija a now() para clientes normales: nadie puede
  -- fecharse en el futuro para esquivar la caducidad.
  renovada_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index donation_offers_location_idx on public.donation_offers using gist (location);
create index donation_offers_user_id_idx on public.donation_offers (user_id);

create trigger donation_offers_set_updated_at
  before update on public.donation_offers
  for each row execute function public.set_updated_at();

-- Reusa el redondeo de privacidad de FEATURE-012 (misma rejilla ~0.002°).
create trigger donation_offers_round_location
  before insert or update of location on public.donation_offers
  for each row execute function public.round_lost_found_location();

-- renovada_at siempre now() para clientes no service_role (el cron y los
-- tests necesitan poder envejecer filas; los usuarios no).
create or replace function public.donation_offers_snap_renovada()
returns trigger
language plpgsql
as $$
begin
  if auth.role() is distinct from 'service_role' then
    if tg_op = 'INSERT' then
      new.renovada_at := now();
    elsif new.renovada_at is distinct from old.renovada_at then
      new.renovada_at := now();
    end if;
  end if;
  return new;
end;
$$;

create trigger donation_offers_snap_renovada
  before insert or update on public.donation_offers
  for each row execute function public.donation_offers_snap_renovada();

-- Tope de 5 ofertas abiertas por usuario (anti-abuso), atómico en BD.
create or replace function public.check_donation_offers_limit()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*)
    from public.donation_offers
    where user_id = new.user_id and status = 'abierta'
  ) >= 5 then
    raise exception 'donation_offers_limit' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger donation_offers_limit
  before insert on public.donation_offers
  for each row execute function public.check_donation_offers_limit();

alter table public.donation_offers enable row level security;

-- Solo el propio donante (o admin) ve/edita/borra su oferta; las protectoras
-- acceden únicamente por el RPC de abajo. Sin lectura pública.
create policy "donation_offers_owner_all" on public.donation_offers for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.donation_offers to authenticated;
grant select, insert, update, delete on public.donation_offers to service_role;

-- Ofertas abiertas y no caducadas dentro de SU radio respecto a la protectora
-- del llamante. security definer con doble guarda: el llamante debe ser dueño
-- de la protectora indicada y la protectora debe estar verificada. No expone
-- coordenadas, user_id ni contacto. El filtro de renovada_at es doble red por
-- si el cron de caducidad va tarde.
create or replace function public.donation_offers_nearby(p_shelter_id uuid)
returns table (
  id uuid,
  full_name text,
  categoria text,
  descripcion text,
  city text,
  distance_km double precision,
  radius_km integer,
  renovada_at timestamptz,
  created_at timestamptz
)
language sql
security definer
set search_path = public, extensions
stable
as $$
  select
    d.id,
    p.full_name,
    d.categoria,
    d.descripcion,
    d.city,
    round((st_distance(d.location, s.location) / 1000)::numeric, 1)::double precision as distance_km,
    d.radius_km,
    d.renovada_at,
    d.created_at
  from public.donation_offers d
  join public.shelters s
    on s.id = p_shelter_id
   and s.owner_id = auth.uid()
   and s.status = 'verified'
  left join public.profiles p on p.id = d.user_id
  where d.status = 'abierta'
    and d.renovada_at >= now() - interval '60 days'
    and s.location is not null
    and st_dwithin(d.location, s.location, d.radius_km * 1000)
  order by st_distance(d.location, s.location)
$$;

revoke execute on function public.donation_offers_nearby(uuid) from public, anon;
grant execute on function public.donation_offers_nearby(uuid) to authenticated, service_role;
