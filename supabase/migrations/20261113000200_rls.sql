-- Fase 1 · RLS y permisos
-- Regla de oro: los usuarios ANÓNIMOS usan el rol "authenticated". Por eso ninguna
-- policy de escritura es "to authenticated" a secas: todas exigen is_admin().
-- Los votos, rondas, historial y estado de reproducción solo se escriben vía RPC (fase 2).

alter table public.admins enable row level security;
alter table public.songs enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_songs enable row level security;
alter table public.context_rules enable row level security;
alter table public.events enable row level security;
alter table public.rounds enable row level security;
alter table public.votes enable row level security;
alter table public.announcements enable row level security;
alter table public.play_history enable row level security;
alter table public.settings enable row level security;
alter table public.playback_state enable row level security;

-- ------------------------------------------------------------
-- Lectura
-- ------------------------------------------------------------
-- Públicas (la pantalla y /votar las necesitan)
create policy "public read events" on public.events for select to anon, authenticated using (true);
create policy "public read rounds" on public.rounds for select to anon, authenticated using (true);
create policy "public read settings" on public.settings for select to anon, authenticated using (true);
create policy "public read playback" on public.playback_state for select to anon, authenticated using (true);

-- Canciones restringidas (y su nota) solo las ve el admin. Nunca entran a una ronda.
create policy "read songs" on public.songs for select to anon, authenticated
  using (not restricted or (select public.is_admin()));

-- Anuncios: el público solo ve los aprobados y activos.
create policy "read announcements" on public.announcements for select to anon, authenticated
  using ((approved and active) or (select public.is_admin()));

-- Cada quien ve su propio voto (para mostrar "ya votaste"); el admin ve todos.
create policy "read own votes" on public.votes for select to authenticated
  using (voter_id = (select auth.uid()) or (select public.is_admin()));

-- Solo admin
create policy "admin read playlists" on public.playlists for select to authenticated using ((select public.is_admin()));
create policy "admin read playlist_songs" on public.playlist_songs for select to authenticated using ((select public.is_admin()));
create policy "admin read context_rules" on public.context_rules for select to authenticated using ((select public.is_admin()));
create policy "admin read play_history" on public.play_history for select to authenticated using ((select public.is_admin()));
create policy "read own admin row" on public.admins for select to authenticated using (user_id = (select auth.uid()));

-- ------------------------------------------------------------
-- Escritura: solo is_admin()
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['songs', 'playlists', 'playlist_songs', 'context_rules', 'events', 'announcements']
  loop
    execute format('create policy "admin insert" on public.%I for insert to authenticated with check ((select public.is_admin()))', t);
    execute format('create policy "admin update" on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format('create policy "admin delete" on public.%I for delete to authenticated using ((select public.is_admin()))', t);
  end loop;
end $$;

-- settings: una sola fila, solo se actualiza.
create policy "admin update settings" on public.settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- rounds, votes, play_history, playback_state, admins: SIN policies de escritura.

-- ------------------------------------------------------------
-- Defensa en profundidad: privilegios de tabla
-- (TRUNCATE no pasa por RLS, así que se revoca explícitamente.)
-- ------------------------------------------------------------
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
revoke insert, update, delete on all tables in schema public from anon;
revoke insert, update, delete on public.rounds, public.votes, public.play_history,
  public.playback_state, public.admins from authenticated;
revoke insert, delete on public.settings from authenticated;

-- ------------------------------------------------------------
-- Realtime
-- ------------------------------------------------------------
alter publication supabase_realtime add table
  public.rounds, public.settings, public.announcements, public.playback_state;
