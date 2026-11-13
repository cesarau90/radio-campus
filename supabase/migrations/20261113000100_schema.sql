-- Fase 1 · Esquema base de Radio Campus
-- Todas las escrituras de negocio (votos, rondas, historial) entran por funciones RPC (fase 2).

-- ============================================================
-- Admins
-- ============================================================
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- is_admin(): único criterio de escritura en todas las policies.
-- Los usuarios anónimos de Supabase usan el rol "authenticated", así que NUNCA
-- se puede confiar en "to authenticated" para autorizar escrituras.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    and exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ============================================================
-- Canciones y playlists
-- ============================================================
create table public.songs (
  id uuid primary key default gen_random_uuid(),
  youtube_id text not null unique,
  title text not null,
  artist text not null default '',
  duration_sec integer not null default 0 check (duration_sec >= 0),
  genre text not null,
  energy smallint not null check (energy between 1 and 5),
  mood text not null,
  theme text,
  restricted boolean not null default false,
  restriction_note text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index songs_active_idx on public.songs (active) where active and not restricted;

create table public.playlists (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_fallback boolean not null default false,
  created_at timestamptz not null default now()
);
-- Solo una playlist puede ser la de respaldo.
create unique index playlists_single_fallback_idx on public.playlists (is_fallback) where is_fallback;

create table public.playlist_songs (
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  song_id uuid not null references public.songs (id) on delete cascade,
  position integer not null default 0,
  primary key (playlist_id, song_id)
);
create index playlist_songs_song_idx on public.playlist_songs (song_id);

-- ============================================================
-- Reglas contextuales y eventos
-- ============================================================
-- Horas 0-23. Si hour_from > hour_to la ventana cruza la medianoche (ej. 20 a 5).
create table public.context_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  priority integer not null default 0,
  active boolean not null default true,
  -- condiciones (null = no condiciona)
  hour_from smallint check (hour_from between 0 and 23),
  hour_to smallint check (hour_to between 0 and 23),
  temp_min numeric,
  temp_max numeric,
  event_type text check (event_type in ('festividad', 'examenes', 'evento')),
  -- efectos (null = no restringe)
  allowed_genres text[],
  energy_min smallint check (energy_min between 1 and 5),
  energy_max smallint check (energy_max between 1 and 5),
  moods text[],
  themes text[],
  created_at timestamptz not null default now(),
  check (energy_min is null or energy_max is null or energy_min <= energy_max)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('festividad', 'examenes', 'evento')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  theme text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index events_window_idx on public.events (starts_at, ends_at);

-- ============================================================
-- Rondas y votos
-- ============================================================
create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  option_a uuid not null references public.songs (id),
  option_b uuid not null references public.songs (id),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  votes_a integer not null default 0 check (votes_a >= 0),
  votes_b integer not null default 0 check (votes_b >= 0),
  winner_id uuid references public.songs (id),
  resolution text check (resolution in ('votos', 'empate', 'sin_votos')),
  context_snapshot jsonb,
  created_at timestamptz not null default now(),
  check (option_a <> option_b),
  check (ends_at > starts_at)
);
create index rounds_option_a_idx on public.rounds (option_a);
create index rounds_option_b_idx on public.rounds (option_b);
create index rounds_winner_idx on public.rounds (winner_id);
create index rounds_created_idx on public.rounds (created_at desc);
-- Nunca puede haber dos rondas abiertas a la vez.
create unique index rounds_single_open_idx on public.rounds ((true)) where status = 'open';

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds (id) on delete cascade,
  option text not null check (option in ('a', 'b')),
  voter_id uuid not null,
  created_at timestamptz not null default now(),
  unique (round_id, voter_id)
);

-- ============================================================
-- Anuncios, historial y estado
-- ============================================================
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  approved boolean not null default false,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  hour_from smallint check (hour_from between 0 and 23),
  hour_to smallint check (hour_to between 0 and 23),
  every_n_songs integer not null default 3 check (every_n_songs >= 1),
  last_played_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.play_history (
  id uuid primary key default gen_random_uuid(),
  song_id uuid not null references public.songs (id) on delete cascade,
  played_at timestamptz not null default now(),
  round_id uuid references public.rounds (id) on delete set null,
  -- 'ok' sonó normal, 'error' falló en YouTube (se registró y se saltó), 'skipped' saltada por el admin
  status text not null default 'ok' check (status in ('ok', 'error', 'skipped')),
  note text
);
create index play_history_played_idx on public.play_history (played_at desc);
create index play_history_song_idx on public.play_history (song_id, played_at desc);
create index play_history_round_idx on public.play_history (round_id);

-- Una sola fila. max_play_sec: 0 = canción completa; >0 corta con fade-out.
create table public.settings (
  id smallint primary key default 1 check (id = 1),
  round_duration_sec integer not null default 30 check (round_duration_sec >= 10), -- mínimo de ronda
  max_play_sec integer not null default 0 check (max_play_sec >= 0),
  tie_rule text not null default 'aleatorio' check (tie_rule in ('aleatorio', 'menos_reproducida', 'opcion_a')),
  no_votes_rule text not null default 'aleatorio' check (no_votes_rule in ('aleatorio', 'respaldo')),
  no_repeat_minutes integer not null default 60 check (no_repeat_minutes >= 0),
  paused boolean not null default false,
  lat numeric not null default 22.2331 check (lat between -90 and 90),   -- Tampico
  lon numeric not null default -97.8611 check (lon between -180 and 180),
  context_override jsonb,       -- {"hour":14,"temp":35,"event_type":"examenes"}
  skip_requested_at timestamptz -- el admin lo actualiza; /pantalla reacciona
);

-- Una sola fila. Qué suena ahora; la escribe record_play (fase 2) y lo lee el monitor.
create table public.playback_state (
  id smallint primary key default 1 check (id = 1),
  current_song_id uuid references public.songs (id) on delete set null,
  current_round_id uuid references public.rounds (id) on delete set null,
  phase text not null default 'idle'
    check (phase in ('idle', 'playing', 'result', 'announcement', 'error')),
  started_at timestamptz,
  updated_at timestamptz not null default now()
);
create index playback_state_song_idx on public.playback_state (current_song_id);
create index playback_state_round_idx on public.playback_state (current_round_id);

insert into public.settings (id) values (1);
insert into public.playback_state (id) values (1);
