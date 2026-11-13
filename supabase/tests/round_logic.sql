-- Prueba de lógica (Fase 2): votos, cierre, empates, sin votos, algoritmo contextual,
-- respaldo, tiempos de ronda, anuncios, historial y permisos.
--
-- Cómo correrla: pegar TODO el archivo en el SQL Editor de Supabase.
-- · Crea fixtures TEST_* y los borra al terminar. Desactiva temporalmente canciones, reglas,
--   playlist de respaldo y anuncios REALES para que no interfieran, y los restaura.
-- · now() es constante dentro de una transacción, así que las rondas "vencen" moviendo ends_at.
-- · Requiere que no haya una ronda abierta real (si la hay, aborta con un mensaje).
-- Resultado esperado: la primera fila (RESUMEN) con ok = true y "0 fallos".

create temp table if not exists test_results (n serial, test text, ok boolean, detail text);
truncate test_results restart identity;

create or replace function pg_temp.chk(p_test text, p_ok boolean, p_detail text default '')
returns void language sql as $$
  insert into test_results (test, ok, detail) values (p_test, coalesce(p_ok, false), p_detail);
$$;

create or replace function pg_temp.clear_rounds()
returns void language sql as $$
  delete from public.rounds r
  where exists (select 1 from public.songs sg where sg.id = r.option_a and sg.youtube_id like 'TEST\_%');
$$;

-- Ronda directa: vencida (expired) o abierta por 10 minutos.
create or replace function pg_temp.mk_round(p_a uuid, p_b uuid, p_expired boolean)
returns uuid language plpgsql as $$
declare v uuid;
begin
  perform pg_temp.clear_rounds();
  if p_expired then
    insert into public.rounds (option_a, option_b, starts_at, ends_at)
    values (p_a, p_b, now() - interval '2 minutes', now() - interval '1 second') returning id into v;
  else
    insert into public.rounds (option_a, option_b, starts_at, ends_at)
    values (p_a, p_b, now(), now() + interval '10 minutes') returning id into v;
  end if;
  return v;
end;
$$;

create or replace function pg_temp.as_user(p_uid uuid, p_anon boolean default true)
returns void language sql as $$
  select set_config('request.jwt.claims',
    -- OJO: format('%s', boolean) da 't'/'f' (JSON inválido); por eso el cast a text.
    format('{"sub":"%s","role":"authenticated","is_anonymous":%s}', p_uid, p_anon::text), true);
$$;

create or replace function pg_temp.round_logic_test()
returns void
language plpgsql
as $$
declare
  orig_s jsonb; orig_ps jsonb;
  saved_songs uuid[]; saved_rules uuid[]; saved_fb uuid[]; saved_ann uuid[];
  adm uuid := gen_random_uuid();
  nonadm uuid := gen_random_uuid();
  u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid();
  u3 uuid := gen_random_uuid(); u4 uuid := gen_random_uuid();
  i1 uuid; i2 uuid; i3 uuid; p1 uuid; p2 uuid; p3 uuid; r1 uuid; r2 uuid;
  n1 uuid; n2 uuid; f1 uuid; f2 uuid; fbpl uuid; ann uuid;
  rd public.rounds; rd2 public.rounds; rid uuid;
  snap jsonb; vr jsonb; k int; kk int; expected timestamptz;
  stp text;  -- último paso ejecutado, para reportarlo si hay un error inesperado
  ctx text;
