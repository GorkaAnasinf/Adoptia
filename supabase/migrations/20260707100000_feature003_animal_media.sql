-- ============================================================
-- ADOPTIA — FEATURE-003: Gestión de animales (BD)
-- - Bucket de Storage 'animal-media' (público) con políticas por
--   carpeta shelter_id/ (patrón del bucket 'logos').
-- - Índice único parcial: una sola portada (is_cover) por animal.
-- ============================================================

-- ---------- Portada única por animal ----------
create unique index if not exists animal_media_one_cover_idx
  on public.animal_media (animal_id) where is_cover;

-- ---------- Bucket de media de animales ----------
insert into storage.buckets (id, name, public)
values ('animal-media', 'animal-media', true)
on conflict (id) do nothing;

-- La primera carpeta del path es el shelter_id dueño del contenido.
drop policy if exists "animal_media_public_read" on storage.objects;
create policy "animal_media_public_read" on storage.objects
  for select using (bucket_id = 'animal-media');

drop policy if exists "animal_media_owner_insert" on storage.objects;
create policy "animal_media_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'animal-media'
    and (storage.foldername(name))[1] in (
      select s.id::text from public.shelters s where s.owner_id = auth.uid()
    )
  );

drop policy if exists "animal_media_owner_update" on storage.objects;
create policy "animal_media_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'animal-media'
    and (storage.foldername(name))[1] in (
      select s.id::text from public.shelters s where s.owner_id = auth.uid()
    )
  );

drop policy if exists "animal_media_owner_delete" on storage.objects;
create policy "animal_media_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'animal-media'
    and (storage.foldername(name))[1] in (
      select s.id::text from public.shelters s where s.owner_id = auth.uid()
    )
  );
