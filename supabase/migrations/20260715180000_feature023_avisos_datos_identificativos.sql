-- FEATURE-023 — Datos identificativos del aviso y fecha real del suceso.
--
-- Con "perro marrón" no lo reconoce nadie por la calle. Se añaden los campos
-- que sirven para identificar a un animal, todos OPCIONALES: el alta tiene que
-- seguir haciéndose en <2 min desde el móvil (criterio de FEATURE-012).
--
-- `null` = "no lo sé" en los booleanos, que es la convención ya usada por las
-- compatibilidades de `animals` (good_with_kids…). No hace falta un enum nuevo.
--
-- NUNCA el número de microchip: identifica al dueño en el registro autonómico,
-- así que es un dato personal indirecto disfrazado de dato del animal. Solo el
-- booleano de si lo lleva.

alter table public.lost_found_posts
  add column breed text,
  add column sex public.animal_sex,     -- null = no lo sé
  add column size public.animal_size,   -- null = no lo sé
  add column color text,
  add column has_collar boolean,        -- null = no lo sé
  add column collar_description text,
  add column has_microchip boolean,     -- null = no lo sé; el NÚMERO nunca
  add column occurred_on date;

comment on column public.lost_found_posts.has_microchip is
  'Solo si lleva chip. El NÚMERO no se guarda jamás: identifica al dueño en el registro autonómico (FEATURE-023).';
comment on column public.lost_found_posts.occurred_on is
  'Cuándo se perdió o se encontró — no cuándo se publicó (created_at). Sirve para lost y found, de ahí el nombre.';

-- Backfill antes del `not null`: lo más honesto que se puede inferir de un
-- aviso viejo es que se publicó el día que ocurrió.
update public.lost_found_posts set occurred_on = created_at::date where occurred_on is null;

-- `default current_date` además de `not null`: quien publica hoy lo normal es
-- que sea de hoy, y así ningún insert existente (formulario, seed, tests) se
-- rompe por un campo que no conocía.
alter table public.lost_found_posts
  alter column occurred_on set default current_date,
  alter column occurred_on set not null,
  add constraint lost_found_posts_occurred_on_pasado check (occurred_on <= current_date);

-- El listado gana los campos nuevos. Reescritura de función SQL → Decisión #36:
-- el test que la protege se ejecuta antes de darla por buena (así se coló
-- BUG-006). Se conserva `security invoker`: la RLS sigue mandando.
--
-- `create or replace` no vale: cambia el tipo de retorno ("cannot change return
-- type of existing function"). Hay que soltarla antes. No hay riesgo de dejar
-- un overload ambiguo porque no recibe argumentos.
drop function if exists public.lost_found_list();

create function public.lost_found_list()
returns table (
  id uuid,
  type public.lost_found_type,
  species public.animal_species,
  name text,
  description text,
  photo_url text,
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
  select p.id, p.type, p.species, p.name, p.description, p.photo_url, p.city,
         p.status,
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
