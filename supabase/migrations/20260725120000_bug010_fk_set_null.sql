-- BUG-010 — FKs sin ON DELETE CASCADE bloquean el borrado de una cuenta.
--
-- `appointments.cancelled_by` (FEATURE-009) y `reports.reviewed_by`
-- (FEATURE-011) referenciaban `profiles(id)` con NO ACTION: si una cuenta llegó
-- a cancelar una cita o revisar un reporte, borrarla (baja de usuario, RGPD,
-- limpieza) fallaba con "foreign key violation". Ambas columnas son opcionales
-- y meramente informativas (quién hizo la acción), así que la semántica correcta
-- es SET NULL: se conserva la cita/el reporte y se desvincula al autor borrado.

alter table public.appointments
  drop constraint appointments_cancelled_by_fkey,
  add constraint appointments_cancelled_by_fkey
    foreign key (cancelled_by) references public.profiles(id) on delete set null;

alter table public.reports
  drop constraint reports_reviewed_by_fkey,
  add constraint reports_reviewed_by_fkey
    foreign key (reviewed_by) references public.profiles(id) on delete set null;
