# Privacidad y RGPD — Adoptia

Adoptia trata datos personales de **adoptantes** (identidad, contacto, cuestionario de pre-adopción con datos de su hogar) y **gestores de protectoras** (identidad, contacto). Este documento es la referencia interna; la política pública se publica en `/privacidad` (FEATURE-008).

## Base legal por tratamiento

| Tratamiento | Datos | Base legal (RGPD art. 6) |
|-------------|-------|--------------------------|
| Cuenta de usuario | email, nombre, teléfono opcional | Ejecución de contrato (6.1.b) |
| Cuestionario pre-adopción | vivienda, convivientes, experiencia | Consentimiento explícito (6.1.a) — checkbox en el stepper |
| Compartir solicitud con la protectora | cuestionario + mensaje; contacto solo tras aprobación | Ejecución de contrato (6.1.b) + minimización |
| Emails transaccionales | email | Ejecución de contrato (6.1.b) |
| Alertas por email | email + criterios de búsqueda | Consentimiento (6.1.a), baja en un clic |
| Analítica | agregados sin cookies (Umami) | Interés legítimo (6.1.f) — sin PII |
| Verificación de protectoras | CIF, documentación | Interés legítimo (6.1.f) — prevención de fraude |

**No hay decisiones automatizadas con efectos jurídicos (art. 22):** el cuestionario NO filtra ni puntúa automáticamente — la decisión sobre cada solicitud la toma siempre una persona de la protectora.

## Derechos del interesado

Canal: email de privacidad (definir buzón) o desde la cuenta. Plazo de respuesta: **<30 días**. Procedimiento operativo en [RB-07](../operations/RUNBOOKS.md#rb-07--solicitud-rgpd-supresiónacceso).

| Derecho | Implementación |
|---------|----------------|
| Acceso / portabilidad | Export JSON de `profiles` + solicitudes + favoritos del usuario |
| Rectificación | Edición desde la cuenta |
| Supresión | Borrado en cascada de perfil, solicitudes, favoritos, alertas y media propia; las solicitudes en protectoras se anonimizan (conservan estadística, pierden identidad) |
| Oposición / retirada de consentimiento | Baja de alertas y emails no transaccionales en un clic |

## Encargados de tratamiento (DPA)

| Proveedor | Papel | Ubicación datos | DPA |
|-----------|-------|-----------------|-----|
| Supabase | BD, Auth, Storage | Región UE (elegir eu-west al crear) | DPA estándar disponible |
| Vercel | Hosting/edge | Global (funciones en UE configurables) | DPA disponible |
| Resend | Email | EE. UU. — SCCs | DPA disponible |
| Sentry | Errores (scrub de PII activado) | UE configurable | DPA disponible |
| Umami | Analítica sin cookies ni PII | — | No trata datos personales |

Acción pendiente al contratar cada servicio: aceptar/archivar su DPA y anotarlo aquí.

## Medidas técnicas

- Minimización: contacto del adoptante oculto hasta aprobación; ubicaciones de particulares redondeadas (~200 m); la geolocalización del navegador nunca se persiste.
- RLS como control de acceso a datos (ver [SECURITY](../operations/SECURITY.md)).
- Cifrado en tránsito (HTTPS) y en reposo (Supabase).
- Retención: cuentas inactivas >3 años → aviso y supresión; logs de auditoría 1 año.
- Sentry con `beforeSend` que elimina emails/nombres de los eventos.

## Cookies

Solo cookies técnicas de sesión (httpOnly, exentas de consentimiento) + analítica sin cookies → banner mínimo informativo, sin muro de consentimiento.
