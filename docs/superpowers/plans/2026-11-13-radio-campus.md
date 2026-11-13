# Radio Inteligente del Campus — Plan de implementación

> **Para agentes:** usar superpowers:executing-plans. Un commit al cerrar cada fase (el historial es entregable).

**Goal:** Sistema de radio interactiva para el campus: pantalla pública (TV), votación móvil y panel admin, sobre Supabase + Vercel sin servidor propio.

**Architecture:** SPA React/Vite. Toda la lógica de negocio crítica (tiempos, votos, cierre, algoritmo contextual) vive en funciones SQL `security definer` en Supabase; el cliente nunca decide tiempos. `/pantalla` es el "reproductor": controla YouTube, voz y avance de rondas. Realtime propaga estado.

**Tech Stack:** React, Vite, TypeScript, React Router, Supabase (Postgres, Auth, Realtime, RPC, pg_cron), YouTube IFrame API, Open-Meteo, Web Speech API, qrcode.react, Vercel.

**Spec:** el mensaje de requisitos del usuario (sesión 2026-11-13); decisiones de brainstorming abajo.

## Global Constraints
- Toda la lógica en `src/hooks`; componentes solo reciben props; cada página llama a su hook principal una sola vez.
- Tipos en `src/types` con barrel `index.ts`.
- Claves solo en `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`; el usuario pidió la clave publicable `sb_publishable_…` en lugar de la anon key); incluir `.env.example` y `.gitignore`.
- Sin servidor Node propio, workers ni TTS local. Todo gratuito.
- Voz: `speechSynthesis`, `es-MX`. Clima: Open-Meteo (coords de Tampico en settings). Zona horaria: `America/Mexico_City`.
- UI: skills diseno-distintivo + impeccable + guías de animación de Emil Kowalski. Nada de diseño genérico de IA.
- No inventar IDs de YouTube: verificar con oEmbed (HTTP 200).
- `vercel.json` con rewrites SPA.

## Decisiones acordadas
- Duración: la canción suena `min(duration_sec, settings.max_play_sec)` (0 = completa) con fade-out al cortar. La ronda abre al iniciar la canción y `ends_at = inicio + tiempo_de_reproducción − 10 s`. `round_duration_sec` queda como mínimo.
- Supabase: el usuario crea el proyecto, pone URL/anon key en `.env` y activa sign-in anónimo; yo aplico migraciones y seed por MCP; el README documenta los pasos manuales.
- Admin: paso manual documentado (crear usuario en Auth + `INSERT INTO admins`), SQL en el README.
- Deploy a Vercel al terminar la Fase 5 (no hasta la 9).
- Extras míos: tabla `admins` + `is_admin()`, tabla `playback_state` (una fila, Realtime), `start_round` se niega si ya hay ronda abierta, `admin_force_close_round`, `record_play`.

## Review Focus
- Voto doble / dos pestañas del mismo anónimo → "ya votó", no error crudo.
- Voto justo en `ends_at` o con reloj del celular desfasado → decide `now()` del servidor.
- Menos de 2 canciones elegibles o clima caído → playlist "respaldo", nunca ronda vacía.
- Video de YouTube no embebible/eliminado → error visible, salto a respaldo, registro.
- Pantalla recarga a media ronda → retoma la ronda abierta, no crea otra.
- Anuncio y canción nunca se encimarán; `paused` se respeta.

## Estructura de archivos
```
src/types/            index.ts + song, round, settings, announcement, context...
src/hooks/            useSupabase*, usePantalla, useVotar, useAdmin*, useYouTubePlayer, useSpeech, useWeather...
src/components/       presentacionales (solo props)
src/pages/            Pantalla, Votar, Admin
src/lib/              supabase client, utilidades puras
supabase/migrations/  *.sql     supabase/seed.sql
docs/                 arquitectura, manual-admin, servicios-y-costos, pruebas
```

## Fases (commit al cerrar cada una)
- [ ] **Fase 0 — Cimientos:** `git init`, Vite+React+TS+Router, `.env.example`, `.gitignore`, `vercel.json`, estructura de carpetas, tipos base, dirección visual (tokens, tipografía, movimiento) mostrada al usuario. *Verifica:* `npm run build` y `npm run dev` sin errores.
- [ ] **Fase 1 — Esquema y RLS:** migraciones de todas las tablas (+`admins`, `playback_state`, `settings.max_play_sec`), RLS, Realtime. *Verifica:* `get_advisors` sin alertas de seguridad; anon no puede escribir.
- [ ] **Fase 2 — Lógica SQL:** `cast_vote`, `close_round`, `start_round` (algoritmo contextual), `admin_force_close_round`, `record_play`, `pg_cron`. *Verifica:* pruebas SQL (empate, sin votos, voto doble, ronda no vencida, respaldo, override).
- [ ] **Fase 3 — Seed:** reglas, playlist respaldo, settings, eventos; ~30 canciones verificadas con oEmbed.
- [ ] **Fase 4 — Núcleo del cliente:** cliente Supabase, auth anónima/admin, rutas, `useRealtimeStatus`, `useServerClock`, `useSettings`.
- [ ] **Fase 5 — /votar** (+ **deploy a Vercel**).
- [ ] **Fase 6 — /pantalla:** máquina de estados, YouTube, voz, clima, QR, ticker, conexión.
- [ ] **Fase 7 — /admin CRUDs:** login, canciones (oEmbed), playlists, reglas, eventos, settings, anuncios (voz).
- [ ] **Fase 8 — /admin operación:** monitor, historial, gráfica, controles, simular contexto.
- [ ] **Fase 9 — Pulido y docs:** animación, accesibilidad, README, `docs/*`, limitaciones, `pruebas.md`.
