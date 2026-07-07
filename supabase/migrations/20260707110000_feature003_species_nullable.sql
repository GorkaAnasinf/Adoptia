-- ============================================================
-- ADOPTIA — FEATURE-003: borrador con solo el nombre
-- La especie deja de ser obligatoria en BD: un borrador puede guardarse
-- con solo el nombre. La exigencia de especie al PUBLICAR la impone la
-- capa de aplicación (animalPublishSchema / validarPublicacion).
-- ============================================================

alter table public.animals
  alter column species drop not null;
