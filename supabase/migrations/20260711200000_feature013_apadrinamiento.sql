-- FEATURE-013 — Apadrinamiento y donaciones (primera iteración: enlaces
-- externos, Adoptia NO procesa dinero). El dominio del enlace de pago se
-- valida también en BD: aunque un cliente se salte el formulario, un enlace
-- fuera de la lista permitida no puede guardarse.

-- Dominios permitidos: Stripe Payment Links, Teaming y PayPal.
create or replace function public.es_enlace_pago_valido(url text)
returns boolean
language sql
immutable
as $$
  select url ~* '^https://(buy\.stripe\.com|checkout\.stripe\.com|www\.teaming\.net|teaming\.net|www\.paypal\.com|paypal\.com|paypal\.me|www\.paypal\.me)/.+'
$$;

alter table public.animals
  add column if not exists sponsorable boolean not null default false,
  add column if not exists sponsor_link text,
  add column if not exists sponsor_note text;

alter table public.animals
  add constraint animals_sponsor_link_valido
  check (sponsor_link is null or public.es_enlace_pago_valido(sponsor_link));

-- Apadrinable exige enlace (sin enlace no hay botón que ofrecer)
alter table public.animals
  add constraint animals_sponsorable_con_enlace
  check (not sponsorable or sponsor_link is not null);

alter table public.shelters
  add column if not exists donation_link text;

alter table public.shelters
  add constraint shelters_donation_link_valido
  check (donation_link is null or public.es_enlace_pago_valido(donation_link));

-- ---------- Registro informativo de intenciones (métricas, no transaccional) ----------

create table public.sponsorships (
  id uuid primary key default gen_random_uuid(),
  animal_id uuid not null references public.animals (id) on delete cascade,
  -- Sin datos personales: solo cuenta clics en "Apadrinar" para métricas.
  created_at timestamptz not null default now()
);

create index sponsorships_animal_id_idx on public.sponsorships (animal_id);

alter table public.sponsorships enable row level security;

-- Solo lectura para la protectora dueña del animal y admin; la escritura la
-- hace el servidor (service_role) desde el route handler.
create policy "sponsorships_read" on public.sponsorships for select
  using (
    exists (
      select 1 from public.animals a
      join public.shelters s on s.id = a.shelter_id
      where a.id = animal_id and s.owner_id = auth.uid()
    )
    or public.is_admin()
  );

grant select on public.sponsorships to authenticated;
grant select, insert on public.sponsorships to service_role;
