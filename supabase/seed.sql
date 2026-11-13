-- Seed de Radio Campus (Fase 3)
-- Es idempotente: se puede volver a correr (no duplica canciones, reglas, eventos ni playlists).
-- Los ajustes de "settings" SÍ se sobrescriben: úsalo en una base nueva.
--
-- CANCIONES: 39 (pop: 8, rock: 5, electronica: 5, instrumental: 7, regional mexicano: 8, navideña: 6).
-- Cada youtube_id se verificó el 2026-11-13 contra
--   https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=ID&format=json
-- (HTTP 200, el video permite embed y el título real coincide con la canción).
-- duration_sec es la duración real del video. Si algún video se elimina o bloquea el embed,
-- desactívalo o cámbialo desde /admin (la pantalla ya salta a respaldo y lo registra).
--
-- No hay canciones lo-fi: no se encontró ninguna pista individual (solo mixes largos y
-- transmisiones en vivo, que no tienen duración). Agrégalas desde /admin.

-- ============================================================
-- Canciones
-- ============================================================
insert into public.songs (youtube_id, title, artist, duration_sec, genre, energy, mood, theme) values
  ('JGwWNGJdvx8', 'Shape of You', 'Ed Sheeran', 263, 'pop', 4, 'alegre', null),
  ('OPf0YbXqDm0', 'Uptown Funk', 'Mark Ronson ft. Bruno Mars', 270, 'pop', 5, 'alegre', null),
  ('kJQP7kiw5Fk', 'Despacito', 'Luis Fonsi ft. Daddy Yankee', 282, 'pop', 4, 'alegre', null),
  ('YykjpeuMNEk', 'Hymn for the Weekend', 'Coldplay', 261, 'pop', 4, 'fresco', null),
  ('450p7goxZqg', 'All of Me', 'John Legend', 307, 'pop', 2, 'romantico', null),
  ('ZbZSe6N_BXs', 'Happy', 'Pharrell Williams', 241, 'pop', 4, 'alegre', null),
  ('pRpeEdMmmQ0', 'Waka Waka (This Time for Africa)', 'Shakira', 211, 'pop', 4, 'fresco', null),
  ('NUsoVlDFqZg', 'Bailando', 'Enrique Iglesias', 287, 'pop', 4, 'fresco', null),
  ('fJ9rUzIMcZQ', 'Bohemian Rhapsody', 'Queen', 359, 'rock', 4, 'intenso', null),
  ('hTWKbfoikeg', 'Smells Like Teen Spirit', 'Nirvana', 278, 'rock', 5, 'intenso', null),
  ('1w7OgIMMRc4', 'Sweet Child O'' Mine', 'Guns N'' Roses', 303, 'rock', 4, 'intenso', null),
  ('v2AC41dglnM', 'Thunderstruck', 'AC/DC', 293, 'rock', 5, 'intenso', null),
  ('lDK9QqIzhwk', 'Livin'' on a Prayer', 'Bon Jovi', 249, 'rock', 4, 'alegre', null),
  ('IcrbM1l_BoI', 'Wake Me Up', 'Avicii', 273, 'electronica', 4, 'alegre', null),
  ('_ovdm2yX4MA', 'Levels', 'Avicii', 198, 'electronica', 5, 'energico', null),
  ('kOkQ4T5WO9E', 'This Is What You Came For', 'Calvin Harris ft. Rihanna', 239, 'electronica', 4, 'fresco', null),
  ('FGBhQbmPwH8', 'One More Time', 'Daft Punk', 321, 'electronica', 5, 'alegre', null),
  ('60ItHLz5WEA', 'Faded', 'Alan Walker', 213, 'electronica', 3, 'melancolico', null),
  ('CvFH_6DNRCY', 'Clair de Lune', 'Claude Debussy', 302, 'instrumental', 1, 'calmado', null),
  ('9E6b3swbnWg', 'Nocturne Op. 9 No. 2', 'Frédéric Chopin', 269, 'instrumental', 1, 'calmado', null),
  ('NlprozGcs80', 'Canon in D', 'Johann Pachelbel', 376, 'instrumental', 2, 'calmado', null),
  ('7maJOI3QMu0', 'River Flows in You', 'Yiruma', 210, 'instrumental', 2, 'calmado', null),
  ('hN_q-_nGv4U', 'Experience', 'Ludovico Einaudi', 382, 'instrumental', 2, 'calmado', null),
  ('S-Xm7s9eGxU', 'Gymnopédie No. 1', 'Erik Satie', 217, 'instrumental', 1, 'calmado', null),
  ('sR2W2scFS4Y', 'Nuvole Bianche', 'Ludovico Einaudi', 362, 'instrumental', 1, 'calmado', null),
  ('ugNQ5uIN09Q', 'Volver, Volver', 'Vicente Fernández', 180, 'regional mexicano', 2, 'melancolico', null),
  ('rryDND06LHU', 'La Puerta Negra', 'Los Tigres del Norte', 203, 'regional mexicano', 3, 'intenso', null),
  ('NCvJwzDQTBM', 'La Bikina', 'Luis Miguel', 179, 'regional mexicano', 2, 'romantico', null),
  ('g2BzGJnNvEw', 'Ya Supérame', 'Grupo Firme', 201, 'regional mexicano', 4, 'alegre', null),
  ('jhMiIUb2GEA', 'Primera Cita', 'Carín León', 219, 'regional mexicano', 3, 'romantico', null),
  ('nxXvOEPsE0s', 'Cómo Te Voy a Olvidar', 'Los Ángeles Azules', 268, 'regional mexicano', 4, 'alegre', null),
  ('bb5K3vpNEvw', 'Amorcito Corazón', 'Pedro Infante', 184, 'regional mexicano', 2, 'romantico', null),
  ('OHeHOb3E-2g', 'Cielito Lindo', 'Mariachi Nuevo Tecalitlán', 222, 'regional mexicano', 3, 'alegre', null),
  ('yXQViqx6GMY', 'All I Want for Christmas Is You', 'Mariah Carey', 235, 'navideña', 4, 'festivo', 'navidad'),
  ('E8gmARGvPlI', 'Last Christmas', 'Wham!', 278, 'navideña', 3, 'festivo', 'navidad'),
  ('xMtuVP8Mj4o', 'Feliz Navidad', 'José Feliciano', 191, 'navideña', 3, 'festivo', 'navidad'),
  ('nlR0MkrRklg', 'Santa Tell Me', 'Ariana Grande', 340, 'navideña', 3, 'festivo', 'navidad'),
  ('TFsZy9t-qDc', 'Rockin'' Around the Christmas Tree', 'Brenda Lee', 129, 'navideña', 4, 'festivo', 'navidad'),
  ('QJ5DOWPGxwg', 'It''s Beginning to Look a Lot Like Christmas', 'Michael Bublé', 207, 'navideña', 2, 'festivo', 'navidad')
