---
id: FEATURE-061
tipo: feature
titulo: Buscador global en la cabecera del área privada
estado: recibido
prioridad: media
hito: null
duplicado_de: null
creado: 2026-07-23
actualizado: 2026-07-23
---

# FEATURE-061 — Buscador global en la cabecera del área privada

## Descripción

Añadir un buscador global en la cabecera del área privada (paneles de protectora
y `/mi-cuenta`) que permita saltar rápido a un animal, una solicitud, una cita o
una sección sin navegar por el menú. Resultados agrupados por tipo, con teclado
(atajo para abrir, flechas para navegar) y respetando RLS (cada usuario solo ve
lo suyo).

## Contexto / impacto

Detectado en FEATURE-039 al revisar el área privada. A medida que crecen los
datos de una protectora (animales, solicitudes, citas), el menú se queda corto;
un buscador reduce la fricción de encontrar algo concreto. Alcance a acotar en el
plan: qué entidades entran en el índice y si la búsqueda es cliente o servidor.
