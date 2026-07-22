-- FEATURE-057 — Plantillas de horario reutilizables de la agenda.
-- La protectora guarda horarios con nombre ("Mañanas L-V") y los aplica a los
-- días que elija. A diferencia de availability_overrides, las plantillas son
-- INTERNAS de la protectora: no hay lectura pública, solo la dueña (o admin).

create table public.availability_templates (
  id uuid primary key default gen_random_uuid(),
  shelter_id uuid not null references public.shelters (id) on delete cascade,
  nombre text not null,
  slots jsonb not null default '[]'::jsonb, -- [{start,end,minutes}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shelter_id, nombre),
  check (jsonb_typeof(slots) = 'array'),
  check (jsonb_array_length(slots) >= 1),
  check (public.availability_override_slots_ok(slots))
);

create index availability_templates_shelter_idx on public.availability_templates (shelter_id);

create trigger availability_templates_set_updated_at
  before update on public.availability_templates
  for each row execute function public.set_updated_at();

alter table public.availability_templates enable row level security;

-- Solo la dueña de la protectora (o admin) ve y gestiona sus plantillas.
-- No hay política de lectura pública: no son información publicable.
create policy "availability_templates_owner_all" on public.availability_templates for all
  using (
    exists (select 1 from public.shelters s where s.id = shelter_id and s.owner_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.shelters s where s.id = shelter_id and s.owner_id = auth.uid())
    or public.is_admin()
  );

grant select, insert, update, delete on public.availability_templates to authenticated, service_role;
