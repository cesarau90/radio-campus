-- Fase 8 · Vista previa del algoritmo contextual para el panel /admin ("Simular contexto").
--
-- admin_preview_pick(hora, temperatura, tipo de evento, tema) devuelve las 2 canciones que el
-- algoritmo ofrecería con ese contexto, junto con las reglas que se aplicaron y el tamaño del
-- conjunto de canciones elegibles. NO crea rondas ni escribe nada: solo lee. Solo la usa un admin.
--
--   p_hour         0-23. null = la hora actual del campus.
--   p_temp         °C. null = "sin dato de clima" (el algoritmo usa la playlist de respaldo).
--   p_event_type   'festividad' | 'examenes' | 'evento'. null = sin evento.
--   p_theme        tema del evento (p. ej. 'navidad'). null o '' = sin tema.
--
-- Aplicar: pegar este archivo completo en el SQL Editor de Supabase y ejecutarlo.

create or replace function public.admin_preview_pick(
  p_hour int default null,
  p_temp numeric default null,
  p_event_type text default null,
  p_theme text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hour int;
  ctx jsonb;
  pick jsonb;
begin
  if not (select public.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_hour is not null and (p_hour < 0 or p_hour > 23) then
    raise exception 'La hora debe estar entre 0 y 23.' using errcode = '22023';
  end if;
  if p_event_type is not null and p_event_type not in ('festividad', 'examenes', 'evento') then
    raise exception 'Tipo de evento inválido.' using errcode = '22023';
  end if;

  v_hour := coalesce(p_hour, extract(hour from (now() at time zone 'America/Mexico_City'))::int);
  ctx := jsonb_build_object(
    'hour', v_hour,
    'temp', p_temp,
    'event_type', p_event_type,
    'event_theme', nullif(p_theme, ''),
    'event_name', case when p_event_type is null then null else 'simulado' end,
    'overridden', true,
    'tz', 'America/Mexico_City'
  );
  pick := public._contextual_pick(ctx);

  return jsonb_build_object(
    'context', ctx,
    'pick', pick,
    'song_a', (select to_jsonb(s) from public.songs s where s.id = (pick ->> 'a')::uuid),
    'song_b', (select to_jsonb(s) from public.songs s where s.id = (pick ->> 'b')::uuid)
  );
end;
$$;

revoke all on function public.admin_preview_pick(int, numeric, text, text) from public, anon, authenticated;
grant execute on function public.admin_preview_pick(int, numeric, text, text) to authenticated;
