-- FEATURE-010 — Área personal del adoptante: favoritos y alertas.
-- `favorites.notified_at` y `saved_searches.last_sent_at` sustituyen a una
-- tabla `notifications` genérica: bastan para "notificar una sola vez" y
-- "máx. 1 email/día por alerta" sin más infraestructura (ver DECISIONS).

-- ---------- Favoritos ----------

create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  animal_id uuid not null references public.animals (id) on delete cascade,
  -- Aviso de "tu favorito ha sido adoptado" ya enviado (una sola vez)
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, animal_id)
);

create index favorites_animal_id_idx on public.favorites (animal_id);

alter table public.favorites enable row level security;

create policy "favorites_owner_all" on public.favorites for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.favorites to authenticated, service_role;

-- ---------- Alertas (búsquedas guardadas) ----------

create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  -- Filtros del listado público: { especie, tamano, sexo, lat, lng, radio_km, ... }
  filters jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  -- Baja en un clic desde el email, sin sesión
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  -- Última vez que esta alerta envió email (máx. 1/día)
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saved_searches_user_id_idx on public.saved_searches (user_id);

create trigger saved_searches_set_updated_at
  before update on public.saved_searches
  for each row execute function public.set_updated_at();

alter table public.saved_searches enable row level security;

create policy "saved_searches_owner_all" on public.saved_searches for all
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

grant select, insert, update, delete on public.saved_searches to authenticated, service_role;

-- Tope de 5 alertas por usuario (criterio FEATURE-010), atómico en BD.
create or replace function public.check_saved_searches_limit()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.saved_searches where user_id = new.user_id) >= 5 then
    raise exception 'saved_searches_limit' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger saved_searches_limit
  before insert on public.saved_searches
  for each row execute function public.check_saved_searches_limit();

-- ---------- Matching alerta ↔ animales nuevos ----------
-- Empareja alertas activas (sin email en las últimas ~20 h) con animales
-- disponibles publicados en las últimas p_hours horas. security definer: lo
-- usa solo el cron (service_role); revocado para anon/authenticated.

create or replace function public.saved_search_matches(p_hours integer default 24)
returns table (
  search_id uuid,
  user_id uuid,
  search_name text,
  unsubscribe_token uuid,
  animal_id uuid,
  animal_name text,
  animal_slug text
)
language sql
security definer
set search_path = public, extensions
stable
as $$
  select ss.id, ss.user_id, ss.name, ss.unsubscribe_token, a.id, a.name, a.slug
  from public.saved_searches ss
  join public.animals a
    on a.published_at >= now() - make_interval(hours => greatest(p_hours, 1))
   and a.status = 'available'
  join public.shelters s on s.id = a.shelter_id and s.status = 'verified'
  where ss.active
    and (ss.last_sent_at is null or ss.last_sent_at < now() - interval '20 hours')
    and (ss.filters ->> 'especie' is null or a.species::text = ss.filters ->> 'especie')
    and (ss.filters ->> 'tamano' is null or a.size::text = ss.filters ->> 'tamano')
    and (ss.filters ->> 'sexo' is null or a.sex::text = ss.filters ->> 'sexo')
    and (
      ss.filters ->> 'lat' is null
      or ss.filters ->> 'lng' is null
      or ss.filters ->> 'radio_km' is null
      or s.location is null
      or st_dwithin(
           s.location,
           st_makepoint((ss.filters ->> 'lng')::float, (ss.filters ->> 'lat')::float)::geography,
           (ss.filters ->> 'radio_km')::float * 1000
         )
    )
  order by ss.user_id, a.published_at desc
$$;

revoke execute on function public.saved_search_matches(integer) from public, anon, authenticated;
grant execute on function public.saved_search_matches(integer) to service_role;
