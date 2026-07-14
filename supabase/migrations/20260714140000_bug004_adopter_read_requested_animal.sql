-- ============================================================
-- ADOPTIA — BUG-004: "Reservar cita" lleva a un 404.
--
-- Al aprobar una solicitud, el animal pasa a `reserved` y la protectora suele
-- despublicarlo (`published_at = null`). La policy `animals_public_read` solo
-- deja al adoptante leer animales con `published_at is not null`, así que el
-- join anidado `animals(...)` de la página de reserva
-- (src/app/(adopter)/mi-cuenta/citas/nueva/[requestId]/page.tsx) devuelve null
-- y la página hace `notFound()` → 404. La lista de solicitudes también pierde
-- el nombre/foto del animal (muestra "—").
--
-- Arreglo (RLS, pilar de seguridad): el adoptante puede LEER el animal (y su
-- media) mientras tenga una solicitud viva (pending/approved/completed) sobre
-- él, aunque esté despublicado. No amplía la visibilidad a terceros.
-- ============================================================

-- Helper SECURITY DEFINER: evita la recursión mutua animals ↔ adoption_requests
-- (la policy `adoption_requests_read` referencia `animals`). Al ser definer, la
-- subconsulta contra `adoption_requests` se ejecuta como owner y NO re-entra en
-- RLS. Mismo patrón que `public.is_admin()`.
create or replace function public.adopter_has_request_for(p_animal_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.adoption_requests r
    where r.animal_id = p_animal_id
      and r.adopter_id = auth.uid()
      and r.status in ('pending', 'approved', 'completed')
  );
$$;

grant execute on function public.adopter_has_request_for(uuid) to authenticated, anon;

-- Lectura del animal para el adoptante con solicitud viva (aunque despublicado).
-- Es una policy permisiva más: se suma (OR) a `animals_public_read`, nunca resta.
create policy "animals_adopter_request_read" on public.animals for select
  using (public.adopter_has_request_for(id));

-- Lo mismo para la media, para que la lista de solicitudes pinte la foto.
create policy "animal_media_adopter_request_read" on public.animal_media for select
  using (public.adopter_has_request_for(animal_id));
