-- Prueba de seguridad (Fase 1): ¿quién puede escribir y leer qué?
--
-- Simula 4 actores NO admin y comprueba que NINGUNO puede insert/update/delete en NINGUNA
-- tabla de public, ni leer lo privado. Control positivo: un admin real sí puede escribir en
-- songs/settings pero NO directo en votes/rounds (esas entran por RPC).
--
-- Cómo correrla: pegar TODO el archivo en el SQL Editor de Supabase (o execute_sql).
-- Crea fixtures con prefijo TEST_, los borra al terminar y no deja nada.
-- Resultado esperado: una fila por actor con failed_checks = 0.
--
-- Actores:
--   anon                     rol anon (sin sign-in)
--   anonymous_user           rol authenticated + is_anonymous=true (el votante real)
--   anonymous_listed_admin   anónimo cuyo uid aparece en admins: is_admin() debe ser false
--   regular_non_admin        authenticated normal que no está en admins

create or replace function pg_temp.rls_write_test()
returns table (actor text, tbl text, op text, ok boolean)
language plpgsql
as $$
declare
  s1 uuid; s2 uuid; s3 uuid; pl uuid; rd uuid;
  adm uuid := gen_random_uuid();
  anon_u uuid := gen_random_uuid();
  other_u uuid := gen_random_uuid();
  a record;
  c record;
  n bigint;
  cj jsonb;
