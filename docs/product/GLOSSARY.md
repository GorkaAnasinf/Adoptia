# Glosario — Adoptia

| Término | Definición |
|---------|-----------|
| **Protectora** | Entidad (asociación/refugio) que acoge animales y gestiona sus adopciones. Usuario con rol `shelter`. |
| **Adoptante** | Persona que busca adoptar. Usuario con rol `adopter`. |
| **Ficha de animal** | Página pública de un animal: fotos, carácter, salud, historia. Entidad `animals`. |
| **Solicitud ("Me interesa")** | Petición de adopción de un adoptante sobre un animal, con cuestionario. Entidad `adoption_requests`. Una por animal y usuario. |
| **Cuestionario de pre-adopción** | Formulario (vivienda, experiencia, convivientes...) que filtra candidatos antes de que la protectora intervenga. Se guarda como `jsonb` en la solicitud. |
| **Cita** | Encuentro presencial adoptante-animal en la protectora, sobre franjas que ésta define. Entidad `appointments`. |
| **Verificación** | Revisión manual por admin de la documentación (CIF) de una protectora antes de hacerla pública. Estados: `pending → verified / suspended`. |
| **Reservado** | Animal con adopción en curso; sigue visible pero no admite nuevas solicitudes. |
| **Acogida (fostering)** | Hogar temporal para un animal, sin adopción. |
| **Apadrinamiento** | Aportación mensual a un animal difícil de adoptar (fase 3). |
| **Alerta guardada** | Búsqueda guardada que avisa por email cuando entra un animal que encaja (fase 2). Entidad `saved_searches`. |
| **RLS** | Row Level Security de PostgreSQL — las políticas de acceso viven en la BD, pilar de seguridad del proyecto. |
| **Item** | Unidad de trabajo (FEATURE/BUG/IMPROVEMENT) en `docs/planning/items/`. Única fuente de verdad de la planificación. |
| **Manada SDD** | Los 6 agentes de desarrollo del proyecto: Balto, Lassie, Snoopy, Bolt, Scooby, Hachiko. |
