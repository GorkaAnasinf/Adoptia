-- FEATURE-030 — Relevo de acogida. El relevo son columnas de la propuesta
-- ACEPTADA (el animal sigue acogido; el status no cambia, así que el índice
-- único y la sincronización conservan su semántica). El acogedor no gana
-- update sobre la tabla: pide y cancela vía RPC con doble guarda.

alter table public.foster_proposals
  add column relevo_pedido_at timestamptz,
  add column relevo_motivo text check (relevo_motivo is null or char_length(relevo_motivo) between 1 and 500),
  add column relevo_fecha_limite date;

-- El acogedor destinatario pide relevo de SU acogida aceptada.
create or replace function public.pedir_relevo(
  p_proposal_id uuid,
  p_motivo text,
  p_fecha_limite date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_motivo is null or char_length(trim(p_motivo)) not between 1 and 500 then
    raise exception 'motivo_invalido';
  end if;
  if p_fecha_limite is null then
    raise exception 'fecha_invalida';
  end if;
  update public.foster_proposals
    set relevo_pedido_at = now(),
        relevo_motivo = trim(p_motivo),
        relevo_fecha_limite = p_fecha_limite
    where id = p_proposal_id
      and foster_user_id = auth.uid()
      and status = 'aceptada';
  if not found then
    raise exception 'propuesta_no_disponible';
  end if;
end;
$$;

create or replace function public.cancelar_relevo(p_proposal_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.foster_proposals
    set relevo_pedido_at = null,
        relevo_motivo = null,
        relevo_fecha_limite = null
    where id = p_proposal_id
      and foster_user_id = auth.uid()
      and status = 'aceptada';
  if not found then
    raise exception 'propuesta_no_disponible';
  end if;
end;
$$;

revoke execute on function public.pedir_relevo(uuid, text, date) from public, anon;
revoke execute on function public.cancelar_relevo(uuid) from public, anon;
grant execute on function public.pedir_relevo(uuid, text, date) to authenticated, service_role;
grant execute on function public.cancelar_relevo(uuid) to authenticated, service_role;

-- Sincronización animal-acogida: con un relevo en marcha hay DOS propuestas
-- aceptadas del mismo animal — solo se vuelve a 'available' cuando no queda
-- NINGUNA aceptada viva.
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
          and new.animal_id is not null
          and not exists (
            select 1 from public.foster_proposals fp
            where fp.animal_id = new.animal_id and fp.status = 'aceptada'
          ) then
      update public.animals set status = 'available'
        where id = new.animal_id and status = 'fostered';
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.status = 'aceptada' and old.animal_id is not null
       and not exists (
         select 1 from public.foster_proposals fp
         where fp.animal_id = old.animal_id and fp.status = 'aceptada'
       ) then
      update public.animals set status = 'available'
        where id = old.animal_id and status = 'fostered';
    end if;
    return old;
  end if;
  return null;
end;
$$;
