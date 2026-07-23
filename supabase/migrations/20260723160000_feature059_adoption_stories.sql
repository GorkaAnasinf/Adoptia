-- ============================================================
-- FEATURE-059 — Historias felices Nivel 2: testimonios del adoptante.
--
-- El adoptante escribe un testimonio (frase + foto opcional) sobre un animal que
-- adoptó; la PROTECTORA DUEÑA lo modera (aprobar/rechazar) y solo los aprobados
-- salen en la home. Foto y texto son datos personales del adoptante → RGPD:
-- consentimiento explícito obligatorio.
-- ============================================================

create table public.adoption_stories (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals (id) on delete cascade,
  adopter_id uuid not null references auth.users (id) on delete cascade,
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  quote text not null,
  photo_url text,
  consent boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  shelter_note text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint adoption_stories_consent_required check (consent),
  constraint adoption_stories_one_per_adopter_animal unique (adopter_id, animal_id)
);

create index adoption_stories_shelter_status_idx
  on public.adoption_stories (shelter_id, status);
create index adoption_stories_public_idx
  on public.adoption_stories (status, published_at desc);

create trigger adoption_stories_set_updated_at
  before update on public.adoption_stories
  for each row execute function public.set_updated_at();

-- ---------- RLS ----------
alter table public.adoption_stories enable row level security;

-- El adoptante solo puede crear una historia SUYA y solo de un animal que
-- adoptó (adopción `completed`); el shelter_id debe ser el del animal.
create policy "adoption_stories_insert_own" on public.adoption_stories
  for insert to authenticated
  with check (
    adopter_id = auth.uid()
    and consent
    and exists (
      select 1
      from public.adoption_requests r
      join public.animals a on a.id = r.animal_id
      where r.animal_id = adoption_stories.animal_id
        and r.adopter_id = auth.uid()
        and r.status = 'completed'
        and a.shelter_id = adoption_stories.shelter_id
    )
  );

-- Lectura: pública solo de aprobadas; el adoptante ve las suyas; la protectora
-- dueña ve las de su refugio (para moderar).
create policy "adoption_stories_read_public" on public.adoption_stories
  for select using (status = 'approved');

create policy "adoption_stories_read_own" on public.adoption_stories
  for select to authenticated using (adopter_id = auth.uid());

create policy "adoption_stories_read_shelter" on public.adoption_stories
  for select to authenticated using (
    shelter_id in (select s.id from public.shelters s where s.owner_id = auth.uid())
  );

-- El adoptante edita las suyas mientras estén pendientes (no puede autoaprobarse:
-- el WITH CHECK exige que sigan en 'pending').
create policy "adoption_stories_update_own_pending" on public.adoption_stories
  for update to authenticated
  using (adopter_id = auth.uid() and status = 'pending')
  with check (adopter_id = auth.uid() and status = 'pending');

-- La protectora dueña modera (cambiar estado / nota).
create policy "adoption_stories_update_shelter" on public.adoption_stories
  for update to authenticated
  using (shelter_id in (select s.id from public.shelters s where s.owner_id = auth.uid()))
  with check (shelter_id in (select s.id from public.shelters s where s.owner_id = auth.uid()));

-- El adoptante puede borrar la suya.
create policy "adoption_stories_delete_own" on public.adoption_stories
  for delete to authenticated using (adopter_id = auth.uid());

grant select, insert, update, delete on public.adoption_stories to authenticated;
grant select on public.adoption_stories to anon;

-- ---------- Bucket de fotos de historias ----------
insert into storage.buckets (id, name, public)
values ('story-media', 'story-media', true)
on conflict (id) do nothing;

-- La primera carpeta del path es el uid del adoptante dueño del contenido.
drop policy if exists "story_media_public_read" on storage.objects;
create policy "story_media_public_read" on storage.objects
  for select using (bucket_id = 'story-media');

drop policy if exists "story_media_owner_insert" on storage.objects;
create policy "story_media_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'story-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "story_media_owner_update" on storage.objects;
create policy "story_media_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'story-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "story_media_owner_delete" on storage.objects;
create policy "story_media_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'story-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

comment on table public.adoption_stories is
  'Testimonios del adoptante (FEATURE-059). Moderados por la protectora dueña; solo status=approved es público. consent obligatorio (RGPD).';
