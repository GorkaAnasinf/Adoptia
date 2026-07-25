-- FEATURE-064 — Jornadas de adopción (F3). Resultado de una jornada finalizada.
-- La protectora, al cerrar una jornada pasada (estado `finished`), declara
-- cuántas adopciones se cerraron y cuánta gente asistió. Son AGREGADOS sin
-- datos personales: `adoptions_count` alimenta las estadísticas de la protectora
-- y el social proof público ("en nuestras jornadas, N animales encontraron
-- casa"). No se vinculan adopciones reales (no hay entidad de adopción cerrada
-- por jornada): es un dato declarado por la dueña (Decisión #56).

alter table public.events
  add column adoptions_count int check (adoptions_count is null or adoptions_count >= 0),
  add column attended_count int check (attended_count is null or attended_count >= 0);
