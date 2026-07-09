-- ============================================================
-- ADOPTIA — FEATURE-004: fotos de instalaciones de la protectora
-- Bucket de Storage 'shelter-media' (público) con políticas por carpeta
-- shelter_id/ (mismo patrón que 'logos' y 'animal-media').
-- La tabla public.shelter_media y su RLS ya vienen del baseline.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('shelter-media', 'shelter-media', true)
on conflict (id) do nothing;

drop policy if exists "shelter_media_public_read" on storage.objects;
create policy "shelter_media_public_read" on storage.objects
  for select using (bucket_id = 'shelter-media');

drop policy if exists "shelter_media_owner_insert" on storage.objects;
create policy "shelter_media_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'shelter-media'
    and (storage.foldername(name))[1] in (
      select s.id::text from public.shelters s where s.owner_id = auth.uid()
    )
  );

drop policy if exists "shelter_media_owner_update" on storage.objects;
create policy "shelter_media_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'shelter-media'
    and (storage.foldername(name))[1] in (
      select s.id::text from public.shelters s where s.owner_id = auth.uid()
    )
  );

drop policy if exists "shelter_media_owner_delete" on storage.objects;
create policy "shelter_media_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'shelter-media'
    and (storage.foldername(name))[1] in (
      select s.id::text from public.shelters s where s.owner_id = auth.uid()
    )
  );
