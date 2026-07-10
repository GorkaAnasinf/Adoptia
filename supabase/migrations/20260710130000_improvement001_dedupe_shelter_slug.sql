-- IMPROVEMENT-001 — De-duplicar el slug de protectora (nombres repetidos).
-- Dos protectoras pueden llamarse igual (CIF/email distintos); el slug derivado
-- del nombre chocaba con la unique global y el alta fallaba con un mensaje
-- engañoso. La de-duplicación se hace en BD (trigger) para que sea atómica:
-- si el slug propuesto ya existe, se añade sufijo incremental (-2, -3, ...).

create or replace function public.dedupe_shelter_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text := new.slug;
  candidato text := new.slug;
  n integer := 2;
begin
  if base is null then
    return new;
  end if;

  -- Serializa las altas concurrentes con el mismo slug base dentro de la
  -- transacción: sin esto, dos inserts simultáneos verían ambos el hueco
  -- libre y uno acabaría en unique_violation.
  perform pg_advisory_xact_lock(hashtext('shelter_slug:' || base));

  while exists (
    select 1 from public.shelters s
    where s.slug = candidato
      and s.id is distinct from new.id
  ) loop
    candidato := base || '-' || n;
    n := n + 1;
  end loop;

  new.slug := candidato;
  return new;
end;
$$;

-- Solo en insert o cuando el slug cambia: una actualización de otros campos
-- no debe tocar un slug ya publicado (URLs estables).
drop trigger if exists shelters_dedupe_slug on public.shelters;
create trigger shelters_dedupe_slug
  before insert or update of slug on public.shelters
  for each row execute function public.dedupe_shelter_slug();
