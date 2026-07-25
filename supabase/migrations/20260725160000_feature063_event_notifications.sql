-- FEATURE-063 — Avisos de jornadas (F2). Idempotencia para el cron y matching
-- por zona con las búsquedas guardadas del adoptante.

-- Marcas de "ya avisado" (las escribe el cron con service role):
--  · reminded_at    → recordatorio 24 h enviado a ESE asistente.
--  · reminder_sent_at → resumen 24 h enviado a la protectora de ESE evento.
--  · zone_notified_at → aviso de jornada cercana ya emitido para ESE evento.
alter table public.event_attendees add column reminded_at timestamptz;
alter table public.events add column reminder_sent_at timestamptz;
alter table public.events add column zone_notified_at timestamptz;

-- Búsquedas guardadas ACTIVAS con zona (lat/lng/radio_km en `filters`) cuyo
-- radio cubre una jornada publicada y futura aún no avisada por zona. Devuelve
-- una fila por (evento, búsqueda) para que el cron agrupe por usuario.
-- `security definer`: el cron corre con service role, pero definer evita
-- depender de la RLS de saved_searches en el join. Sin grant a anon.
create or replace function public.event_zone_matches()
returns table (
  event_id uuid,
  event_title text,
  event_city text,
  starts_at timestamptz,
  user_id uuid,
  search_name text,
  unsubscribe_token uuid
)
language sql
security definer
set search_path = public, extensions
stable
as $$
  select e.id, e.title, e.city, e.starts_at, ss.user_id, ss.name, ss.unsubscribe_token
  from public.events e
  join public.shelters s on s.id = e.shelter_id
  join public.saved_searches ss
    on ss.active
   and (ss.filters ? 'lat') and (ss.filters ? 'lng') and (ss.filters ? 'radio_km')
   and st_dwithin(
         e.location,
         st_makepoint((ss.filters->>'lng')::double precision, (ss.filters->>'lat')::double precision)::geography,
         (ss.filters->>'radio_km')::double precision * 1000)
  where e.status = 'published'
    and s.status = 'verified'
    and e.ends_at >= now()
    and e.location is not null
    and e.zone_notified_at is null;
$$;

grant execute on function public.event_zone_matches() to service_role;
