-- IMPROVEMENT-026 — El estado del animal sigue a su propuesta de acogida.
-- aceptada → animal a 'fostered'; dejar de estar aceptada (finalizada,
-- rechazada o borrado en cascada por la baja del acogedor) → vuelta a
-- 'available'. Solo toca las transiciones available↔fostered: un animal
-- reservado/adoptado no se pisa. En BD y no en cliente: la UI oculta, la BD
-- garantiza (regla 2), y la baja del acogedor no pasa por ninguna UI de la
-- protectora.

create or replace function public.sync_animal_estado_acogida()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
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

revoke execute on function public.sync_animal_estado_acogida() from public, anon, authenticated;

create trigger foster_proposals_sync_animal
  after update of status or delete on public.foster_proposals
  for each row execute function public.sync_animal_estado_acogida();
