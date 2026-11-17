# Arquitectura

Radio Campus es una **SPA de React** sin servidor propio. El navegador habla directo con Supabase (Postgres, Auth, Realtime y funciones SQL) y con tres servicios gratuitos: YouTube (música), Open-Meteo (clima) y la Web Speech API del navegador (voz). **La lógica crítica está en el servidor**, en funciones SQL `security definer`; el cliente solo muestra y pide acciones.

## Vista general

```mermaid
flowchart LR
  subgraph Navegador
    P["/pantalla (TV)<br/>director, YouTube, voz, QR"]
    V["/votar (celular)<br/>votar una vez por ronda"]
    A["/admin (computadora)<br/>monitor, CRUDs, simulador"]
  end

  subgraph Supabase
    AUTH["Auth<br/>anónimo (votantes y TV)<br/>correo y contraseña (admin)"]
    RPC["Funciones SQL (RPC)<br/>start_round, cast_vote, close_round,<br/>record_play, set_phase, next_announcement,<br/>admin_force_close_round, admin_preview_pick"]
    DB[("Postgres + RLS<br/>songs, rounds, votes, settings,<br/>playback_state, ...")]
    RT["Realtime<br/>cambios de rounds, settings,<br/>playback_state, announcements"]
    CRON["pg_cron (cada minuto)<br/>close_expired_rounds"]
  end

  YT["YouTube IFrame API"]
  OM["Open-Meteo (clima)"]
  WS["Web Speech API (voz)"]

  P -- "RPC" --> RPC
  V -- "RPC cast_vote" --> RPC
  A -- "tablas con RLS + RPC" --> DB
  A -- "RPC" --> RPC
  RPC --> DB
  CRON --> DB
  DB --> RT
  RT -. "en vivo" .-> P
  RT -. "en vivo" .-> V
  RT -. "en vivo" .-> A
  P --> YT
  P --> OM
  P --> WS
  A --> WS
  P --- AUTH
  V --- AUTH
  A --- AUTH
```

**Reglas de oro del diseño**

- **El servidor manda en los tiempos.** Las pantallas sincronizan un reloj con `server_now()` y cuentan contra él; un celular con la hora mal puesta no cambia nada. Un voto cuenta o no según `now()` del servidor.
- **Seguridad por RLS.** Los visitantes solo leen datos públicos y votan por RPC; nadie escribe directo en `rounds`, `votes` ni `play_history`. Todo lo administrativo exige `is_admin()` (tabla `admins`). Probado en [`supabase/tests/rls_write_access.sql`](../supabase/tests/rls_write_access.sql).
- **Idempotencia.** Cada paso del director se puede repetir sin dañar nada (recargar `/pantalla` retoma la ronda abierta; `start_round` devuelve la ronda abierta si ya existe; solo puede haber una ronda abierta por índice único).
- **Código por capas.** `src/hooks` (lógica, una por página), `src/components` (solo reciben props), `src/lib` (acceso a datos y utilidades puras), `src/types` (tipos con barrel).

## Una ronda, paso a paso

```mermaid
sequenceDiagram
  autonumber
  participant TV as /pantalla (director)
  participant DB as Supabase (RPC + Postgres)
  participant YT as YouTube
  participant Cel as /votar (celulares)

  TV->>DB: record_play(canción) y start_round(temperatura)
  DB->>DB: _build_context + _contextual_pick (reglas, evento, clima)
  DB-->>TV: ronda abierta con 2 opciones y ends_at
  TV->>YT: reproduce la canción (fade-out al cortar)
  DB-->>Cel: Realtime: ronda abierta
  Cel->>DB: cast_vote(ronda, a|b)
  DB-->>Cel: voted | already_voted | closed
  DB-->>TV: Realtime: votos A/B en vivo
  Note over TV,DB: al vencer ends_at (o por pg_cron)
  TV->>DB: close_round(ronda)
  DB-->>TV: ganadora (votos, empate o sin votos)
  TV->>TV: voz: "Ronda cerrada. Sigue ..."
  Note over TV: al terminar la canción en curso
  TV->>DB: next_announcement (si toca, se dice entre canciones)
  TV->>DB: record_play(ganadora) y start_round(...)
```

`ends_at = inicio de la canción + min(duración, max_play_sec) − 10 s`, con `round_duration_sec` como mínimo. La ganadora entra cuando termina la canción en curso.

## Fases de `/pantalla`

```mermaid
stateDiagram-v2
  [*] --> idle
  idle --> playing: record_play (ok)
  playing --> result: la ronda cierra con ganadora pendiente
  result --> announcement: toca un anuncio aprobado
  announcement --> playing: record_play (ganadora)
  result --> playing: record_play (ganadora)
  playing --> error: el video falla en YouTube
  error --> playing: se salta a la ganadora o a otra canción
  playing --> playing: el admin salta la canción
```

La fase se guarda en `playback_state.phase` para que `/votar` y el monitor sepan qué suena.

## El algoritmo contextual

`start_round` arma un **contexto** (hora del campus, temperatura, evento vigente) y `_contextual_pick` elige 2 canciones:

1. Aplica las **reglas activas** que cumplen sus condiciones; la de mayor prioridad define géneros y energía, y las demás afinan ánimo y tema.
2. **Filtros duros:** canciones activas, no restringidas, distintas de la que suena y no repetidas dentro de `no_repeat_minutes`. Una canción con `theme` solo es elegible si su tema está activo (evento o regla).
3. **Filtros suaves** (ánimo, tema): solo se aplican si dejan al menos 2 canciones.
4. Elige la primera al azar y la segunda, de preferencia de otro artista.
5. **Sin temperatura o con menos de 2 elegibles** → playlist de respaldo (nunca una ronda vacía).

