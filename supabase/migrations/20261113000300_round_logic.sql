-- Fase 2 · Lógica de rondas en el servidor
-- El cliente NUNCA decide tiempos: todo usa now() del servidor.
-- Las funciones públicas son SECURITY DEFINER y solo ejecutables por "authenticated"
-- (la pantalla y los votantes inician sesión anónima). Los helpers internos (prefijo _)
-- no son ejecutables por nadie desde la API.

-- ============================================================
-- Helpers internos
-- ============================================================

-- Ventana de horas [from, to) en horas 0-23. from > to cruza la medianoche.
-- Nulos o from = to significa "sin restricción".
create or replace function public._hour_in_window(h int, f int, t int)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when f is null or t is null or f = t then true
    when f < t then h >= f and h < t
    else h >= f or h < t
  end;
$$;

-- Contexto: hora local, temperatura y evento. settings.context_override tiene prioridad.
-- Override admite: hour (0-23), temp, event_type ('festividad'|'examenes'|'evento'|'ninguno'), theme.
create or replace function public._build_context(p_temp numeric default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.settings;
  ov jsonb;
  ev record;
  v_hour int;
  v_temp numeric := p_temp;
  v_event text;
  v_theme text;
  v_ename text;
  v_over boolean := false;
begin
  select * into s from public.settings where id = 1;
  ov := coalesce(s.context_override, '{}'::jsonb);
  v_hour := extract(hour from (now() at time zone 'America/Mexico_City'))::int;

  select e.type, e.theme, e.name into ev
  from public.events e
  where now() >= e.starts_at and now() < e.ends_at
  order by e.starts_at desc
  limit 1;
  v_event := ev.type;
  v_theme := ev.theme;
  v_ename := ev.name;

  if ov ->> 'hour' is not null then
    v_hour := (ov ->> 'hour')::int; v_over := true;
  end if;
  if ov ->> 'temp' is not null then
    v_temp := (ov ->> 'temp')::numeric; v_over := true;
  end if;
  if ov ->> 'event_type' is not null then
    v_over := true;
    if ov ->> 'event_type' = 'ninguno' then
      v_event := null; v_theme := null; v_ename := null;
    else
      v_event := ov ->> 'event_type';
      v_theme := ov ->> 'theme';
      v_ename := 'simulado';
    end if;
  end if;

  return jsonb_build_object(
    'hour', v_hour,
    'temp', v_temp,
    'event_type', v_event,
    'event_theme', v_theme,
    'event_name', v_ename,
    'overridden', v_over,
    'tz', 'America/Mexico_City'
  );
end;
$$;

-- Elige 2 canciones con el algoritmo contextual. Devuelve {a, b, ...info para el snapshot}.
create or replace function public._contextual_pick(p_ctx jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.settings;
  ps public.playback_state;
  v_hour int := (p_ctx ->> 'hour')::int;
  v_temp numeric := (p_ctx ->> 'temp')::numeric;
  v_event text := p_ctx ->> 'event_type';
  v_theme text := p_ctx ->> 'event_theme';
  r record;
  rule_names text[] := '{}';
  genres text[];
  emin int;
  emax int;
  mood_lists jsonb := '[]'::jsonb;
  theme_lists jsonb := '[]'::jsonb;
  applied_moods jsonb := '[]'::jsonb;
  applied_themes jsonb := '[]'::jsonb;
  pool uuid[] := '{}';
  narrowed uuid[];
  lst jsonb;
  a_id uuid;
  b_id uuid;
  a_artist text;
  reason text;
  fb uuid[];
begin
  select * into s from public.settings where id = 1;
  select * into ps from public.playback_state where id = 1;

  -- 2. Reglas activas que cumplen condiciones, por prioridad (mayor gana).
  for r in
    select * from public.context_rules cr
    where cr.active
      and public._hour_in_window(v_hour, cr.hour_from::int, cr.hour_to::int)
      and (cr.temp_min is null or (v_temp is not null and v_temp >= cr.temp_min))
      and (cr.temp_max is null or (v_temp is not null and v_temp <= cr.temp_max))
      and (cr.event_type is null or cr.event_type = v_event)
    order by cr.priority desc, cr.created_at, cr.id
  loop
    rule_names := rule_names || r.name;
    -- géneros y energía: los define la regla de mayor prioridad que los especifique
    if genres is null and coalesce(cardinality(r.allowed_genres), 0) > 0 then genres := r.allowed_genres; end if;
    if emin is null and r.energy_min is not null then emin := r.energy_min; end if;
    if emax is null and r.energy_max is not null then emax := r.energy_max; end if;
    -- mood y tema: afinan, en orden de prioridad
    if coalesce(cardinality(r.moods), 0) > 0 then mood_lists := mood_lists || jsonb_build_array(to_jsonb(r.moods)); end if;
    if coalesce(cardinality(r.themes), 0) > 0 then theme_lists := theme_lists || jsonb_build_array(to_jsonb(r.themes)); end if;
  end loop;

  -- el tema del evento activo es el primer afinado de tema
  if v_theme is not null then
    theme_lists := jsonb_build_array(jsonb_build_array(v_theme)) || theme_lists;
  end if;

  -- 4. Sin clima (ni override) => respaldo
  if v_temp is null then
    reason := 'sin_temperatura';
  end if;

  if reason is null then
    -- 3. Filtro duro: activas, no restringidas, no repetidas, géneros y energía de la regla principal
    select coalesce(array_agg(sg.id), '{}') into pool
    from public.songs sg
    where sg.active
      and not sg.restricted
      and sg.id is distinct from ps.current_song_id
      and (genres is null or exists (select 1 from unnest(genres) g where lower(g) = lower(sg.genre)))
      and (emin is null or sg.energy >= emin)
      and (emax is null or sg.energy <= emax)
      and not exists (
        select 1 from public.play_history h
        where h.song_id = sg.id
          and h.played_at > now() - make_interval(mins => s.no_repeat_minutes)
      );

    -- Filtros suaves: solo se aplican si dejan al menos 2 canciones (no contradicen ni vacían).
    for lst in select e from jsonb_array_elements(mood_lists) e loop
      select coalesce(array_agg(sg.id), '{}') into narrowed
      from public.songs sg
      where sg.id = any(pool)
        and lower(sg.mood) in (select lower(x) from jsonb_array_elements_text(lst) x);
      if cardinality(narrowed) >= 2 then
        pool := narrowed;
        applied_moods := applied_moods || jsonb_build_array(lst);
      end if;
    end loop;

    for lst in select e from jsonb_array_elements(theme_lists) e loop
      select coalesce(array_agg(sg.id), '{}') into narrowed
      from public.songs sg
      where sg.id = any(pool)
        and lower(sg.theme) in (select lower(x) from jsonb_array_elements_text(lst) x);
      if cardinality(narrowed) >= 2 then
        pool := narrowed;
        applied_themes := applied_themes || jsonb_build_array(lst);
      end if;
    end loop;

    if cardinality(pool) < 2 then
      reason := 'pocas_canciones';
    else
      select sg.id, sg.artist into a_id, a_artist
      from public.songs sg where sg.id = any(pool)
      order by random() limit 1;
      -- la segunda, de preferencia de otro artista
      select sg.id into b_id
      from public.songs sg
      where sg.id = any(pool) and sg.id <> a_id
      order by (lower(sg.artist) = lower(a_artist)), random()
      limit 1;
    end if;
  end if;

  -- Respaldo
  if reason is not null then
    select coalesce(array_agg(x.id), '{}') into fb
    from (
      select sg.id
      from public.playlist_songs pls
      join public.playlists p on p.id = pls.playlist_id
      join public.songs sg on sg.id = pls.song_id
      where p.is_fallback and sg.active and not sg.restricted
      order by
        (sg.id is not distinct from ps.current_song_id),
        exists (
          select 1 from public.play_history h
          where h.song_id = sg.id
            and h.played_at > now() - make_interval(mins => s.no_repeat_minutes)
        ),
        random()
      limit 2
    ) x;
    if cardinality(fb) < 2 then
      raise exception 'sin_canciones: la playlist de respaldo necesita al menos 2 canciones activas'
        using errcode = 'P0001';
    end if;
    a_id := fb[1];
    b_id := fb[2];
  end if;

  return jsonb_build_object(
    'a', a_id,
    'b', b_id,
    'rule_names', to_jsonb(rule_names),
    'used_fallback', reason is not null,
    'fallback_reason', reason,
    'pool_size', cardinality(pool),
    'genres', to_jsonb(genres),
    'energy_min', emin,
    'energy_max', emax,
    'applied_moods', applied_moods,
    'applied_themes', applied_themes
  );
end;
$$;

-- Cierre común. p_force = true ignora ends_at (solo lo usa admin_force_close_round).
create or replace function public._close_round(p_round_id uuid, p_force boolean)
returns public.rounds
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rounds;
  s public.settings;
  va int;
  vb int;
  pa int;
  pb int;
  w uuid;
  res text;
  fb uuid;
begin
  select * into r from public.rounds where id = p_round_id for update;
  if not found then
    raise exception 'round_not_found' using errcode = 'P0002';
  end if;
  if r.status = 'closed' then
    return r;                                  -- idempotente
  end if;
  if not p_force and now() < r.ends_at then
    return r;                                  -- aún no vence: no se cierra
  end if;

  select * into s from public.settings where id = 1;

  -- La tabla votes es la fuente de verdad (cast_vote bloquea la ronda, así que no hay carreras)
  select count(*) filter (where v.option = 'a'), count(*) filter (where v.option = 'b')
    into va, vb
  from public.votes v where v.round_id = r.id;

  if va > vb then
    w := r.option_a; res := 'votos';
  elsif vb > va then
    w := r.option_b; res := 'votos';
  elsif va > 0 then
    res := 'empate';
    if s.tie_rule = 'opcion_a' then
      w := r.option_a;
    elsif s.tie_rule = 'menos_reproducida' then
      select count(*) into pa from public.play_history h where h.song_id = r.option_a and h.status = 'ok';
      select count(*) into pb from public.play_history h where h.song_id = r.option_b and h.status = 'ok';
      if pa < pb then w := r.option_a;
      elsif pb < pa then w := r.option_b;
      else w := case when random() < 0.5 then r.option_a else r.option_b end;
      end if;
    else
      w := case when random() < 0.5 then r.option_a else r.option_b end;
    end if;
  else
    res := 'sin_votos';
    if s.no_votes_rule = 'respaldo' then
      select pls.song_id into fb
      from public.playlist_songs pls
      join public.playlists p on p.id = pls.playlist_id
      join public.songs sg on sg.id = pls.song_id
      where p.is_fallback and sg.active and not sg.restricted
      order by random() limit 1;
      w := coalesce(fb, case when random() < 0.5 then r.option_a else r.option_b end);
    else
      w := case when random() < 0.5 then r.option_a else r.option_b end;
    end if;
  end if;

  update public.rounds
  set status = 'closed', votes_a = va, votes_b = vb, winner_id = w, resolution = res
  where id = r.id
  returning * into r;
  return r;
end;
$$;

-- Cierra rondas vencidas (lo llama pg_cron cada minuto).
create or replace function public.close_expired_rounds()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  rid uuid;
  n integer := 0;
begin
  for rid in select id from public.rounds where status = 'open' and now() >= ends_at loop
    perform public._close_round(rid, false);
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- ============================================================
-- API pública (authenticated)
-- ============================================================

create or replace function public.server_now()
returns timestamptz
language sql
stable
set search_path = ''
as $$ select now(); $$;

-- Voto: valida con now() del servidor, 1 voto por usuario.
-- Devuelve {ok, status: 'voted' | 'already_voted' | 'closed' | 'not_found', option}
create or replace function public.cast_vote(p_round_id uuid, p_option text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  r public.rounds;
  prev text;
  n int;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_option is null or p_option not in ('a', 'b') then
    raise exception 'invalid_option' using errcode = '22023';
  end if;

  -- Bloquea la ronda: serializa votos y cierre (close_round también toma este lock)
  select * into r from public.rounds where id = p_round_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'status', 'not_found', 'option', null);
  end if;

  if r.status <> 'open' or now() >= r.ends_at then
    select v.option into prev from public.votes v where v.round_id = r.id and v.voter_id = uid;
    return jsonb_build_object('ok', false, 'status', 'closed', 'option', prev);
  end if;

  insert into public.votes (round_id, option, voter_id)
  values (r.id, p_option, uid)
  on conflict (round_id, voter_id) do nothing;
  get diagnostics n = row_count;

  if n = 0 then
    select v.option into prev from public.votes v where v.round_id = r.id and v.voter_id = uid;
    return jsonb_build_object('ok', false, 'status', 'already_voted', 'option', prev);
  end if;

  if p_option = 'a' then
    update public.rounds set votes_a = votes_a + 1 where id = r.id;
  else
    update public.rounds set votes_b = votes_b + 1 where id = r.id;
  end if;

  return jsonb_build_object('ok', true, 'status', 'voted', 'option', p_option);
end;
$$;

-- Cierra la ronda solo si now() >= ends_at. Idempotente.
create or replace function public.close_round(p_round_id uuid)
returns public.rounds
language sql
security definer
set search_path = ''
as $$ select public._close_round(p_round_id, false); $$;

-- Solo admin: cierra aunque no haya vencido.
create or replace function public.admin_force_close_round(p_round_id uuid)
returns public.rounds
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return public._close_round(p_round_id, true);
end;
$$;

-- Crea la siguiente ronda. Si ya hay una abierta, la devuelve (idempotente: sirve al recargar /pantalla).
-- ends_at = inicio de la canción en curso + tiempo de reproducción − 10 s,
-- con mínimo settings.round_duration_sec.
create or replace function public.start_round(p_temp numeric default null)
returns public.rounds
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rounds;
  s public.settings;
  ps public.playback_state;
  ctx jsonb;
  pick jsonb;
  dur int;
  play_sec int;
  base timestamptz;
  ends timestamptz;
begin
  perform pg_advisory_xact_lock(hashtext('radio.start_round'));

  select * into r from public.rounds where status = 'open' limit 1;
  if found then
    return r;
  end if;

  select * into s from public.settings where id = 1;
  select * into ps from public.playback_state where id = 1;

  ctx := public._build_context(p_temp);
  pick := public._contextual_pick(ctx);

  -- tiempo de reproducción de la canción en curso: min(duration_sec, max_play_sec); 0 = completa
  select coalesce(sg.duration_sec, 0) into dur from public.songs sg where sg.id = ps.current_song_id;
  dur := coalesce(dur, 0);
  if s.max_play_sec > 0 then
    play_sec := least(case when dur > 0 then dur else s.max_play_sec end, s.max_play_sec);
  else
    play_sec := case when dur > 0 then dur else s.round_duration_sec + 10 end;
  end if;

  base := case
    when ps.started_at is not null
      and ps.started_at <= now()
      and now() - ps.started_at < make_interval(secs => play_sec)
    then ps.started_at
    else now()
  end;
  ends := greatest(
    base + make_interval(secs => greatest(play_sec - 10, 0)),
    now() + make_interval(secs => s.round_duration_sec)
  );

  insert into public.rounds (option_a, option_b, starts_at, ends_at, context_snapshot)
  values (
    (pick ->> 'a')::uuid,
    (pick ->> 'b')::uuid,
    now(),
    ends,
    ctx || (pick - 'a' - 'b') || jsonb_build_object('play_sec', play_sec)
  )
  returning * into r;

  update public.playback_state set current_round_id = r.id, updated_at = now() where id = 1;
  return r;
end;
$$;

-- Registra una reproducción. status 'ok' = empezó a sonar; 'error' = falló en YouTube; 'skipped' = saltada.
create or replace function public.record_play(
  p_song_id uuid,
  p_round_id uuid default null,
  p_status text default 'ok',
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.play_history (song_id, round_id, status, note)
  values (p_song_id, p_round_id, p_status, left(p_note, 500));

  if p_status = 'ok' then
    update public.playback_state
    set current_song_id = p_song_id, started_at = now(), phase = 'playing', updated_at = now()
    where id = 1;
  elsif p_status = 'error' then
    update public.playback_state set phase = 'error', updated_at = now() where id = 1;
  end if;
end;
$$;

create or replace function public.set_phase(p_phase text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.playback_state set phase = p_phase, updated_at = now() where id = 1;
end;
$$;

-- Anuncio que toca ahora: aprobado, activo, vigente, en horario y con la frecuencia cumplida
-- (canciones reproducidas desde su última emisión >= every_n_songs).
create or replace function public.next_announcement()
returns setof public.announcements
language sql
stable
security definer
set search_path = ''
as $$
  with c as (select (public._build_context(null) ->> 'hour')::int as h)
  select a.*
  from public.announcements a, c
  where a.approved and a.active
    and (a.starts_at is null or now() >= a.starts_at)
    and (a.ends_at is null or now() < a.ends_at)
    and public._hour_in_window(c.h, a.hour_from::int, a.hour_to::int)
    and (
      select count(*) from public.play_history h
      where h.status = 'ok' and h.played_at > coalesce(a.last_played_at, '-infinity'::timestamptz)
    ) >= a.every_n_songs
  order by a.last_played_at nulls first, a.created_at
  limit 1;
$$;

create or replace function public.mark_announcement_played(p_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$ update public.announcements set last_played_at = now() where id = p_id; $$;

-- ============================================================
-- Permisos de ejecución
-- ============================================================
revoke all on function public._hour_in_window(int, int, int) from public, anon, authenticated;
revoke all on function public._build_context(numeric) from public, anon, authenticated;
revoke all on function public._contextual_pick(jsonb) from public, anon, authenticated;
revoke all on function public._close_round(uuid, boolean) from public, anon, authenticated;
revoke all on function public.close_expired_rounds() from public, anon, authenticated;

revoke all on function public.server_now() from public, anon, authenticated;
revoke all on function public.cast_vote(uuid, text) from public, anon, authenticated;
revoke all on function public.close_round(uuid) from public, anon, authenticated;
revoke all on function public.admin_force_close_round(uuid) from public, anon, authenticated;
revoke all on function public.start_round(numeric) from public, anon, authenticated;
revoke all on function public.record_play(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.set_phase(text) from public, anon, authenticated;
revoke all on function public.next_announcement() from public, anon, authenticated;
revoke all on function public.mark_announcement_played(uuid) from public, anon, authenticated;

grant execute on function public.server_now() to authenticated;
grant execute on function public.cast_vote(uuid, text) to authenticated;
grant execute on function public.close_round(uuid) to authenticated;
grant execute on function public.admin_force_close_round(uuid) to authenticated;
grant execute on function public.start_round(numeric) to authenticated;
grant execute on function public.record_play(uuid, uuid, text, text) to authenticated;
grant execute on function public.set_phase(text) to authenticated;
grant execute on function public.next_announcement() to authenticated;
grant execute on function public.mark_announcement_played(uuid) to authenticated;

-- ============================================================
-- pg_cron: cierra rondas vencidas cada minuto por si la pantalla se cae
-- ============================================================
create extension if not exists pg_cron;

select cron.schedule(
  'close-expired-rounds',
  '* * * * *',
  $cron$ select public.close_expired_rounds(); $cron$
);
