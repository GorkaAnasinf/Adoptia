-- FEATURE-011 — Moderación de contenido y cuentas (admin).
-- `reports`: contenido reportado por usuarios (tope diario en BD).
-- `audit_log`: registro inmutable de acciones de admin (trigger bloquea
-- update/delete incluso a service_role; RLS solo lectura para admins).
-- `animals.moderation_note`: motivo visible para la protectora cuando un
-- admin despublica una ficha.

-- ---------- Motivo de moderación en fichas ----------

alter table public.animals add column if not exists moderation_note text;

-- ---------- Reportes ----------

create type public.report_reason as enum
  ('contenido_inapropiado', 'posible_fraude', 'spam', 'maltrato', 'otro');

create type public.report_status as enum ('pending', 'reviewed', 'dismissed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  animal_id uuid not null references public.animals (id) on delete cascade,
  reason public.report_reason not null,
  details text,
  status public.report_status not null default 'pending',
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index reports_status_idx on public.reports (status);
create index reports_animal_id_idx on public.reports (animal_id);

alter table public.reports enable row level security;

create policy "reports_insert_own" on public.reports for insert
  with check (reporter_id = auth.uid());

create policy "reports_read" on public.reports for select
  using (reporter_id = auth.uid() or public.is_admin());

create policy "reports_admin_update" on public.reports for update
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update on public.reports to authenticated;
grant select, insert, update, delete on public.reports to service_role;

-- Anti-abuso: máximo 5 reportes por usuario y día, atómico en BD.
create or replace function public.check_reports_limit()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*) from public.reports
    where reporter_id = new.reporter_id
      and created_at > now() - interval '24 hours'
  ) >= 5 then
    raise exception 'reports_limit' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger reports_limit
  before insert on public.reports
  for each row execute function public.check_reports_limit();

-- ---------- Log de auditoría (inmutable) ----------

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles (id),
  action text not null,
  target_type text not null,
  target_id uuid not null,
  reason text,
  created_at timestamptz not null default now()
);

create index audit_log_created_at_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;

create policy "audit_log_admin_read" on public.audit_log for select
  using (public.is_admin());

create policy "audit_log_admin_insert" on public.audit_log for insert
  with check (admin_id = auth.uid() and public.is_admin());

grant select, insert on public.audit_log to authenticated;
grant select, insert on public.audit_log to service_role;

-- Inmutable de verdad: los triggers aplican también a service_role (que solo
-- salta RLS, no triggers). Sin policies de update/delete y además esto.
create or replace function public.audit_log_inmutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_log_inmutable';
end;
$$;

create trigger audit_log_no_update
  before update or delete on public.audit_log
  for each row execute function public.audit_log_inmutable();
