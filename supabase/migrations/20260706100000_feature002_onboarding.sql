-- ============================================================
-- ADOPTIA — FEATURE-002: Onboarding de protectoras y verificación
-- - Columnas submitted_at / verification_note
-- - CIF y email de entidad únicos
-- - Trigger que impide a la protectora cambiar su propio status
-- - Tabla geocode_cache (caché de Nominatim)
-- - Bucket de Storage 'logos'
-- ============================================================

-- ---------- Nuevas columnas en shelters ----------
alter table public.shelters
  add column if not exists submitted_at timestamptz,
  add column if not exists verification_note text;

comment on column public.shelters.submitted_at is
  'null = borrador del wizard en curso; con valor = enviada a revisión (status pending).';
comment on column public.shelters.verification_note is
  'Motivo de rechazo escrito por el admin al suspender.';

-- ---------- Unicidad de CIF y email de entidad ----------
create unique index if not exists shelters_cif_key
  on public.shelters (cif) where cif is not null;
create unique index if not exists shelters_email_key
  on public.shelters (lower(email)) where email is not null;

-- ---------- Protección de campos privilegiados ----------
-- La política shelters_owner_update deja al dueño actualizar cualquier columna.
-- Este trigger impide que cambie status/verification_note salvo que sea admin.
create or replace function public.shelters_protect_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() null = contexto de servidor de confianza (service_role, seed):
  -- exento. Cualquier usuario autenticado que no sea admin queda bloqueado.
  if (new.status is distinct from old.status
      or new.verification_note is distinct from old.verification_note)
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'solo un administrador puede cambiar el estado de verificación de una protectora';
  end if;
  return new;
end;
$$;

drop trigger if exists shelters_protect_privileged_fields on public.shelters;
create trigger shelters_protect_privileged_fields
  before update on public.shelters
  for each row execute function public.shelters_protect_privileged_fields();

-- ---------- Caché de geocoding ----------
create table if not exists public.geocode_cache (
  query_norm text primary key,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

alter table public.geocode_cache enable row level security;
-- Sin políticas: deny-by-default. Solo el service_role (handler servidor) accede,
-- saltándose RLS. Ni anon ni authenticated pueden leer ni escribir.

-- ---------- Bucket de logos ----------
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

drop policy if exists "logos_public_read" on storage.objects;
create policy "logos_public_read" on storage.objects
  for select using (bucket_id = 'logos');

drop policy if exists "logos_owner_insert" on storage.objects;
create policy "logos_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] in (
      select s.id::text from public.shelters s where s.owner_id = auth.uid()
    )
  );

drop policy if exists "logos_owner_update" on storage.objects;
create policy "logos_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] in (
      select s.id::text from public.shelters s where s.owner_id = auth.uid()
    )
  );

drop policy if exists "logos_owner_delete" on storage.objects;
create policy "logos_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] in (
      select s.id::text from public.shelters s where s.owner_id = auth.uid()
    )
  );

-- ---------- Grants explícitos (Decisión #18; el control real es RLS) ----------
grant all on public.geocode_cache to service_role;