on conflict (youtube_id) do nothing;

-- ============================================================
-- Playlists
-- ============================================================
insert into public.playlists (name, is_fallback) values ('respaldo', true)
on conflict (name) do nothing;
insert into public.playlists (name, is_fallback) values ('Estudio y concentración', false)
on conflict (name) do nothing;

insert into public.playlist_songs (playlist_id, song_id, position)
select p.id, s.id, x.ord
from (values ('ZbZSe6N_BXs', 0), ('JGwWNGJdvx8', 1), ('YykjpeuMNEk', 2), ('450p7goxZqg', 3), ('IcrbM1l_BoI', 4), ('7maJOI3QMu0', 5), ('sR2W2scFS4Y', 6), ('OHeHOb3E-2g', 7)) as x(yt, ord)
join public.songs s on s.youtube_id = x.yt
join public.playlists p on p.name = 'respaldo'
on conflict do nothing;

insert into public.playlist_songs (playlist_id, song_id, position)
select p.id, s.id, x.ord
from (values ('CvFH_6DNRCY', 0), ('9E6b3swbnWg', 1), ('NlprozGcs80', 2), ('7maJOI3QMu0', 3), ('hN_q-_nGv4U', 4), ('S-Xm7s9eGxU', 5), ('sR2W2scFS4Y', 6)) as x(yt, ord)
join public.songs s on s.youtube_id = x.yt
join public.playlists p on p.name = 'Estudio y concentración'
on conflict do nothing;

