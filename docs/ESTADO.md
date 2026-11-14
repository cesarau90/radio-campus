# Estado del proyecto (para retomar)

Última actualización: 2026-11-14. Plan completo: [superpowers/plans/2026-11-13-radio-campus.md](superpowers/plans/2026-11-13-radio-campus.md).

## Dónde vamos

**Fase 5 (`/votar`): hecha, verificada en pantalla y desplegada.** Producción: **https://radio-campus-five.vercel.app** (repo público: https://github.com/cesarau90/radio-campus). Cada push a `main` se publica solo en Vercel (comprobado: el commit `d62d3db` quedó con el estado "Vercel · success" en GitHub, y el deploy nació 36 s después del push).

**Parado a propósito.** No se empieza `/pantalla` hasta definir el rediseño (ver "Para mañana", punto 2).

| Fase | Estado | Commit |
|---|---|---|
| 0 Cimientos | hecha | `5d36cf1` |
| 1 Esquema y RLS | hecha, probada | `c05f113` |
| 2 Lógica SQL | hecha, probada (53/53 en `round_logic.sql`) | `0460f1c` |
| 3 Seed verificado | hecha | `cf60093` |
| 4 Núcleo del cliente | hecha, probada | `28fde37` |
| (extra) `.gitattributes` | hecho | `4745430` |
| 5 `/votar` | hecha, verificada en pantalla | `08886ed` |
| 5b deploy (GitHub + Vercel) | **hecho** (falta la prueba real con celulares) | `d62d3db` |
| **Rediseño visual** | **pendiente, bloquea la Fase 6** | |
| 6 `/pantalla` | pendiente (bloqueada por el rediseño) | |
| 7 `/admin` CRUDs | pendiente | |
| 8 `/admin` operación | pendiente | |
| 9 Pulido y documentación | pendiente | |

## Para mañana (en este orden)

1. **Ronda real con 2–3 celulares** en https://radio-campus-five.vercel.app/votar, como evidencia de pruebas.
   - El usuario crea la ronda con un `insert` en `public.rounds` (`option_a`, `option_b`, `ends_at`) usando **id fijo** y por separado de la limpieza. Las canciones de prueba: `JGwWNGJdvx8` (A) y `QJ5DOWPGxwg` (B, título largo).
   - Votar desde los celulares, cerrar con `select public._close_round('<id>', true);`, capturar la pantalla de cada celular (también la vista `closed`) y guardarlas en `docs/evidencias/` (carpeta nueva, p. ej. `fase5-ronda-real/`).
   - Limpiar **por id**: `delete from public.rounds where id = '<id>';` y comprobar `count(*)` de `rounds` y `votes` (debe dar 0 y 0).
   - La evidencia es del diseño **actual**; el rediseño puede cambiarla.
   - Para no chocar con el rate limit de sign-ins anónimos (30/hora por IP por defecto), usar datos móviles en algún celular si la Wi-Fi ya se usó mucho.
2. **Rediseño visual — BLOQUEANTE de la Fase 6.** El usuario no está conforme con el estilo actual. Lo que ya señaló:
   - Falta la **portada de YouTube de cada canción** (hoy los paneles solo tienen letra, título, artista y género).
   - El contador debe ir en **mm:ss** (hoy se ve como `562 s`).
   - Se ve **vacío**.
   - **No empezar `/pantalla` hasta definir esto**, porque `/pantalla` debe compartir el mismo sistema visual. Hay que definirlo con el usuario antes de tocar código (dirección, no solo ajustes) y actualizar `PRODUCT.md` y el brief `.impeccable/surfaces/src-pages-votar-tsx.md`. Si cambia el diseño de `/votar`, repetir la verificación de contraste (≥ 4,5:1), foco y reduced-motion que se hizo en la Fase 5.
   - Ojo al decidirlo: `songs` no tiene columna de imagen (verificado en el esquema: `youtube_id`, `title`, `artist`, `duration_sec`, `genre`, `energy`, `mood`, `theme`, `restricted`, …), así que la portada tendría que derivarse de `youtube_id`. Falta comprobar de dónde se sirven esas imágenes y qué pasa si una no carga o la canción está `restricted`; no está asumido.
3. **Site URL de Vercel en Supabase** (Authentication → URL Configuration). Lo hace el usuario; anotar aquí cuando esté hecho.

## Qué falta además

- Opcional: `DESIGN.md` con el sistema visual (comando `document` de impeccable); encaja justo después del rediseño.
- Pendiente conocido de `/votar` (ya en el plan, Fase 9): al recargar con voto ya emitido, la vista pasa un instante por "votar" hasta que llega `fetchMyVote`. Debe mostrar "Sintonizando…" hasta que resuelva.
- README (Fase 9) → "Funciones simuladas o limitaciones": rate limit de sign-ins anónimos por IP y que se sube en Supabase antes de la demo (ya en el plan).
- La revisión de calidad de la Fase 5 se hizo en el mismo hilo (el subagente `impeccable-finish-reviewer` no existe en este entorno).

## Qué quedó hecho en la Fase 5

