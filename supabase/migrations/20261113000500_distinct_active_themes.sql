-- Detalle menor: active_themes del snapshot salía duplicado (["navidad","navidad"]) cuando el tema
-- venía a la vez del evento y de una regla. Se devuelve sin duplicados y ordenado.
--
-- En vez de repetir las ~150 líneas de _contextual_pick, se toma su definición vigente
-- (la de 20261113000400) y se sustituye solo la expresión del snapshot. Si el texto a
-- reemplazar no se encuentra, la migración falla en vez de no hacer nada en silencio.
do $$
declare
  d text;
  patched text;
begin
  d := pg_get_functiondef('public._contextual_pick(jsonb)'::regprocedure);
  patched := replace(
    d,
    '''active_themes'', to_jsonb(active_themes)',
    '''active_themes'', to_jsonb(array(select distinct t from unnest(active_themes) t order by t))'
  );
  if patched = d then
    raise exception 'No se encontró la expresión active_themes en _contextual_pick; revisar la migración';
  end if;
  execute patched;
end;
$$;
