# Plan de producto — Adoptia

## El problema

Adoptar un animal hoy es un proceso disperso: los animales se anuncian en Instagram y Facebook, el contacto es por teléfono o mensaje privado, cada protectora hace su propio filtro manual de candidatos y las citas se conciertan a mano. Resultado: animales con poca visibilidad, protectoras saturadas de trabajo administrativo y adoptantes que abandonan el proceso por fricción.

## La visión

Un único lugar donde:

- Los **animales** tienen visibilidad real (fichas completas, indexables en Google, cerca del adoptante).
- Las **protectoras** ahorran trabajo: el cuestionario de pre-adopción filtra antes de que ellas intervengan, y la agenda de citas se gestiona sola.
- Los **adoptantes** tienen un proceso claro: buscar → conocer → solicitar → cita.

## Propuesta de valor

| Para | Valor |
|------|-------|
| Protectoras | Más visibilidad, menos administración. Gratis. |
| Adoptantes | Buscar por proximidad y compatibilidad, proceso guiado. Gratis. |
| Ecosistema | Fase 3: perdidos/encontrados, apadrinamientos, casas de acogida — herramienta completa de protección animal. |

## Límites del MVP (hito 0.2)

**Dentro:** alta y verificación de protectoras, CRUD de animales con fotos/vídeo, área pública (home, listado con filtros, fichas), mapa con búsqueda por proximidad, solicitud "Me interesa" con cuestionario, bandeja de solicitudes, emails transaccionales, SEO y datos de demo.

**Fuera (fases 2-3):** citas con calendario, favoritos, alertas, perdidos/encontrados, apadrinamientos, estadísticas, difusión RRSS, contenido educativo, casas de acogida, app móvil nativa.

## Restricciones de partida

- **Coste 0 €**: todo en free tiers (Vercel, Supabase, Resend, OSM). Ver [DECISIONS](../technical/DECISIONS.md).
- **Mobile first**: 80%+ del tráfico esperado es móvil.
- **RGPD** desde el día 1: datos personales de adoptantes y protectoras. Ver [PRIVACY](../meta/PRIVACY.md).
- **Confianza**: verificación manual de protectoras antes de publicarlas.

## Métricas objetivo (presentación)

Nº de protectoras registradas · nº de animales publicados · solicitudes/mes · adopciones completadas · tiempo medio hasta adopción.

## Fases

| Fase | Hito | Contenido |
|------|------|-----------|
| Andamiaje | 0.1 | Proyecto funcionando de extremo a extremo |
| MVP | 0.2 | Todo lo de "Dentro" — presentable a dirección |
| Fase 2 | 0.3 | Citas + agenda, área personal adoptante, moderación |
| Fase 3 | 0.4 | Perdidos/encontrados, apadrinamiento, estadísticas, educativo, acogidas |
