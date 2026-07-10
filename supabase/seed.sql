-- Seed de demostración de Adoptia (FEATURE-008).
-- Se ejecuta con `supabase db reset` (o `supabase db reset --linked`).
-- SOLO para entornos de demo/desarrollo: crea usuarios con contraseña conocida.
--
-- Usuarios (contraseña de todos: AdoptiaDemo1!):
--   protectora.bilbao@demo.adoptia.es   → Protectora Última Oportunidad (Bilbao)
--   protectora.madrid@demo.adoptia.es   → Huellas Madrid
--   protectora.valencia@demo.adoptia.es → SOS Peludos Valencia
--   protectora.sevilla@demo.adoptia.es  → Refugio La Alameda (Sevilla)
--   adoptante.ana@demo.adoptia.es       → Ana (adoptante)
--   adoptante.luis@demo.adoptia.es      → Luis (adoptante)

-- ---------- Usuarios (el trigger handle_new_user crea sus profiles) ----------

insert into auth.users
  (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111101', 'authenticated', 'authenticated',
   'protectora.bilbao@demo.adoptia.es', extensions.crypt('AdoptiaDemo1!', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"role":"shelter","full_name":"Gestora Última Oportunidad"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111102', 'authenticated', 'authenticated',
   'protectora.madrid@demo.adoptia.es', extensions.crypt('AdoptiaDemo1!', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"role":"shelter","full_name":"Gestor Huellas Madrid"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111103', 'authenticated', 'authenticated',
   'protectora.valencia@demo.adoptia.es', extensions.crypt('AdoptiaDemo1!', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"role":"shelter","full_name":"Gestora SOS Peludos"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111104', 'authenticated', 'authenticated',
   'protectora.sevilla@demo.adoptia.es', extensions.crypt('AdoptiaDemo1!', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"role":"shelter","full_name":"Gestor La Alameda"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111201', 'authenticated', 'authenticated',
   'adoptante.ana@demo.adoptia.es', extensions.crypt('AdoptiaDemo1!', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"role":"adopter","full_name":"Ana Ejemplo"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111202', 'authenticated', 'authenticated',
   'adoptante.luis@demo.adoptia.es', extensions.crypt('AdoptiaDemo1!', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"role":"adopter","full_name":"Luis Ejemplo"}', now(), now())
on conflict (id) do nothing;

-- ---------- Protectoras (verificadas para que su contenido sea público) ----------

insert into public.shelters
  (id, owner_id, name, slug, description, email, phone, city, province, postal_code, location, status, accepts_volunteers, accepts_fostering)
values
  ('22222222-2222-4222-8222-222222222201', '11111111-1111-4111-8111-111111111101',
   'Protectora Última Oportunidad', 'protectora-ultima-oportunidad',
   'Llevamos 15 años rescatando perros y gatos del País Vasco. Trabajamos solo con casas de acogida: nuestros animales viven en hogares, no en jaulas.',
   'protectora.bilbao@demo.adoptia.es', '944000001', 'Bilbao', 'Bizkaia', '48001',
   extensions.st_makepoint(-2.9350, 43.2630)::extensions.geography, 'verified', true, true),
  ('22222222-2222-4222-8222-222222222202', '11111111-1111-4111-8111-111111111102',
   'Huellas Madrid', 'huellas-madrid',
   'Refugio a las afueras de Madrid con más de 200 animales. Organizamos jornadas de adopción todos los sábados y buscamos voluntariado para paseos.',
   'protectora.madrid@demo.adoptia.es', '910000002', 'Madrid', 'Madrid', '28001',
   extensions.st_makepoint(-3.7038, 40.4168)::extensions.geography, 'verified', true, false),
  ('22222222-2222-4222-8222-222222222203', '11111111-1111-4111-8111-111111111103',
   'SOS Peludos Valencia', 'sos-peludos-valencia',
   'Asociación especializada en gatos de colonia y perros abandonados de la huerta valenciana. Todos nuestros animales se entregan con chip, vacunas y esterilización.',
   'protectora.valencia@demo.adoptia.es', '960000003', 'Valencia', 'Valencia', '46001',
   extensions.st_makepoint(-0.3763, 39.4699)::extensions.geography, 'verified', false, true),
  ('22222222-2222-4222-8222-222222222204', '11111111-1111-4111-8111-111111111104',
   'Refugio La Alameda', 'refugio-la-alameda',
   'Pequeño refugio familiar en Sevilla centrado en galgos y podencos rescatados tras la temporada de caza.',
   'protectora.sevilla@demo.adoptia.es', '950000004', 'Sevilla', 'Sevilla', '41001',
   extensions.st_makepoint(-5.9845, 37.3891)::extensions.geography, 'verified', false, false)
on conflict (id) do nothing;

-- ---------- Animales ----------
-- Mayoría en adopción; algunos reservados/adoptados para que la demo tenga
-- historia; uno sin publicar (not_listed) para verificar que NO sale en el sitemap.

insert into public.animals
  (id, shelter_id, name, slug, species, breed, sex, birth_date_approx, size, status, description,
   good_with_kids, good_with_dogs, good_with_cats, apartment_suitable, energy_level,
   vaccinated, sterilized, microchipped, adoption_fee, published_at)
values
  -- Bilbao
  ('33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222201', 'Luna', 'luna-demo0001', 'dog', 'Mestiza de pastor', 'female', '2023-03-01', 'medium', 'available',
   'Luna llegó de un caserío con miedo a todo y hoy es pura alegría. Le encanta el monte, el agua y dormir patas arriba. Busca una familia activa que le siga el ritmo.',
   true, true, false, true, 'high', true, true, true, 150, now() - interval '20 days'),
  ('33333333-3333-4333-8333-333333333302', '22222222-2222-4222-8222-222222222201', 'Txuri', 'txuri-demo0002', 'cat', 'Europeo común', 'male', '2024-01-15', 'small', 'available',
   'Txuri es un gato blanco tranquilo y mimoso, perfecto para un piso. Se lleva bien con otros gatos y pasa las tardes al sol de la ventana.',
   true, false, true, true, 'low', true, true, true, 80, now() - interval '12 days'),
  ('33333333-3333-4333-8333-333333333303', '22222222-2222-4222-8222-222222222201', 'Rocco', 'rocco-demo0003', 'dog', 'Bóxer', 'male', '2019-06-01', 'large', 'available',
   'Rocco es un abuelete de sofá: paseos cortos, siestas largas y mucho cariño. Ideal para alguien tranquilo que quiera un compañero agradecido.',
   true, true, true, true, 'low', true, true, true, 100, now() - interval '30 days'),
  ('33333333-3333-4333-8333-333333333304', '22222222-2222-4222-8222-222222222201', 'Kira', 'kira-demo0004', 'dog', 'Border collie', 'female', '2022-09-01', 'medium', 'reserved',
   'Kira es una border collie listísima que necesita estímulo mental y ejercicio diario. Su familia de acogida la está preparando para su nueva vida.',
   true, true, false, false, 'high', true, true, true, 150, now() - interval '45 days'),
  ('33333333-3333-4333-8333-333333333305', '22222222-2222-4222-8222-222222222201', 'Misu', 'misu-demo0005', 'cat', 'Siamés cruzado', 'female', '2021-05-01', 'small', 'adopted',
   'Misu ya ha encontrado hogar: ahora reina en un ático de Getxo. La dejamos aquí como recuerdo feliz.',
   true, false, true, true, 'medium', true, true, true, 80, now() - interval '90 days'),
  ('33333333-3333-4333-8333-333333333306', '22222222-2222-4222-8222-222222222201', 'Beltza', 'beltza-demo0006', 'dog', 'Labrador cruzado', 'male', '2024-11-01', 'large', 'available',
   'Beltza es un cachorrón negro de mirada dulce. Está aprendiendo a pasear con correa y necesita una familia con paciencia y ganas de jugar.',
   true, true, null, false, 'high', true, false, true, 150, now() - interval '3 days'),

  -- Madrid
  ('33333333-3333-4333-8333-333333333311', '22222222-2222-4222-8222-222222222202', 'Curro', 'curro-demo0011', 'dog', 'Podenco', 'male', '2022-02-01', 'medium', 'available',
   'Curro apareció en una gasolinera de la A-4 y desde entonces no ha dejado de mover el rabo. Sociable con todo el mundo, perros incluidos.',
   true, true, false, true, 'medium', true, true, true, 120, now() - interval '15 days'),
  ('33333333-3333-4333-8333-333333333312', '22222222-2222-4222-8222-222222222202', 'Nube', 'nube-demo0012', 'cat', 'Persa cruzada', 'female', '2020-07-01', 'small', 'available',
   'Nube es una gata de pelo largo que necesita cepillado diario y un sofá a su nombre. A cambio ofrece ronroneo ilimitado.',
   true, false, true, true, 'low', true, true, true, 90, now() - interval '25 days'),
  ('33333333-3333-4333-8333-333333333313', '22222222-2222-4222-8222-222222222202', 'Thor', 'thor-demo0013', 'dog', 'Pastor alemán', 'male', '2021-01-01', 'large', 'available',
   'Thor es noble y protector, un pastor alemán de manual. Necesita una familia con experiencia en la raza y espacio para correr.',
   false, true, false, false, 'high', true, true, true, 150, now() - interval '40 days'),
  ('33333333-3333-4333-8333-333333333314', '22222222-2222-4222-8222-222222222202', 'Chispa', 'chispa-demo0014', 'dog', 'Chihuahua', 'female', '2023-10-01', 'small', 'available',
   'Chispa es pequeña de tamaño y enorme de carácter. Perfecta para piso, viaja genial en transportín y adora las mantas.',
   true, true, true, true, 'medium', true, true, true, 100, now() - interval '8 days'),
  ('33333333-3333-4333-8333-333333333315', '22222222-2222-4222-8222-222222222202', 'Simba', 'simba-demo0015', 'cat', 'Naranja atigrado', 'male', '2023-04-01', 'medium', 'adopted',
   'Simba ya duerme en su nuevo hogar de Alcalá. Fue de los gatos más compartidos de la plataforma.',
   true, false, true, true, 'medium', true, true, true, 80, now() - interval '100 days'),
  ('33333333-3333-4333-8333-333333333316', '22222222-2222-4222-8222-222222222202', 'Greta', 'greta-demo0016', 'dog', 'Mestiza', 'female', '2018-05-01', 'medium', 'available',
   'Greta lleva demasiado tiempo esperando en el refugio. Es tranquila, educada y está perfectamente sana: solo le falta una oportunidad.',
   true, true, true, true, 'low', true, true, true, 0, now() - interval '200 days'),

  -- Valencia
  ('33333333-3333-4333-8333-333333333321', '22222222-2222-4222-8222-222222222203', 'Taronja', 'taronja-demo0021', 'cat', 'Europeo naranja', 'male', '2024-03-01', 'small', 'available',
   'Taronja nació en una colonia de la huerta y se socializó en acogida. Es un torbellino naranja que juega con todo lo que se mueve.',
   true, false, true, true, 'high', true, true, true, 70, now() - interval '10 days'),
  ('33333333-3333-4333-8333-333333333322', '22222222-2222-4222-8222-222222222203', 'Sol', 'sol-demo0022', 'cat', 'Carey', 'female', '2022-06-01', 'small', 'available',
   'Sol es una carey independiente pero cariñosa a sus horas. Ideal como única gata de la casa.',
   true, false, false, true, 'medium', true, true, true, 70, now() - interval '18 days'),
  ('33333333-3333-4333-8333-333333333323', '22222222-2222-4222-8222-222222222203', 'Trufa', 'trufa-demo0023', 'dog', 'Bodeguero', 'female', '2023-08-01', 'small', 'available',
   'Trufa es una bodeguera incansable: pelota, pelota y más pelota. Se lleva genial con niños y otros perros.',
   true, true, false, true, 'high', true, true, true, 110, now() - interval '5 days'),
  ('33333333-3333-4333-8333-333333333324', '22222222-2222-4222-8222-222222222203', 'Pelusa', 'pelusa-demo0024', 'other', 'Conejo enano', 'female', '2024-05-01', 'small', 'available',
   'Pelusa es una conejita enana acostumbrada a vivir suelta en casa. Usa su bandeja y adora el heno fresco y las hojas de zanahoria.',
   true, null, null, true, 'low', true, true, false, 40, now() - interval '22 days'),
  ('33333333-3333-4333-8333-333333333325', '22222222-2222-4222-8222-222222222203', 'Gris', 'gris-demo0025', 'cat', 'Azul ruso cruzado', 'male', '2021-11-01', 'small', 'reserved',
   'Gris está en proceso de adopción con una familia de Gandía. ¡Crucemos los dedos!',
   true, false, true, true, 'low', true, true, true, 70, now() - interval '60 days'),
  ('33333333-3333-4333-8333-333333333326', '22222222-2222-4222-8222-222222222203', 'Llum', 'llum-demo0026', 'cat', 'Europea blanca', 'female', '2025-01-01', 'small', 'not_listed',
   'Ficha en preparación: Llum acaba de llegar y está en revisión veterinaria.',
   null, null, null, null, null, false, false, false, null, null),

  -- Sevilla
  ('33333333-3333-4333-8333-333333333331', '22222222-2222-4222-8222-222222222204', 'Bruno', 'bruno-demo0031', 'dog', 'Galgo español', 'male', '2020-10-01', 'large', 'available',
   'Bruno es un galgo rescatado tras la temporada de caza. Tranquilo, silencioso y perfecto para piso: dos paseos y sofá.',
   true, true, true, true, 'low', true, true, true, 130, now() - interval '35 days'),
  ('33333333-3333-4333-8333-333333333332', '22222222-2222-4222-8222-222222222204', 'Canela', 'canela-demo0032', 'dog', 'Podenca', 'female', '2022-12-01', 'medium', 'available',
   'Canela es dulce como su nombre. Al principio es tímida, pero cuando confía se convierte en tu sombra.',
   true, true, false, true, 'medium', true, true, true, 120, now() - interval '28 days'),
  ('33333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222204', 'Rayo', 'rayo-demo0033', 'dog', 'Galgo español', 'male', '2023-02-01', 'large', 'available',
   'Rayo hace honor a su nombre en el campo, pero en casa es puro peluche. Convive con gatos sin problema.',
   true, true, true, true, 'medium', true, true, true, 130, now() - interval '14 days'),
  ('33333333-3333-4333-8333-333333333334', '22222222-2222-4222-8222-222222222204', 'Alba', 'alba-demo0034', 'dog', 'Podenca andaluza', 'female', '2021-04-01', 'medium', 'adopted',
   'Alba ya vive feliz en Cádiz con dos niños que la adoran. Historias así son las que nos hacen seguir.',
   true, true, false, true, 'medium', true, true, true, 120, now() - interval '120 days'),
  ('33333333-3333-4333-8333-333333333335', '22222222-2222-4222-8222-222222222204', 'Duque', 'duque-demo0035', 'dog', 'Mastín', 'male', '2019-01-01', 'large', 'available',
   'Duque es un mastín gigante de corazón aún más grande. Necesita espacio y una familia que conozca razas grandes.',
   true, true, true, false, 'low', true, true, true, 100, now() - interval '75 days')
on conflict (id) do nothing;

-- ---------- Fotos (Unsplash, licencia libre) ----------

insert into public.animal_media (animal_id, type, url, is_cover, sort_order)
values
  ('33333333-3333-4333-8333-333333333301', 'photo', 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333302', 'photo', 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333303', 'photo', 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333304', 'photo', 'https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333305', 'photo', 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333306', 'photo', 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333311', 'photo', 'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333312', 'photo', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333313', 'photo', 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333314', 'photo', 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333315', 'photo', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333316', 'photo', 'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333321', 'photo', 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333322', 'photo', 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333323', 'photo', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333324', 'photo', 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333325', 'photo', 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333331', 'photo', 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333332', 'photo', 'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333333', 'photo', 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333334', 'photo', 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&q=80', true, 0),
  ('33333333-3333-4333-8333-333333333335', 'photo', 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=1200&q=80', true, 0)
on conflict do nothing;

-- ---------- Solicitudes de ejemplo ----------

insert into public.adoption_requests (id, animal_id, adopter_id, status, questionnaire, message)
values
  ('44444444-4444-4444-8444-444444444401', '33333333-3333-4333-8333-333333333301', '11111111-1111-4111-8111-111111111201', 'pending',
   '{"vivienda":"casa_jardin","regimen":"propiedad","convivientes":3,"ninos_edades":[8,11],"otros_animales":"Una gata esterilizada de 5 años","experiencia":"Siempre hemos tenido perros en casa","horas_solo":3,"todos_de_acuerdo":true,"message":"Nos encanta Luna, vivimos junto al monte y buscamos una compañera activa.","aceptaRgpd":true}',
   'Nos encanta Luna, vivimos junto al monte y buscamos una compañera activa.'),
  ('44444444-4444-4444-8444-444444444402', '33333333-3333-4333-8333-333333333304', '11111111-1111-4111-8111-111111111202', 'approved',
   '{"vivienda":"casa_jardin","regimen":"propiedad","convivientes":2,"ninos_edades":[],"otros_animales":"","experiencia":"He adiestrado perros de deporte","horas_solo":2,"todos_de_acuerdo":true,"message":"Practico agility y busco una perra con ganas de aprender.","aceptaRgpd":true}',
   'Practico agility y busco una perra con ganas de aprender.'),
  ('44444444-4444-4444-8444-444444444403', '33333333-3333-4333-8333-333333333305', '11111111-1111-4111-8111-111111111202', 'completed',
   '{"vivienda":"piso","regimen":"alquiler","permiten_animales":true,"convivientes":1,"ninos_edades":[],"otros_animales":"","experiencia":"Primer gato, pero con mucha ilusión","horas_solo":6,"todos_de_acuerdo":true,"message":"Busco compañía tranquila para mi ático.","aceptaRgpd":true}',
   'Busco compañía tranquila para mi ático.')
on conflict (id) do nothing;
