-- Fase 3 · Corrección del algoritmo contextual
-- Problema: las canciones con tema (p. ej. 'navidad') se ofrecían en cualquier momento, porque el
-- tema solo se usaba como filtro suave cuando había una regla/evento con ese tema.
-- Corrección: una canción con theme no nulo solo es elegible si su tema está ACTIVO en el contexto
-- (tema del evento activo o tema listado por una regla que cumple sus condiciones).
-- Las canciones sin tema siguen siendo elegibles siempre.

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
  active_themes text[] := '{}';
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
    if coalesce(cardinality(r.themes), 0) > 0 then
      theme_lists := theme_lists || jsonb_build_array(to_jsonb(r.themes));
      active_themes := active_themes || r.themes;
    end if;
  end loop;

  -- el tema del evento activo es el primer afinado de tema y también habilita ese tema
  if v_theme is not null then
    theme_lists := jsonb_build_array(jsonb_build_array(v_theme)) || theme_lists;
    active_themes := active_themes || v_theme;
  end if;

  -- 4. Sin clima (ni override) => respaldo
  if v_temp is null then
    reason := 'sin_temperatura';
  end if;

  if reason is null then
    -- 3. Filtro duro: activas, no restringidas, no repetidas, géneros y energía de la regla principal,
    --    y canciones con tema solo si ese tema está activo en el contexto.
    select coalesce(array_agg(sg.id), '{}') into pool
    from public.songs sg
    where sg.active
      and not sg.restricted
      and sg.id is distinct from ps.current_song_id
      and (genres is null or exists (select 1 from unnest(genres) g where lower(g) = lower(sg.genre)))
      and (emin is null or sg.energy >= emin)
      and (emax is null or sg.energy <= emax)
      and (sg.theme is null or exists (select 1 from unnest(active_themes) t where lower(t) = lower(sg.theme)))
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
    'active_themes', to_jsonb(active_themes),
    'applied_moods', applied_moods,
    'applied_themes', applied_themes
  );
end;
$$;
