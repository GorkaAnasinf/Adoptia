-- ============================================================
-- ADOPTIA — FEATURE-007: cierre de hallazgo QA crítico.
--
-- La policy "adoption_requests_update" del baseline es a nivel de FILA: el
-- adoptante dueño de la solicitud pasa el mismo `using`/`with check` que la
-- protectora, así que puede escribir (y, vía RETURNING, leer) `shelter_notes`
-- y forzar cualquier `status` (p. ej. "approved") directamente contra la API
-- de Supabase, sin pasar por PATCH /api/solicitudes/[id]. Criterio de
-- aceptación FEATURE-007: "Notas internas jamás visibles para el adoptante
-- (RLS por columna o vista)".
-- ============================================================

-- 1) Columna: solo el backend con service_role (admin client) puede LEER
--    `shelter_notes`. El rol `authenticated`/`anon` pierde el privilegio de
--    columna aunque conserve SELECT sobre el resto de la fila vía RLS. La
--    app ya lee las notas con `createAdminClient()` en el panel de la
--    protectora (src/app/(shelter)/panel/solicitudes/page.tsx), así que no
--    requiere cambios de aplicación.
-- Postgres solo aplica un REVOKE de columna cuando el rol NO tiene ya el
-- privilegio a nivel de tabla (los privilegios de columna son aditivos, no
-- restrictivos, sobre un GRANT de tabla). Supabase concede SELECT de tabla
-- completa a `authenticated`/`anon` por defecto, así que hay que revocar la
-- tabla entera y volver a conceder columna a columna, sin `shelter_notes`.
revoke select on public.adoption_requests from authenticated, anon;
grant select (
  id, animal_id, adopter_id, status, questionnaire, message, created_at, updated_at
) on public.adoption_requests to authenticated, anon;

-- 2) Fila: un trigger BEFORE UPDATE bloquea que el propio adoptante
--    modifique `shelter_notes` o cambie `status` a un valor distinto de
--    'withdrawn' (retirar su propia solicitud). RLS `with check` no tiene
--    acceso a OLD, así que la comparación OLD/NEW se hace en el trigger. La
--    protectora dueña del animal y el admin quedan exentos.
create or replace function public.adoption_requests_guard_adopter_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_shelter_owner boolean;
begin
  select exists (
    select 1
    from public.animals a
    join public.shelters s on s.id = a.shelter_id
    where a.id = new.animal_id and s.owner_id = auth.uid()
  ) into v_is_shelter_owner;

  if old.adopter_id = auth.uid() and not v_is_shelter_owner and not public.is_admin() then
    if new.shelter_notes is distinct from old.shelter_notes then
      raise exception 'No autorizado: el adoptante no puede modificar las notas internas de la protectora';
    end if;
    if new.status is distinct from old.status and new.status is distinct from 'withdrawn' then
      raise exception 'No autorizado: el adoptante solo puede retirar su propia solicitud';
    end if;
  end if;

  return new;
end;
$$;

create trigger adoption_requests_guard_adopter_update
  before update on public.adoption_requests
  for each row execute function public.adoption_requests_guard_adopter_update();