-- ============================================================
-- Reglas contextuales
-- Horas en America/Mexico_City, ventana [desde, hasta). desde > hasta cruza la medianoche.
-- Mayor prioridad gana: define géneros y energía; las demás afinan mood y tema.
-- ============================================================
insert into public.context_rules
  (name, priority, hour_from, hour_to, temp_min, temp_max, event_type, allowed_genres, energy_min, energy_max, moods, themes)
select v.* from (values
  ('Mañana (energía moderada)',   20,   6, 12, null::numeric, null::numeric, null::text, null::text[], 2, 3, null::text[], null::text[]),
  ('Mediodía (dinámica)',         20,  12, 16, null, null, null, null, 3, 5, null, null),
  ('Tarde y noche (relajada)',    20,  16,  6, null, null, null, null, 2, 4, null, null),
  ('Calor (moods frescos)',       30, null::int, null::int, 30, null, null, null, null::int, null::int, array['fresco','alegre'], null),
  ('Frío (moods acogedores)',     30, null, null, null, 18, null, null, null, null, array['acogedor','romantico','calmado'], null),
  ('Festividad (temática)',       90, null, null, null, null, 'festividad', null, null, null, null, array['navidad']),
  ('Exámenes (instrumental)',    100, null, null, null, null, 'examenes', array['instrumental'], 1, 2, null, null)
) as v(name, priority, hour_from, hour_to, temp_min, temp_max, event_type, allowed_genres, energy_min, energy_max, moods, themes)
where not exists (select 1 from public.context_rules r where r.name = v.name);

-- ============================================================
-- Eventos de ejemplo (edítalos desde /admin)
-- ============================================================
insert into public.events (name, type, starts_at, ends_at, theme)
select v.* from (values
  ('Posadas y Navidad', 'festividad', '2026-12-01 06:00:00-06'::timestamptz, '2026-12-26 00:00:00-06'::timestamptz, 'navidad'),
  ('Exámenes parciales', 'examenes',  '2026-11-23 06:00:00-06'::timestamptz, '2026-11-28 22:00:00-06'::timestamptz, null)
) as v(name, type, starts_at, ends_at, theme)
where not exists (select 1 from public.events e where e.name = v.name);

-- ============================================================
-- Ajustes (fila única). Tampico, Tamaulipas.
-- no_repeat_minutes = 20: con un catálogo de ~40 canciones, 60 min dejaría sin opciones.
-- max_play_sec = 0 (canción completa). Para la demo, ponlo en 90 desde /admin.
-- ============================================================
update public.settings
set lat = 22.2331, lon = -97.8611,
    round_duration_sec = 30, max_play_sec = 0,
    tie_rule = 'aleatorio', no_votes_rule = 'aleatorio',
    no_repeat_minutes = 20, paused = false, context_override = null
where id = 1;

-- ============================================================
-- Anuncio de ejemplo: SIN aprobar, no suena hasta que lo apruebes en /admin.
-- ============================================================
insert into public.announcements (text, approved, active, every_n_songs)
select 'Bienvenidos a Radio Campus. Vota por la siguiente canción escaneando el código QR de la pantalla.', false, true, 3
where not exists (select 1 from public.announcements where text like 'Bienvenidos a Radio Campus%');
