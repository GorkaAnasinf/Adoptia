-- FEATURE-024 — Galería de fotos en los avisos de perdidos.
--
-- Un aviso solo cabía una foto (`lost_found_posts.photo_url`). Para reconocer a
-- un animal por la calle hace falta la de frente, la de perfil y la del lomo.
-- Se copia el patrón de `animal_media`: tabla propia, `is_cover`, `sort_order`,
-- una sola portada por índice único parcial. Aquí no hay vídeo, así que no hace
-- falta el check «portada solo si es foto».

create table public.lost_found_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.lost_found_posts (id) on delete cascade,
  url text not null,
  is_cover boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index lost_found_media_post_idx on public.lost_found_media (post_id, sort_order);

-- Una sola portada por aviso, garantizado por BD, no solo por la UI.
create unique index lost_found_media_one_cover_idx
  on public.lost_found_media (post_id) where is_cover;

-- Backfill: cada aviso con foto pasa a tener una fila de media, que es su
-- portada. Así ninguna galería empieza vacía si ya había foto.
insert into public.lost_found_media (post_id, url, is_cover, sort_order)
select id, photo_url, true, 0
from public.lost_found_posts
where photo_url is not null;

-- Fuera `photo_url`: dos fuentes para la misma foto acaban divergiendo. La
-- portada sale siempre de la tabla.
alter table public.lost_found_posts drop column photo_url;

alter table public.lost_found_media enable row level security;

-- Lectura: pública solo si el aviso padre es público (open/resolved), igual que
-- los avistamientos. Si el aviso se archiva, su galería se archiva con él.
create policy "lost_found_media_read" on public.lost_found_media for select
  using (
    exists (
      select 1 from public.lost_found_posts p
      where p.id = post_id
        and (p.status in ('open', 'resolved') or p.user_id = auth.uid())
    )
    or public.is_admin()
  );

-- Escritura: solo el autor del aviso (o admin). No hay `user_id` propio en la
-- media: el dueño es el dueño del aviso.
create policy "lost_found_media_insert" on public.lost_found_media for insert
  with check (
    exists (
      select 1 from public.lost_found_posts p
      where p.id = post_id and p.user_id = auth.uid()
    )
  );

create policy "lost_found_media_delete" on public.lost_found_media for delete
  using (
    exists (
      select 1 from public.lost_found_posts p
      where p.id = post_id and p.user_id = auth.uid()
    )
    or public.is_admin()
  );

create policy "lost_found_media_update" on public.lost_found_media for update
  using (
    exists (
      select 1 from public.lost_found_posts p
      where p.id = post_id and p.user_id = auth.uid()
    )
    or public.is_admin()
  )
  with check (
    exists (
      select 1 from public.lost_found_posts p
      where p.id = post_id and p.user_id = auth.uid()
    )
    or public.is_admin()
  );

grant select on public.lost_found_media to anon;
grant select, insert, update, delete on public.lost_found_media to authenticated;
grant select, insert, update, delete on public.lost_found_media to service_role;

-- Galería de la ficha: fotos de un aviso, portada primero.
create or replace function public.lost_found_media_list(p_post_id uuid)
returns table (
  id uuid,
  url text,
  is_cover boolean,
  sort_order integer
)
language sql
security invoker
set search_path = public
stable
as $$
  select m.id, m.url, m.is_cover, m.sort_order
  from public.lost_found_media m
  where m.post_id = p_post_id
  order by m.is_cover desc, m.sort_order asc
$$;

grant execute on function public.lost_found_media_list(uuid) to anon, authenticated;

-- `lost_found_list` deja de devolver `photo_url` (ya no existe) y pasa a
-- `cover_url`, la portada sacada de `lost_found_media`. Reescritura de función
-- SQL → Decisión #36: hay un test que fija que devuelve la foto marcada como
-- portada y muerde si se rompe el `order by` (es exactamente el fallo de
-- BUG-006 en `animals_search`). `drop` + `create` porque cambia el tipo de
-- retorno.
drop function if exists public.lost_found_list();

create function public.lost_found_list()
returns table (
  id uuid,
  type public.lost_found_type,
  species public.animal_species,
  name text,
  description text,
  cover_url text,
  city text,
  status public.lost_found_status,
  breed text,
  sex public.animal_sex,
  size public.animal_size,
  color text,
  has_collar boolean,
  collar_description text,
  has_microchip boolean,
  occurred_on date,
  lat double precision,
  lng double precision,
  created_at timestamptz
)
language sql
security invoker
set search_path = public, extensions
stable
as $$
  select p.id, p.type, p.species, p.name, p.description,
         (
           select m.url
           from public.lost_found_media m
           where m.post_id = p.id
           order by m.is_cover desc, m.sort_order asc
           limit 1
         ) as cover_url,
         p.city, p.status,
         p.breed, p.sex, p.size, p.color,
         p.has_collar, p.collar_description, p.has_microchip, p.occurred_on,
         extensions.st_y(p.location::extensions.geometry) as lat,
         extensions.st_x(p.location::extensions.geometry) as lng,
         p.created_at
  from public.lost_found_posts p
  where p.status = 'open'
  order by p.created_at desc
  limit 500
$$;

grant execute on function public.lost_found_list() to anon, authenticated;
