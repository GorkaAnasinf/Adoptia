-- FEATURE-029 — Propuestas de acogida estructuradas con trazabilidad.
-- La propuesta la crea la protectora (verificada, vía handler que revalida el
-- alcance con foster_homes_nearby) y la ve también el acogedor destinatario.
-- El bloqueo de reenvío vive en BD: índice único parcial sobre propuestas
-- activas. Baja del acogedor = supresión real (cascade desde foster_homes,
-- coherente con FEATURE-016); animal borrado conserva el historial (set null).

create table public.foster_proposals (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  foster_user_id uuid not null references public.foster_homes (user_id) on delete cascade,
  animal_id uuid references public.animals (id) on delete set null,
  duracion text not null check (char_length(duracion) between 1 and 120),
  mensaje text not null check (char_length(mensaje) between 1 and 1000),
  status text not null default 'enviada'
    check (status in ('enviada', 'aceptada', 'rechazada', 'finalizada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Una sola propuesta ABIERTA por pareja protectora-acogedor: el reenvío
-- infinito se corta aquí, no solo en la UI.
create unique index foster_proposals_activa_unica
  on public.foster_proposals (shelter_id, foster_user_id)
  where status in ('enviada', 'aceptada');

create index foster_proposals_foster_idx on public.foster_proposals (foster_user_id);
create index foster_proposals_shelter_idx on public.foster_proposals (shelter_id);

create trigger foster_proposals_set_updated_at
  before update on public.foster_proposals
  for each row execute function public.set_updated_at();

alter table public.foster_proposals enable row level security;

-- Lectura: la protectora dueña y el acogedor destinatario (y admin).
create policy "foster_proposals_select" on public.foster_proposals for select
  using (
    foster_user_id = auth.uid()
    or exists (
      select 1 from public.shelters s
      where s.id = shelter_id and s.owner_id = auth.uid()
    )
    or public.is_admin()
  );

-- Alta: solo el dueño de una protectora VERIFICADA, para su propia protectora,
-- y si indica animal debe ser suyo (defensa en profundidad: el handler ya lo valida).
create policy "foster_proposals_insert" on public.foster_proposals for insert
  with check (
    exists (
      select 1 from public.shelters s
      where s.id = shelter_id and s.owner_id = auth.uid() and s.status = 'verified'
    )
    and (
      animal_id is null
      or exists (
        select 1 from public.animals a
        where a.id = animal_id and a.shelter_id = shelter_id
      )
    )
  );

-- Estado: solo la protectora dueña actualiza sus propuestas.
create policy "foster_proposals_update" on public.foster_proposals for update
  using (
    exists (
      select 1 from public.shelters s
      where s.id = shelter_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shelters s
      where s.id = shelter_id and s.owner_id = auth.uid()
    )
  );

-- Borrado manual: solo admin (el ciclo de vida va por status; las cascadas
-- de acogedor/protectora las ejecuta la FK, no una policy).
create policy "foster_proposals_delete" on public.foster_proposals for delete
  using (public.is_admin());

grant select, insert, update, delete on public.foster_proposals to authenticated;
grant select, insert, update, delete on public.foster_proposals to service_role;
