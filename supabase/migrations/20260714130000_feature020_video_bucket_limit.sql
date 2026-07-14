-- ============================================================
-- ADOPTIA — FEATURE-020 (Fase B: vídeo MP4 subido)
-- El MP4 no se comprime en cliente, así que el bucket refuerza el tope
-- de tamaño (25 MB) que ya valida el uploader. Protege el Storage del
-- free tier. Las fotos (≤300 KB) quedan muy por debajo del límite.
-- ============================================================

update storage.buckets
set file_size_limit = 26214400 -- 25 MB
where id = 'animal-media';
