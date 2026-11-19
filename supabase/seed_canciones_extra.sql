-- Canciones extra para Radio Campus (21). Córrelo a mano en el SQL Editor de Supabase.
-- Es idempotente: no duplica por youtube_id ni por título + artista.
-- Cada youtube_id se verificó el 2026-11-19 con https://www.youtube.com/oembed (HTTP 200 = permite embed),
-- y duration_sec es el lengthSeconds real del video.
-- Géneros: los ya usados (pop, rock, electronica, instrumental, regional mexicano, navideña) + 'reggaeton' (nuevo).
-- Reguetón: se quitaron 'Gasolina' y 'Tití Me Preguntó' (letras explícitas, es un campus). Mi Gente y DÁKITI son las más suaves, pero no se pudo
-- verificar que sean versión radio: si alguna no te convence, márcala como 'Restringida' en /admin.
-- Ojo: los 3 instrumentales y 'Burl Ives' están subidos por canales no oficiales (el video sí permite embed).

insert into public.songs (youtube_id, title, artist, duration_sec, genre, energy, mood, theme)
select v.* from (values
  ('DUT5rEU6pqM', 'Hips Don''t Lie', 'Shakira ft. Wyclef Jean', 218, 'pop', 4, 'alegre', null::text),
  ('6Mgqbai3fKo', 'Chantaje', 'Shakira ft. Maluma', 199, 'pop', 4, 'alegre', null),
  ('2Vv-BfVoq4g', 'Perfect', 'Ed Sheeran', 282, 'pop', 2, 'romantico', null),
  ('rYEDA3JcQqw', 'Rolling in the Deep', 'Adele', 234, 'pop', 4, 'intenso', null),
  ('4NRXx6U8ABQ', 'Blinding Lights', 'The Weeknd', 263, 'pop', 4, 'energico', null),
  ('wnJ6LuUFpMo', 'Mi Gente', 'J Balvin, Willy William', 186, 'reggaeton', 5, 'alegre', null),
  ('TmKh7lAwnBI', 'DÁKITI', 'Bad Bunny, Jhay Cortez', 214, 'reggaeton', 3, 'fresco', null),
  ('dvgZkm1xWPE', 'Viva La Vida', 'Coldplay', 242, 'rock', 4, 'intenso', null),
  ('HgzGwKwLmgM', 'Don''t Stop Me Now', 'Queen', 215, 'rock', 5, 'alegre', null),
  ('T_FkEw27XJ0', 'De Música Ligera', 'Soda Stereo', 210, 'rock', 4, 'alegre', null),
  ('98Akpf1ph2o', 'Eres', 'Café Tacvba', 264, 'rock', 2, 'romantico', null),
  ('ETLoTxVVvjM', 'Adiós Amor', 'Christian Nodal', 202, 'regional mexicano', 3, 'melancolico', null),
  ('kcKOd_wy0XI', '17 Años', 'Los Ángeles Azules ft. Jay De La Cueva', 301, 'regional mexicano', 4, 'alegre', null),
  ('gCYcHz2k5x0', 'Animals', 'Martin Garrix', 192, 'electronica', 5, 'energico', null),
  ('1y6smkh6c-0', 'Don''t You Worry Child', 'Swedish House Mafia ft. John Martin', 335, 'electronica', 4, 'alegre', null),
  ('oy2zDJPIgwc', 'Eine Kleine Nachtmusik', 'Wolfgang Amadeus Mozart', 348, 'instrumental', 2, 'calmado', null),
  ('NvryolGa19A', 'Comptine d''un autre été', 'Yann Tiersen', 146, 'instrumental', 1, 'calmado', null),
  ('j1Ck42-_btY', 'Una Mattina', 'Ludovico Einaudi', 403, 'instrumental', 1, 'calmado', null),
  ('e_AMTbO50vU', 'A Holly Jolly Christmas', 'Burl Ives', 143, 'navideña', 3, 'festivo', 'navidad'),
  ('R8CBoVc_OMI', 'Santa Claus Is Coming To Town', 'Michael Bublé', 172, 'navideña', 3, 'festivo', 'navidad'),
  ('AN_R4pR1hck', 'It''s the Most Wonderful Time of the Year', 'Andy Williams', 154, 'navideña', 2, 'festivo', 'navidad')
) as v(youtube_id, title, artist, duration_sec, genre, energy, mood, theme)
where not exists (
  select 1 from public.songs s
  where s.youtube_id = v.youtube_id
     or (lower(s.title) = lower(v.title) and lower(s.artist) = lower(v.artist))
);

select count(*) as total_canciones from public.songs;  -- esperado: 39 + 21 = 60