- `PRODUCT.md` (verdad del producto, redactado del brief) y el brief de la superficie con el contrato de dirección: `.impeccable/surfaces/src-pages-votar-tsx.md`.
- Hook principal `src/hooks/useVotar.ts`: sesión anónima, reloj del servidor, estado en vivo, voto, "ya votó" tras recargar, y la vista que toca (`connecting`, `error`, `no-round`, `voting`, `voted`, `counting`, `closed`).
- Componentes (solo props): `VotarView`, `OptionPanel`, `VotarHeader`, `StatusNotice`, `ResultView`, `ConnectionBanner`, `icons`, y los estilos `votar.css`. Tipo `VotarView` en `src/types/votar.ts`.
- Diseño: papeleta con dos paneles grandes (A = tinta, B = naranja señal), toque para elegir y botón fijo para confirmar, sello "Voto registrado" como único momento animado. Base móvil en `index.css` y `index.html`.
- Verificado a 390×844 y 320 px con Playwright: votar, ya votaste, cuenta regresiva, títulos largos, sin conexión, reduced-motion, foco con teclado, ronda cerrada y "Aún no hay votación". Evidencias en `docs/evidencias/fase5/` (incluye la captura de producción).
- Correcciones de la revisión: sello compacto que no pisa la letra; contraste de la opción no elegida (≥ 5,3:1) y del botón deshabilitado (5,05:1); `role="status"` montado desde el inicio y foco al título solo tras votar en esta visita.
- Deploy: proyecto Vercel `radio-campus` enlazado al repo; `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` cargadas en production y preview; `/`, `/votar`, `/pantalla` y `/admin` responden 200 (SPA con rewrite); en producción `/votar` conecta a Supabase sin errores y recargar la ruta no da 404.
- La base de datos está limpia: 0 rondas, 0 votos, 39 canciones.

## Rate limit de sign-ins anónimos (importante para la demo)

Se alcanzó un `429 Request rate limit reached` en `/auth/v1/signup` al abrir muchas sesiones nuevas en pocos minutos desde una IP (pruebas automatizadas). Por defecto son 30 por hora por IP (ráfaga de 30; fuente: docs de Supabase). El valor actual del proyecto no se pudo leer desde aquí: comprobarlo en Authentication → Rate Limits (la documentación se contradice sobre si es editable; si no aparece, `rate_limit_anonymous_users` en la Management API). Con una red de campus (muchos estudiantes tras una misma IP) puede dejar gente sin entrar: subirlo antes de la demo y documentar el valor.

## Pendiente de entorno

- **Supabase**: proyecto `radio` (`xoepecxnhiqytwbmahau`, us-west-2). Migraciones y seed aplicados. Sign-in anónimo activado, confirmación de correo apagada. Falta el Site URL (ver "Para mañana", punto 3).
- **`.env`** (ignorado por git, nunca estuvo en un commit): `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (clave `sb_publishable_…`). `.env.example` tiene solo marcadores. `vercel link` creó además un `.env.local` con un token OIDC; también está ignorado.
- **GitHub**: repo público `cesarau90/radio-campus`, rama `main`. `gh` autenticado como `cesarau90`.
- **Vercel**: CLI 65.11 con sesión `cesarau90`, proyecto `radio-campus` (carpeta `.vercel/`, ignorada). `vercel.json` con el rewrite del SPA. El `.gitignore` conserva `.vercel`; se quitó la regla `.env*` que añadió Vercel porque ocultaría `.env.example`.
- **Usuario admin** (para la Fase 7): crearlo en Authentication y luego `insert into public.admins (user_id) select id from auth.users where email = '...';` (este SQL va también en el README).

## Decisiones y avisos para recordar

- Duración: la canción suena `min(duration_sec, max_play_sec)` (0 = completa); la ronda dura eso menos 10 s, mínimo `round_duration_sec`. Para la demo, `max_play_sec = 90` desde `/admin`.
- `no_repeat_minutes = 20` en el seed (con 39 canciones, 60 min agotaría las opciones).
- Las canciones con `theme` (navideñas) solo se ofrecen si su tema está activo (evento o regla).
- Sin lo-fi en el seed: el usuario las agrega desde `/admin`. En el admin, la duración al agregar una canción se obtiene con `getDuration()` del reproductor de YouTube (oEmbed no la da).
- `src/lib/api.ts` (acceso a datos, sin lógica) queda fuera de `src/hooks`; el usuario lo aprobó.
- **QR de `/pantalla`**: en un recuadro de papel claro, de **mínimo 280 px** y con margen (quiet zone).
- Seguridad conocida (va en "Funciones simuladas o limitaciones"): cualquiera con la clave publicable puede llamar `record_play`/`set_phase` y cerrar rondas ya vencidas; `start_round` está protegido (una sola ronda abierta).
- Las rondas de prueba se crean con id fijo y se borran por id (`delete ... where id = '<id>'`); los votos caen en cascada. Nunca un `delete` sin `where`.
- Las pruebas SQL se corren pegando el archivo completo en el SQL Editor (`supabase/tests/*.sql`); la herramienta `execute_sql` rechazó los scripts que crean usuarios de prueba.
- Comandos útiles: `npm run build`, `npm run lint`, `npm run smoke` (13 comprobaciones contra Supabase), `npm run verify:seed` (los 39 IDs de YouTube), `/diagnostico` solo en desarrollo. Detector: `C:\Users\petoa\.claude\skills\impeccable\scripts\impeccable.cmd detect --json src/components src/pages/Votar.tsx`.
- Impeccable avisó que hay una versión nueva (4.9.0); no se actualizó.
