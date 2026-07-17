-- IMPROVEMENT-026 (remate) — Las propuestas aceptadas ANTES de que existiera
-- el trigger de sincronización dejaron animales acogidos que siguen marcados
-- 'available'. Dos piezas:
--  1) El trigger cubre también INSERT: una propuesta que nace 'aceptada'
--     (inserciones directas/admin) sincroniza igual.
--  2) Backfill idempotente de las filas históricas con el mismo criterio del
--     trigger (solo available → fostered; reservados/adoptados no se tocan).

create or replace function public.sync_animal_estado_acogida()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'aceptada' and new.animal_id is not null then
      update public.animals set status = 'fostered'
        where id = new.animal_id and status = 'available';
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    if new.status = 'aceptada' and old.status is distinct from 'aceptada'
       and new.animal_id is not null then
      update public.animals set status = 'fostered'
        where id = new.animal_id and status = 'available';
    elsif old.status = 'aceptada' and new.status <> 'aceptada'
          and new.animal_id is not null then
      update public.animals set status = 'available'
        where id = new.animal_id and status = 'fostered';
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.status = 'aceptada' and old.animal_id is not null then
      update public.animals set status = 'available'
        where id = old.animal_id and status = 'fostered';
    end if;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists foster_proposals_sync_animal on public.foster_proposals;
create trigger foster_proposals_sync_animal
  after insert or update of status or delete on public.foster_proposals
  for each row execute function public.sync_animal_estado_acogida();

-- Backfill: animales disponibles con una acogida aceptada viva pasan a 'fostered'.
update public.animals a
set status = 'fostered'
where a.status = 'available'
  and exists (
    select 1 from public.foster_proposals fp
    where fp.animal_id = a.id and fp.status = 'aceptada'
  );