begin
  if exists (select 1 from public.rounds where status = 'open') then
    raise exception 'Hay una ronda abierta real; ciérrala antes de correr esta prueba';
  end if;

  -- ---------- guardar y apartar datos reales ----------
  select to_jsonb(s) into orig_s from public.settings s where s.id = 1;
  select to_jsonb(p) into orig_ps from public.playback_state p where p.id = 1;
  select coalesce(array_agg(id), '{}') into saved_songs from public.songs where active;
  select coalesce(array_agg(id), '{}') into saved_rules from public.context_rules where active;
  select coalesce(array_agg(id), '{}') into saved_fb from public.playlists where is_fallback;
  select coalesce(array_agg(id), '{}') into saved_ann from public.announcements where active;
  update public.songs set active = false where active;
  update public.context_rules set active = false where active;
  update public.playlists set is_fallback = false where is_fallback;
  update public.announcements set active = false where active;

  -- ---------- fixtures ----------
  insert into auth.users (id, email) values (adm, 'logic-test-admin@example.invalid');
  insert into public.admins (user_id) values (adm);

  insert into public.songs (youtube_id,title,artist,duration_sec,genre,energy,mood) values ('TEST_i1','I1','AI1',200,'instrumental',1,'calmado') returning id into i1;
  insert into public.songs (youtube_id,title,artist,duration_sec,genre,energy,mood) values ('TEST_i2','I2','AI2',200,'instrumental',2,'calmado') returning id into i2;
  insert into public.songs (youtube_id,title,artist,duration_sec,genre,energy,mood) values ('TEST_i3','I3','AI3',200,'instrumental',2,'calmado') returning id into i3;
  insert into public.songs (youtube_id,title,artist,duration_sec,genre,energy,mood) values ('TEST_p1','P1','AP1',200,'pop',4,'alegre') returning id into p1;
  insert into public.songs (youtube_id,title,artist,duration_sec,genre,energy,mood) values ('TEST_p2','P2','AP2',200,'pop',4,'alegre') returning id into p2;
  insert into public.songs (youtube_id,title,artist,duration_sec,genre,energy,mood) values ('TEST_p3','P3','AP3',200,'pop',4,'alegre') returning id into p3;
  insert into public.songs (youtube_id,title,artist,duration_sec,genre,energy,mood) values ('TEST_r1','R1','AR1',200,'rock',5,'intenso') returning id into r1;
  insert into public.songs (youtube_id,title,artist,duration_sec,genre,energy,mood) values ('TEST_r2','R2','AR2',200,'rock',5,'intenso') returning id into r2;
  insert into public.songs (youtube_id,title,artist,duration_sec,genre,energy,mood,theme) values ('TEST_n1','N1','AN1',200,'navideña',3,'festivo','navidad') returning id into n1;
  insert into public.songs (youtube_id,title,artist,duration_sec,genre,energy,mood,theme) values ('TEST_n2','N2','AN2',200,'navideña',3,'festivo','navidad') returning id into n2;
  insert into public.songs (youtube_id,title,artist,duration_sec,genre,energy,mood) values ('TEST_f1','F1','AF1',200,'respaldo',3,'neutro') returning id into f1;
  insert into public.songs (youtube_id,title,artist,duration_sec,genre,energy,mood) values ('TEST_f2','F2','AF2',200,'respaldo',3,'neutro') returning id into f2;

  insert into public.playlists (name, is_fallback) values ('TEST_fb', true) returning id into fbpl;
  insert into public.playlist_songs (playlist_id, song_id) values (fbpl, f1), (fbpl, f2);

  insert into public.context_rules (name, priority, event_type, allowed_genres, energy_min, energy_max)
    values ('TEST_examenes', 100, 'examenes', '{instrumental}', 1, 2);
  insert into public.context_rules (name, priority, temp_min, moods)
    values ('TEST_calor', 10, 30, '{alegre}');
  insert into public.context_rules (name, priority, event_type, allowed_genres)
    values ('TEST_vacio', 300, 'evento', '{noexiste}');

  update public.settings set round_duration_sec = 30, max_play_sec = 0, tie_rule = 'aleatorio',
    no_votes_rule = 'aleatorio', no_repeat_minutes = 60, context_override = null, paused = false where id = 1;
  update public.playback_state set current_song_id = null, current_round_id = null,
    started_at = null, phase = 'idle' where id = 1;

  -- =========================================================
  -- A. Algoritmo contextual
  -- =========================================================
  begin
    stp := 'A1 examenes';
    update public.settings set context_override = '{"event_type":"examenes","temp":25,"hour":10}' where id = 1;
    rd := public.start_round(null);
    snap := rd.context_snapshot;
    perform pg_temp.chk('A1 examenes: ambas opciones instrumentales con energía 1-2',
      (select bool_and(sg.genre = 'instrumental' and sg.energy <= 2) from public.songs sg where sg.id in (rd.option_a, rd.option_b)),
      snap::text);
    perform pg_temp.chk('A1 snapshot guarda regla, contexto y no usa respaldo',
      snap -> 'rule_names' @> '"TEST_examenes"'::jsonb and (snap ->> 'used_fallback')::boolean = false
        and (snap ->> 'overridden')::boolean = true and (snap ->> 'hour')::int = 10, snap::text);
    perform pg_temp.chk('A1 las dos opciones son distintas', rd.option_a <> rd.option_b);
    perform pg_temp.clear_rounds();

    update public.settings set context_override = '{"event_type":"ninguno","temp":35,"hour":10}' where id = 1;
    rd := public.start_round(null);
    snap := rd.context_snapshot;
    perform pg_temp.chk('A2 calor: afina por mood (pop alegre) sin regla de géneros',
      (select bool_and(sg.mood = 'alegre') from public.songs sg where sg.id in (rd.option_a, rd.option_b))
        and jsonb_array_length(snap -> 'applied_moods') = 1, snap::text);
    perform pg_temp.clear_rounds();

    update public.settings set context_override = '{"event_type":"examenes","temp":35,"hour":10}' where id = 1;
    rd := public.start_round(null);
    snap := rd.context_snapshot;
    perform pg_temp.chk('A3 prioridad: examenes (100) manda y calor (10) no la contradice',
      (select bool_and(sg.genre = 'instrumental') from public.songs sg where sg.id in (rd.option_a, rd.option_b))
        and snap -> 'rule_names' @> '"TEST_calor"'::jsonb
        and jsonb_array_length(snap -> 'applied_moods') = 0, snap::text);
    perform pg_temp.clear_rounds();

    update public.settings set context_override = '{"event_type":"festividad","theme":"navidad","temp":22,"hour":10}' where id = 1;
    rd := public.start_round(null);
    snap := rd.context_snapshot;
    perform pg_temp.chk('A4 festividad: el tema del evento afina a canciones navideñas',
      rd.option_a in (n1, n2) and rd.option_b in (n1, n2) and jsonb_array_length(snap -> 'applied_themes') >= 1, snap::text);
    perform pg_temp.clear_rounds();

    update public.settings set context_override = '{"event_type":"ninguno"}' where id = 1;
    rd := public.start_round(null);
    snap := rd.context_snapshot;
    perform pg_temp.chk('A5 sin temperatura: usa la playlist de respaldo',
      (snap ->> 'used_fallback')::boolean and snap ->> 'fallback_reason' = 'sin_temperatura'
        and rd.option_a in (f1, f2) and rd.option_b in (f1, f2), snap::text);
    perform pg_temp.clear_rounds();

    update public.settings set context_override = '{"event_type":"evento","temp":25,"hour":10}' where id = 1;
    rd := public.start_round(null);
    snap := rd.context_snapshot;
    perform pg_temp.chk('A6 menos de 2 canciones elegibles: respaldo',
      (snap ->> 'used_fallback')::boolean and snap ->> 'fallback_reason' = 'pocas_canciones'
        and rd.option_a in (f1, f2) and rd.option_b in (f1, f2), snap::text);
    perform pg_temp.clear_rounds();

    update public.settings set context_override = '{"event_type":"examenes","temp":25,"hour":10}' where id = 1;
    insert into public.play_history (song_id) values (i1), (i2);
    rd := public.start_round(null);
    perform pg_temp.chk('A7 no repetir: i1 e i2 recién sonadas dejan solo 1 elegible, respaldo',
      (rd.context_snapshot ->> 'used_fallback')::boolean, rd.context_snapshot::text);
    perform pg_temp.clear_rounds();
    delete from public.play_history where song_id in (i1, i2);
    rd := public.start_round(null);
    perform pg_temp.chk('A7 sin historial reciente vuelve a elegir normal',
      not (rd.context_snapshot ->> 'used_fallback')::boolean, rd.context_snapshot::text);
    rd2 := public.start_round(null);
    perform pg_temp.chk('A8 start_round es idempotente: devuelve la ronda abierta',
      rd.id = rd2.id and (select count(*) from public.rounds where status = 'open') = 1);
    perform pg_temp.clear_rounds();

    update public.settings set context_override = null where id = 1;
    rd := public.start_round(35);
    perform pg_temp.chk('A9 usa la temperatura que le pasa la pantalla (35 °C)',
      (rd.context_snapshot ->> 'temp')::numeric = 35
        and (select bool_and(sg.genre = 'pop') from public.songs sg where sg.id in (rd.option_a, rd.option_b)),
      rd.context_snapshot::text);
    perform pg_temp.clear_rounds();
  exception when others then
    get stacked diagnostics ctx = pg_exception_context;
    perform pg_temp.chk('A (error inesperado)', false,
      'paso=' || coalesce(stp, '?') || ' | ' || sqlstate || ' ' || sqlerrm || ' | ' || replace(ctx, E'\n', ' / '));
  end;

  -- =========================================================
  -- B. Tiempos de ronda (ends_at lo decide el servidor)
  -- =========================================================
  begin
    stp := 'B1-B3 tiempos de ronda';
    update public.settings set context_override = '{"event_type":"ninguno","temp":25,"hour":10}', max_play_sec = 90, round_duration_sec = 30 where id = 1;
    update public.playback_state set current_song_id = p1, started_at = now() - interval '5 seconds' where id = 1;
    rd := public.start_round(null);
    expected := now() - interval '5 seconds' + interval '80 seconds';
    perform pg_temp.chk('B1 max_play_sec=90: ends_at = inicio + 90 - 10 s',
      abs(extract(epoch from (rd.ends_at - expected))) < 0.01 and (rd.context_snapshot ->> 'play_sec')::int = 90,
      rd.ends_at::text || ' vs ' || expected::text);
    perform pg_temp.clear_rounds();

    update public.settings set max_play_sec = 0 where id = 1;
    rd := public.start_round(null);
    expected := now() - interval '5 seconds' + interval '190 seconds';
    perform pg_temp.chk('B2 max_play_sec=0: usa la duración completa (200 s) - 10 s',
      abs(extract(epoch from (rd.ends_at - expected))) < 0.01, rd.ends_at::text || ' vs ' || expected::text);
    perform pg_temp.clear_rounds();

    update public.settings set max_play_sec = 30, round_duration_sec = 60 where id = 1;
    rd := public.start_round(null);
    expected := now() + interval '60 seconds';
    perform pg_temp.chk('B3 round_duration_sec funciona como mínimo de la ronda',
      abs(extract(epoch from (rd.ends_at - expected))) < 0.01, rd.ends_at::text || ' vs ' || expected::text);
    perform pg_temp.clear_rounds();
    update public.settings set max_play_sec = 0, round_duration_sec = 30, context_override = null where id = 1;
    update public.playback_state set current_song_id = null, started_at = null where id = 1;
  exception when others then
    get stacked diagnostics ctx = pg_exception_context;
    perform pg_temp.chk('B (error inesperado)', false,
      'paso=' || coalesce(stp, '?') || ' | ' || sqlstate || ' ' || sqlerrm || ' | ' || replace(ctx, E'\n', ' / '));
  end;

  -- =========================================================
  -- C. Votos
  -- =========================================================
  begin
    stp := 'C0 crear ronda abierta con mk_round';
    rid := pg_temp.mk_round(p1, p2, false);

    stp := 'C1-C3 votos de u1 (as_user + cast_vote)';
    perform pg_temp.as_user(u1);
    vr := public.cast_vote(rid, 'a');
    perform pg_temp.chk('C1 primer voto se registra', vr ->> 'status' = 'voted' and vr ->> 'option' = 'a', vr::text);
    vr := public.cast_vote(rid, 'a');
    perform pg_temp.chk('C2 segundo voto del mismo usuario: ya votó', vr ->> 'status' = 'already_voted' and vr ->> 'option' = 'a', vr::text);
    vr := public.cast_vote(rid, 'b');
    perform pg_temp.chk('C3 no puede cambiar su voto', vr ->> 'status' = 'already_voted' and vr ->> 'option' = 'a', vr::text);
    stp := 'C4 votos de u2 y u3';
    perform pg_temp.as_user(u2);
    perform public.cast_vote(rid, 'b');
    perform pg_temp.as_user(u3);
    perform public.cast_vote(rid, 'b');
    select * into rd from public.rounds where id = rid;
    perform pg_temp.chk('C4 contadores en la ronda: 1 a, 2 b',
      rd.votes_a = 1 and rd.votes_b = 2 and (select count(*) from public.votes where round_id = rid) = 3,
      rd.votes_a || '/' || rd.votes_b);

    stp := 'C5 opción inválida';
    begin
      perform public.cast_vote(rid, 'x');
      perform pg_temp.chk('C5 opción inválida lanza error', false, 'no lanzó');
    exception when sqlstate '22023' then
      perform pg_temp.chk('C5 opción inválida lanza error', true);
    end;

    stp := 'C6 sin sesión (claims vacíos)';
    perform set_config('request.jwt.claims', '{}', true);
    begin
      perform public.cast_vote(rid, 'a');
      perform pg_temp.chk('C6 sin sesión lanza error', false, 'no lanzó');
    exception when sqlstate '28000' then
      perform pg_temp.chk('C6 sin sesión lanza error', true);
    end;

    stp := 'C7 ronda inexistente';
    perform pg_temp.as_user(u4);
    vr := public.cast_vote(gen_random_uuid(), 'a');
    perform pg_temp.chk('C7 ronda inexistente', vr ->> 'status' = 'not_found', vr::text);

    stp := 'C8 voto tras vencer la ronda';
    update public.rounds set starts_at = now() - interval '2 minutes', ends_at = now() - interval '1 second' where id = rid;
    vr := public.cast_vote(rid, 'a');
    select count(*) into k from public.votes where round_id = rid;
    perform pg_temp.chk('C8 voto después de ends_at (reloj del servidor): cerrada y no cuenta',
      vr ->> 'status' = 'closed' and k = 3, vr::text || ' votos=' || k);

    -- =========================================================
    -- D. Cierre
    -- =========================================================
    stp := 'D1-D2 close_round de la ronda vencida';
    rd := public.close_round(rid);
    perform pg_temp.chk('D1 cierra al vencer: gana b (2 a 1), resolución votos',
      rd.status = 'closed' and rd.winner_id = p2 and rd.resolution = 'votos' and rd.votes_a = 1 and rd.votes_b = 2,
      rd.status || ' ' || coalesce(rd.resolution, '-'));
    rd2 := public.close_round(rid);
    perform pg_temp.chk('D2 idempotente: segundo cierre devuelve lo mismo',
      rd2.winner_id = rd.winner_id and rd2.resolution = rd.resolution and rd2.votes_b = rd.votes_b);

    stp := 'D3 close_round de ronda aún no vencida';
    rid := pg_temp.mk_round(r1, r2, false);
    rd := public.close_round(rid);
    perform pg_temp.chk('D3 no cierra antes de ends_at', rd.status = 'open' and rd.winner_id is null, rd.status);
  exception when others then
    get stacked diagnostics ctx = pg_exception_context;
    perform pg_temp.chk('C/D (error inesperado)', false,
      'paso=' || coalesce(stp, '?') || ' | ' || sqlstate || ' ' || sqlerrm || ' | ' || replace(ctx, E'\n', ' / '));
  end;

  -- =========================================================
  -- D. Empates y sin votos
  -- =========================================================
  begin
    stp := 'D4-D9 empates, sin votos y cron';
    -- empate: tie_rule opcion_a
    rid := pg_temp.mk_round(p1, p2, true);
    insert into public.votes (round_id, option, voter_id) values (rid, 'a', u1), (rid, 'b', u2);
    update public.settings set tie_rule = 'opcion_a' where id = 1;
    rd := public.close_round(rid);
    perform pg_temp.chk('D4 empate + opcion_a gana a', rd.resolution = 'empate' and rd.winner_id = p1, coalesce(rd.resolution, '-'));

    -- empate: menos_reproducida (p1 sonó 2 veces, p2 ninguna => gana p2)
    rid := pg_temp.mk_round(p1, p2, true);
    insert into public.votes (round_id, option, voter_id) values (rid, 'a', u1), (rid, 'b', u2);
    insert into public.play_history (song_id) values (p1), (p1);
    update public.settings set tie_rule = 'menos_reproducida' where id = 1;
    rd := public.close_round(rid);
    perform pg_temp.chk('D5 empate + menos_reproducida gana la menos sonada', rd.resolution = 'empate' and rd.winner_id = p2, coalesce(rd.resolution, '-'));
    delete from public.play_history where song_id in (p1, p2);

    -- empate: aleatorio
    rid := pg_temp.mk_round(p1, p2, true);
    insert into public.votes (round_id, option, voter_id) values (rid, 'a', u1), (rid, 'b', u2);
    update public.settings set tie_rule = 'aleatorio' where id = 1;
    rd := public.close_round(rid);
    perform pg_temp.chk('D6 empate + aleatorio gana una de las dos', rd.resolution = 'empate' and rd.winner_id in (p1, p2));

    -- sin votos: aleatorio
    rid := pg_temp.mk_round(p1, p2, true);
    update public.settings set no_votes_rule = 'aleatorio' where id = 1;
    rd := public.close_round(rid);
    perform pg_temp.chk('D7 sin votos + aleatorio: gana una de las opciones', rd.resolution = 'sin_votos' and rd.winner_id in (p1, p2));

    -- sin votos: respaldo
    rid := pg_temp.mk_round(p1, p2, true);
    update public.settings set no_votes_rule = 'respaldo' where id = 1;
    rd := public.close_round(rid);
    perform pg_temp.chk('D8 sin votos + respaldo: gana canción de la playlist de respaldo',
      rd.resolution = 'sin_votos' and rd.winner_id in (f1, f2), coalesce(rd.winner_id::text, '-'));
    update public.settings set no_votes_rule = 'aleatorio' where id = 1;

    -- cron: close_expired_rounds cierra vencidas
    rid := pg_temp.mk_round(p1, p2, true);
    k := public.close_expired_rounds();
    select * into rd from public.rounds where id = rid;
    perform pg_temp.chk('D9 close_expired_rounds cierra rondas vencidas (lo que ejecuta pg_cron)', k >= 1 and rd.status = 'closed');
  exception when others then
    get stacked diagnostics ctx = pg_exception_context;
    perform pg_temp.chk('D empates (error inesperado)', false,
      'paso=' || coalesce(stp, '?') || ' | ' || sqlstate || ' ' || sqlerrm || ' | ' || replace(ctx, E'\n', ' / '));
  end;

  -- =========================================================
  -- E. Forzar cierre (solo admin)
  -- =========================================================
  begin
    stp := 'E1 no admin intenta forzar el cierre';
    rid := pg_temp.mk_round(p1, p2, false);
    perform pg_temp.as_user(nonadm, false);
    begin
      perform public.admin_force_close_round(rid);
      perform pg_temp.chk('E1 no admin no puede forzar el cierre', false, 'no lanzó');
    exception when sqlstate '42501' then
      perform pg_temp.chk('E1 no admin no puede forzar el cierre', true);
    end;
    stp := 'E2 anónimo listado en admins intenta forzar el cierre';
    perform pg_temp.as_user(adm, true);
    begin
      perform public.admin_force_close_round(rid);
      perform pg_temp.chk('E2 un anónimo aunque esté en admins tampoco', false, 'no lanzó');
    exception when sqlstate '42501' then
      perform pg_temp.chk('E2 un anónimo aunque esté en admins tampoco', true);
    end;
    stp := 'E3 admin real fuerza el cierre';
    perform pg_temp.as_user(adm, false);
    rd := public.admin_force_close_round(rid);
    perform pg_temp.chk('E3 admin real fuerza el cierre antes de ends_at', rd.status = 'closed' and rd.resolution = 'sin_votos');
  exception when others then
    get stacked diagnostics ctx = pg_exception_context;
    perform pg_temp.chk('E (error inesperado)', false,
      'paso=' || coalesce(stp, '?') || ' | ' || sqlstate || ' ' || sqlerrm || ' | ' || replace(ctx, E'\n', ' / '));
  end;

  -- =========================================================
  -- F. Anuncios
  -- =========================================================
  begin
    stp := 'F anuncios';
    delete from public.play_history where song_id in (select id from public.songs where youtube_id like 'TEST\_%');
    update public.settings set context_override = '{"hour":10,"temp":25,"event_type":"ninguno"}' where id = 1;
    insert into public.announcements (text, approved, active, every_n_songs, last_played_at)
      values ('TEST_ann', true, true, 2, now() - interval '1 hour') returning id into ann;

    insert into public.play_history (song_id) values (p1);
    select count(*) into k from public.next_announcement();
    perform pg_temp.chk('F1 frecuencia: con 1 de 2 canciones aún no toca', k = 0);
    insert into public.play_history (song_id) values (p2);
    select count(*) into k from public.next_announcement();
    perform pg_temp.chk('F2 frecuencia cumplida: toca', k = 1);

    update public.announcements set hour_from = 20, hour_to = 22 where id = ann;
    select count(*) into k from public.next_announcement();
    perform pg_temp.chk('F3 fuera de horario (10h vs 20-22): no toca', k = 0);
    update public.announcements set hour_from = 8, hour_to = 12 where id = ann;
    select count(*) into k from public.next_announcement();
    perform pg_temp.chk('F4 dentro de horario (10h vs 8-12): toca', k = 1);

    update public.announcements set approved = false where id = ann;
    select count(*) into k from public.next_announcement();
    perform pg_temp.chk('F5 sin aprobar: no toca', k = 0);
    update public.announcements set approved = true, ends_at = now() - interval '1 minute' where id = ann;
    select count(*) into k from public.next_announcement();
    perform pg_temp.chk('F6 vigencia vencida: no toca', k = 0);
    update public.announcements set ends_at = null where id = ann;

    perform public.mark_announcement_played(ann);
    select count(*) into k from public.next_announcement();
    perform pg_temp.chk('F7 tras reproducirse reinicia la cuenta de frecuencia', k = 0);
  exception when others then
    get stacked diagnostics ctx = pg_exception_context;
    perform pg_temp.chk('F (error inesperado)', false,
      'paso=' || coalesce(stp, '?') || ' | ' || sqlstate || ' ' || sqlerrm || ' | ' || replace(ctx, E'\n', ' / '));
  end;

  -- =========================================================
  -- G. Historial y estado
  -- =========================================================
  begin
    stp := 'G record_play / set_phase';
    perform public.record_play(p1, null, 'ok', null);
    perform pg_temp.chk('G1 record_play ok: fija canción actual y fase playing',
      (select current_song_id from public.playback_state where id = 1) = p1
        and (select phase from public.playback_state where id = 1) = 'playing'
        and (select started_at from public.playback_state where id = 1) is not null);
    perform public.record_play(p2, null, 'error', 'video no disponible');
    perform pg_temp.chk('G2 record_play error: queda registrado y fase error',
      (select phase from public.playback_state where id = 1) = 'error'
        and exists (select 1 from public.play_history where song_id = p2 and status = 'error' and note = 'video no disponible'));
    perform public.set_phase('result');
    perform pg_temp.chk('G3 set_phase', (select phase from public.playback_state where id = 1) = 'result');
    begin
      perform public.set_phase('inventada');
      perform pg_temp.chk('G4 fase inválida rechazada', false, 'no lanzó');
    exception when check_violation then
      perform pg_temp.chk('G4 fase inválida rechazada', true);
    end;
    perform pg_temp.chk('G5 server_now devuelve la hora del servidor', public.server_now() is not null);
  exception when others then
    get stacked diagnostics ctx = pg_exception_context;
    perform pg_temp.chk('G (error inesperado)', false,
      'paso=' || coalesce(stp, '?') || ' | ' || sqlstate || ' ' || sqlerrm || ' | ' || replace(ctx, E'\n', ' / '));
  end;

  -- =========================================================
  -- H. Permisos y cron
  -- =========================================================
  perform pg_temp.chk('H1 anon no puede ejecutar start_round ni cast_vote',
    not has_function_privilege('anon', 'public.start_round(numeric)', 'execute')
      and not has_function_privilege('anon', 'public.cast_vote(uuid,text)', 'execute'));
  perform pg_temp.chk('H2 authenticated sí puede ejecutar la API pública',
    has_function_privilege('authenticated', 'public.start_round(numeric)', 'execute')
      and has_function_privilege('authenticated', 'public.cast_vote(uuid,text)', 'execute')
      and has_function_privilege('authenticated', 'public.close_round(uuid)', 'execute'));
  perform pg_temp.chk('H3 helpers internos no son ejecutables desde la API',
    not has_function_privilege('authenticated', 'public._contextual_pick(jsonb)', 'execute')
      and not has_function_privilege('authenticated', 'public._close_round(uuid,boolean)', 'execute')
      and not has_function_privilege('authenticated', 'public.close_expired_rounds()', 'execute'));
  perform pg_temp.chk('H4 pg_cron programado cada minuto',
    exists (select 1 from cron.job where jobname = 'close-expired-rounds' and schedule = '* * * * *' and active));

  -- ---------- limpieza y restauración ----------
  perform pg_temp.clear_rounds();
  delete from public.rounds where option_a in (select id from public.songs where youtube_id like 'TEST\_%');
  delete from public.play_history where song_id in (select id from public.songs where youtube_id like 'TEST\_%');
  delete from public.songs where youtube_id like 'TEST\_%';
  delete from public.playlists where name like 'TEST\_%';
  delete from public.context_rules where name like 'TEST\_%';
  delete from public.announcements where text like 'TEST\_%';
  delete from auth.users where id = adm;

  update public.songs set active = true where id = any(saved_songs);
  update public.context_rules set active = true where id = any(saved_rules);
  update public.playlists set is_fallback = true where id = any(saved_fb);
  update public.announcements set active = true where id = any(saved_ann);
  update public.settings set
    round_duration_sec = (orig_s ->> 'round_duration_sec')::int,
    max_play_sec = (orig_s ->> 'max_play_sec')::int,
    tie_rule = orig_s ->> 'tie_rule',
    no_votes_rule = orig_s ->> 'no_votes_rule',
    no_repeat_minutes = (orig_s ->> 'no_repeat_minutes')::int,
    paused = (orig_s ->> 'paused')::boolean,
    context_override = nullif(orig_s -> 'context_override', 'null'::jsonb),
    skip_requested_at = (orig_s ->> 'skip_requested_at')::timestamptz
  where id = 1;
  update public.playback_state set
    current_song_id = (orig_ps ->> 'current_song_id')::uuid,
    current_round_id = (orig_ps ->> 'current_round_id')::uuid,
    phase = orig_ps ->> 'phase',
    started_at = (orig_ps ->> 'started_at')::timestamptz
  where id = 1;
end;
$$;

select pg_temp.round_logic_test();

select 0 as n, 'RESUMEN' as test, count(*) filter (where not ok) = 0 as ok,
  format('%s checks, %s fallos', count(*), count(*) filter (where not ok)) as detail
from test_results
union all
select n, test, ok, detail from test_results
order by n;