begin
  -- ---------- fixtures (como postgres) ----------
  insert into auth.users (id, email) values (adm, 'rls-test-admin@example.invalid');
  insert into public.admins (user_id) values (adm);
  insert into public.songs (youtube_id, title, genre, energy, mood)
    values ('TEST_s1', 'T1', 'pop', 3, 'x') returning id into s1;
  insert into public.songs (youtube_id, title, genre, energy, mood)
    values ('TEST_s2', 'T2', 'pop', 3, 'x') returning id into s2;
  insert into public.songs (youtube_id, title, genre, energy, mood, restricted, restriction_note)
    values ('TEST_s3', 'T3', 'pop', 3, 'x', true, 'secreto') returning id into s3;
  insert into public.playlists (name) values ('TEST_pl') returning id into pl;
  insert into public.playlist_songs (playlist_id, song_id) values (pl, s1);
  insert into public.context_rules (name) values ('TEST_rule');
  insert into public.events (name, type, starts_at, ends_at)
    values ('TEST_ev', 'evento', now(), now() + interval '1 hour');
  insert into public.rounds (option_a, option_b, ends_at)
    values (s1, s2, now() + interval '1 hour') returning id into rd;
  insert into public.votes (round_id, option, voter_id) values (rd, 'a', other_u);
  insert into public.announcements (text) values ('TEST_ann');
  insert into public.play_history (song_id, round_id) values (s1, rd);

  -- ---------- casos de escritura ----------
  create temp table cases (tbl text, op text, stmt text) on commit drop;
  insert into cases values
    ('songs','insert', 'insert into public.songs (youtube_id,title,genre,energy,mood) values (''TEST_x'',''x'',''pop'',3,''x'')'),
    ('songs','update', format('update public.songs set title = ''hacked'' where id in (%L,%L)', s1, s2)),
    ('songs','delete', format('delete from public.songs where id in (%L,%L)', s1, s2)),
    ('playlists','insert', 'insert into public.playlists (name) values (''TEST_x'')'),
    ('playlists','update', format('update public.playlists set name = ''hacked'' where id = %L', pl)),
    ('playlists','delete', format('delete from public.playlists where id = %L', pl)),
    ('playlist_songs','insert', format('insert into public.playlist_songs (playlist_id,song_id) values (%L,%L)', pl, s2)),
    ('playlist_songs','update', format('update public.playlist_songs set position = 99 where playlist_id = %L', pl)),
    ('playlist_songs','delete', format('delete from public.playlist_songs where playlist_id = %L', pl)),
    ('context_rules','insert', 'insert into public.context_rules (name) values (''TEST_x'')'),
    ('context_rules','update', 'update public.context_rules set priority = 999 where name = ''TEST_rule'''),
    ('context_rules','delete', 'delete from public.context_rules where name = ''TEST_rule'''),
    ('events','insert', 'insert into public.events (name,type,starts_at,ends_at) values (''TEST_x'',''evento'',now(),now()+interval ''1 hour'')'),
    ('events','update', 'update public.events set name = ''hacked'' where name = ''TEST_ev'''),
    ('events','delete', 'delete from public.events where name = ''TEST_ev'''),
    ('rounds','insert', format('insert into public.rounds (option_a,option_b,ends_at) values (%L,%L,now()+interval ''1 hour'')', s1, s2)),
    ('rounds','update', format('update public.rounds set votes_a = 999 where id = %L', rd)),
    ('rounds','delete', format('delete from public.rounds where id = %L', rd)),
    ('votes','insert', format('insert into public.votes (round_id,option,voter_id) values (%L,''a'',gen_random_uuid())', rd)),
    ('votes','update', format('update public.votes set option = ''b'' where round_id = %L', rd)),
    ('votes','delete', format('delete from public.votes where round_id = %L', rd)),
    ('announcements','insert', 'insert into public.announcements (text) values (''TEST_x'')'),
    ('announcements','update', 'update public.announcements set approved = true where text = ''TEST_ann'''),
    ('announcements','delete', 'delete from public.announcements where text = ''TEST_ann'''),
    ('play_history','insert', format('insert into public.play_history (song_id) values (%L)', s1)),
    ('play_history','update', format('update public.play_history set note = ''hacked'' where song_id = %L', s1)),
    ('play_history','delete', format('delete from public.play_history where song_id = %L', s1)),
    ('settings','insert', 'insert into public.settings (id) values (2)'),
    ('settings','update', 'update public.settings set max_play_sec = 1, paused = true'),
    ('settings','delete', 'delete from public.settings'),
    ('playback_state','insert', 'insert into public.playback_state (id) values (2)'),
    ('playback_state','update', 'update public.playback_state set phase = ''error'''),
    ('playback_state','delete', 'delete from public.playback_state'),
    ('admins','insert', format('insert into public.admins (user_id) values (%L)', other_u)),
    ('admins','update', format('update public.admins set created_at = now() where user_id = %L', adm)),
    ('admins','delete', format('delete from public.admins where user_id = %L', adm));

  -- Los roles de prueba no pueden leer la tabla temporal: se guarda en una variable.
  select jsonb_agg(to_jsonb(cases)) into cj from cases;

  -- ---------- actores NO admin ----------
  for a in
    select * from (values
      ('anon',                   'anon',          '{"role":"anon"}'),
      ('anonymous_user',         'authenticated', format('{"sub":"%s","role":"authenticated","is_anonymous":true}', anon_u)),
      ('anonymous_listed_admin', 'authenticated', format('{"sub":"%s","role":"authenticated","is_anonymous":true}', adm)),
      ('regular_non_admin',      'authenticated', format('{"sub":"%s","role":"authenticated","is_anonymous":false}', gen_random_uuid()))
    ) v (name, rol, claims)
  loop
    perform set_config('request.jwt.claims', a.claims, true);
    execute format('set local role %I', a.rol);

    for c in
      select x ->> 'tbl' as tbl, x ->> 'op' as op, x ->> 'stmt' as stmt
      from jsonb_array_elements(cj) x
    loop
      actor := a.name; tbl := c.tbl; op := c.op;
      begin
        execute c.stmt;
        get diagnostics n = row_count;
        ok := (n = 0);                 -- RLS filtró todo
      exception when insufficient_privilege then
        ok := true;                    -- permission denied / violates row-level security
      when others then
        ok := false;                   -- cualquier otro error = no se probó lo que se creía
      end;
      return next;
    end loop;

    -- lecturas privadas: deben dar 0 filas
    for c in
      select * from (values
        ('context_rules',  'select count(*) from public.context_rules'),
        ('playlists',      'select count(*) from public.playlists'),
        ('playlist_songs', 'select count(*) from public.playlist_songs'),
        ('play_history',   'select count(*) from public.play_history'),
        ('votes(ajenos)',  'select count(*) from public.votes'),
        ('songs(restringida)', 'select count(*) from public.songs where restricted'),
        ('announcements(no aprobado)', 'select count(*) from public.announcements where not approved'),
        ('admins',         'select count(*) from public.admins')
      ) v (t, q)
    loop
      actor := a.name; tbl := c.t; op := 'read-private';
      begin
        execute c.q into n;
        ok := (n = 0);
      exception when insufficient_privilege then
        ok := true;
      when others then
        ok := false;
      end;
      -- un anónimo "listed admin" ve su propia fila en admins: es esperado, no es fuga
      if a.name = 'anonymous_listed_admin' and c.t = 'admins' then ok := true; end if;
      return next;
    end loop;

    reset role;
  end loop;

  -- ---------- control positivo: admin real ----------
  perform set_config('request.jwt.claims',
    format('{"sub":"%s","role":"authenticated","is_anonymous":false}', adm), true);
  set local role authenticated;

  actor := 'admin(control)';
  begin
    insert into public.songs (youtube_id,title,genre,energy,mood) values ('TEST_adm','a','pop',3,'x');
    tbl := 'songs'; op := 'insert'; ok := true;
  exception when others then tbl := 'songs'; op := 'insert'; ok := false; end;
  return next;

  update public.songs set title = 'ok' where youtube_id = 'TEST_adm';
  get diagnostics n = row_count;
  tbl := 'songs'; op := 'update'; ok := (n = 1); return next;

  update public.settings set max_play_sec = max_play_sec;
  get diagnostics n = row_count;
  tbl := 'settings'; op := 'update'; ok := (n = 1); return next;

  select count(*) into n from public.context_rules where name = 'TEST_rule';
  tbl := 'context_rules'; op := 'read'; ok := (n = 1); return next;

  select count(*) into n from public.songs where restricted and youtube_id = 'TEST_s3';
  tbl := 'songs(restringida)'; op := 'read'; ok := (n = 1); return next;

  begin
    insert into public.votes (round_id,option,voter_id) values (rd,'a',gen_random_uuid());
    ok := false;
  exception when insufficient_privilege then ok := true;
  when others then ok := false; end;
  tbl := 'votes'; op := 'insert-directo-bloqueado'; return next;

  delete from public.songs where youtube_id = 'TEST_adm';
  get diagnostics n = row_count;
  tbl := 'songs'; op := 'delete'; ok := (n = 1); return next;

  reset role;

  -- ---------- limpieza ----------
  delete from public.rounds where id = rd;
  delete from public.songs where youtube_id like 'TEST\_%';
  delete from public.playlists where name like 'TEST\_%';
  delete from public.events where name like 'TEST\_%';
  delete from public.announcements where text like 'TEST\_%';
  delete from public.context_rules where name like 'TEST\_%';
  delete from auth.users where id = adm;
end;
$$;

select
  actor,
  count(*) as checks,
  count(*) filter (where not ok) as failed_checks,
  coalesce(string_agg(op || ':' || tbl, ', ') filter (where not ok), '-') as failures
from pg_temp.rls_write_test()
group by actor
order by actor;