El simulador de `/admin` permite ver qué ofrecería con otra hora, temperatura o evento (`admin_preview_pick`, solo lectura) y aplicarlo a la radio real (`settings.context_override`). Evidencia: [`docs/evidencias/fase8/`](evidencias/fase8/).

## Base de datos

```mermaid
erDiagram
  songs {
    uuid id PK
    text youtube_id UK
    text title
    text artist
    int duration_sec
    text genre
    smallint energy "1 a 5"
    text mood
    text theme "nullable: solo suena si su tema esta activo"
    bool restricted
    bool active
  }
  playlists {
    uuid id PK
    text name UK
    bool is_fallback "solo una"
  }
  playlist_songs {
    uuid playlist_id FK
    uuid song_id FK
    int position
  }
  context_rules {
    uuid id PK
    text name
    int priority
    bool active
    smallint hour_from
    smallint hour_to
    numeric temp_min
    numeric temp_max
    text event_type
    text_array allowed_genres
    smallint energy_min
    smallint energy_max
    text_array moods
    text_array themes
  }
  events {
    uuid id PK
    text name
    text type "festividad, examenes, evento"
    timestamptz starts_at
    timestamptz ends_at
    text theme
  }
  rounds {
    uuid id PK
    uuid option_a FK
    uuid option_b FK
    timestamptz starts_at
    timestamptz ends_at
    text status "open o closed (una sola abierta)"
    int votes_a
    int votes_b
    uuid winner_id FK
    text resolution "votos, empate, sin_votos"
    jsonb context_snapshot
  }
  votes {
    uuid id PK
    uuid round_id FK
    text option "a o b"
    uuid voter_id "unico por ronda"
  }
  announcements {
    uuid id PK
    text text
    bool approved
    bool active
    timestamptz starts_at
    timestamptz ends_at
    smallint hour_from
    smallint hour_to
    int every_n_songs
    timestamptz last_played_at
  }
  play_history {
    uuid id PK
    uuid song_id FK
    uuid round_id FK
    timestamptz played_at
    text status "ok, error, skipped"
    text note
  }
  settings {
    smallint id PK "fila unica"
    int round_duration_sec
    int max_play_sec
    text tie_rule
    text no_votes_rule
    int no_repeat_minutes
    bool paused
    numeric lat
    numeric lon
    jsonb context_override
    timestamptz skip_requested_at
  }
  playback_state {
    smallint id PK "fila unica"
    uuid current_song_id FK
    uuid current_round_id FK
    text phase "idle, playing, result, announcement, error"
    timestamptz started_at
  }
  admins {
    uuid user_id PK
  }

  songs ||--o{ playlist_songs : "esta en"
  playlists ||--o{ playlist_songs : "contiene"
  songs ||--o{ rounds : "opcion A, opcion B o ganadora"
  rounds ||--o{ votes : "recibe"
  songs ||--o{ play_history : "suena"
  rounds ||--o{ play_history : "origina"
  songs ||--o| playback_state : "suena ahora"
  rounds ||--o| playback_state : "ronda actual"
```

### Quién puede qué (RLS)

| Quién | Lee | Escribe |
|---|---|---|
| Visitante anónimo (votantes, TV) | canciones activas y no restringidas, eventos, ajustes, rondas, estado de reproducción, anuncios aprobados y activos, **su propio voto** | solo por RPC: `cast_vote`, y desde la TV `start_round`, `close_round`, `record_play`, `set_phase`, `next_announcement` |
| Administrador (`is_admin()`) | además: canciones restringidas, playlists, reglas, historial, todos los anuncios | canciones, playlists, reglas, eventos, anuncios y `settings`; no escribe directo en `votes`, `rounds` ni `play_history` |
| `pg_cron` | — | cierra rondas vencidas cada minuto (`close_expired_rounds`) |

### Migraciones

| Archivo | Qué hace |
|---|---|
| `20261113000100_schema.sql` | Tablas, índices y filas únicas de `settings` y `playback_state` |
| `20261113000200_rls.sql` | Políticas de lectura y escritura, privilegios mínimos, Realtime |
| `20261113000300_round_logic.sql` | `cast_vote`, `close_round`, `start_round`, algoritmo contextual, anuncios, `pg_cron` |
| `20261113000400_theme_eligibility.sql` | Una canción con tema solo es elegible si su tema está activo |
| `20261113000500_distinct_active_themes.sql` | `active_themes` sin duplicados |
| `20261117000100_admin_preview_pick.sql` | `admin_preview_pick` (vista previa de solo lectura para el simulador) |

## Estructura del código

```
src/
  pages/        Pantalla, Votar, Admin, Diagnostico (solo desarrollo): cada una llama a su hook principal
  hooks/        usePantalla, useVotar, useAdmin (+ useAdmin*), useLiveState, useServerClock,
                useYouTubePlayer, useSpeech, useWeather, useAnonymousSession, useAdminSession...
  components/   vistas y piezas que solo reciben props (+ votar.css, pantalla.css, admin.css, radio.css)
  lib/          api.ts (acceso a datos), speech.ts, playback.ts, weather.ts, youtube.ts, time.ts...
  types/        tipos, con index.ts como barrel
  styles/       tokens.css: única fuente de colores, tipografías, espacios, radios y movimiento
supabase/       migraciones, seed y pruebas SQL
docs/           esta documentación y las evidencias
```
