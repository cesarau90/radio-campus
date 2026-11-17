# Estado del proyecto (para retomar)

Última actualización: 2026-11-17. Plan completo: [superpowers/plans/2026-11-13-radio-campus.md](superpowers/plans/2026-11-13-radio-campus.md).

## Dónde vamos

**Fase 5 (`/votar`): hecha, verificada en pantalla y desplegada.** Producción: **https://radio-campus-five.vercel.app** (repo público: https://github.com/cesarau90/radio-campus). Cada push a `main` se publica solo en Vercel (comprobado: el commit `d62d3db` quedó con el estado "Vercel · success" en GitHub, y el deploy nació 36 s después del push).

**Parado a propósito.** El rediseño de `/votar` está implementado y aprobado, **pero sin commit ni push** (todo está en el árbol de trabajo). No se empieza `/pantalla` hasta cerrar los pendientes del rediseño (ver "Pendientes del rediseño (próxima sesión)").

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
| **Rediseño visual** | **implementado y aprobado en `/votar`, sin commit**; faltan 3 pendientes (panel de espera, mensaje del voto, capturas reales de urgente y cerrada); desbloquea la Fase 6 al cerrarse | |
| 6 `/pantalla` | pendiente (bloqueada hasta cerrar el rediseño) | |
| 7 `/admin` CRUDs | pendiente | |
| 8 `/admin` operación | pendiente | |
| 9 Pulido y documentación | pendiente | |

## Rediseño de `/votar` (2026-11-14): qué quedó y qué falta

Dirección: cartel + app de música, oscuro, naranja como único acento. Tokens en **un solo archivo**: `src/styles/tokens.css`.

- **Portadas sin columna nueva en `songs`** (decisión tomada): `coverUrl(youtube_id)` → `https://img.youtube.com/vi/<ID>/hqdefault.jpg` (`src/lib/cover.ts`), con respaldo en `onError` (bloque con el título) y detección de la imagen gris de 120×90 que YouTube devuelve sin error. `hqdefault` trae barras negras: se recortan con `object-fit: cover` (tarjeta) y con un acercamiento (`--cover-zoom-square`) en miniaturas cuadradas.
- **"Sonando ahora"** sale de `playback_state.current_song_id` (ya lo carga `useLiveState`); se oculta si es `null`. Hoy es `null` porque lo escribe `/pantalla` (Fase 6). Verificado inyectando el dato solo en el navegador (la base no se tocó).
- **Tipografía:** Bricolage Grotesque (interfaz), DM Mono (datos) y **DM Serif Display** solo para el título principal.
- **Paleta** (la del usuario): fondo `#160F0C`, tarjetas `#241A16`, texto `#F7EADB`, secundario `#BDA99B`, naranja `#FF6B00`, interacción `#FF8A24`, borde `#55443C`.
- **Contraste medido (≥ 4,5:1):** texto sobre la foto, con la capa oscura al 40 %, entre 6,5:1 (contador naranja) y 16,3:1; botón de confirmar blanco sobre `#CC4A00` = 4,62:1 (blanco sobre `#FF6B00` daría 2,86:1 y no pasa; por eso el relleno del botón usa el naranja profundo `--color-signal-deep`); botón desactivado 7,54:1 (se le dio fondo sólido: transparente daba 2,2:1 sobre la mesa clara de la foto); pastilla EN VIVO 6,87:1; tarjetas: título 14,4:1, artista y género 7,5:1.
- **Layout:** celular = tarjetas altas que reparten la altura (tope 21 rem) y botón abajo, con scroll si no cabe; escritorio (≥ 900 px) = contenedor de 56 rem, dos columnas, botón centrado sin barra fija.
- **Sin voto, sin conexión, voto registrado, ya votaste y "Sonando ahora"** capturados a 390×844, 320×568 y 1920×880 (más 1366×768 con elección), en `docs/evidencias/fase5/rediseno/`. Las iteraciones anteriores están en `rediseno/iteraciones/` (nada se borró).
- **"Ronda cerrada" y "Aún no hay votación" rediseñados** (ganadora con portada y marca, recuento A/B con barras, panel de mensajes; dial animado y, si hay dato, "Sonando ahora"). Probados con datos inyectados solo en el navegador (`*-inyectada*.png`, 390×844 y 1920×880). `PRODUCT.md` y el brief de la superficie ya están actualizados.
- **Falta capturar con datos reales:** contador urgente (≤ 10 s) y "Ronda cerrada" (ver punto 3 de "Pendientes del rediseño"). Después: repetir la verificación de foco y reduced-motion y tomar la decisión sobre `DESIGN.md`.

### Créditos para el README (Fase 9)

- **Imagen de fondo del estudio de radio:** **generada con IA** (la aportó el usuario; sin texto ni interfaz). Archivos: `public/fondo-estudio.webp` (1672×941, ~80 KB) y `public/fondo-estudio-movil.webp` (recorte vertical 772×941, ~42 KB). Anotar en "Créditos" que es una imagen generada con IA.
- **Portadas de las canciones:** miniaturas públicas de YouTube (`img.youtube.com`); derechos de sus titulares.
- **Fuentes:** Bricolage Grotesque, DM Mono y DM Serif Display, de Google Fonts (licencia OFL).

### Ronda de prueba `…a8`: ya no existe

La ronda `00000000-0000-4000-8000-0000000000a8` y sus votos de prueba se eliminaron con el bloque de limpieza (el usuario reportó `rounds` = 0 y `votes` = 0; sin verificar desde aquí). `_close_round(id, true)` solo escribe en `rounds` y ningún trigger ni cron crea la ronda siguiente.

## Cierre del rediseño (2026-11-17)

- **Pendiente 1 hecho:** panel de espera con borde de 1 px (`--color-line`), `width: calc(100% - 2 * var(--space-4))` y `--radius-lg`. Contraste medido contra el píxel más claro de la foto: texto 11,20:1, secundario 5,88:1 (borde 3,47:1 contra la foto). Dial: `margin-bottom: calc(var(--dial-size) * 0.35)` deja 12 px libres entre el anillo (escala 1,7) y el panel. Capturas `*-espera-borde.png` y `*-espera-dial.png` (390 y 1920).
- **Pendiente 2 hecho (en código):** los 3 mensajes del voto y el de empate están bien. Nota: en empate, quien votó por la ganadora ve "Tu voto ayudó a ganar." junto al texto del desempate; se dejó así.
- **Pendiente 3:** ronda `…a9` **ya usada y limpiada** (rounds 0, votes 0). **El siguiente id de prueba es `…b0`.** Ronda cerrada real capturada (`*-cerrada-real.png`, 390 y 1920; caso "Tu voto ayudó a ganar."). **Contador urgente real: omitido por decisión**; se queda la captura inyectada. Los casos "votó por la otra" y "no votó" siguen sin captura real.
- **Pendiente 4 hecho:** commit `e36a851` en `main`; Vercel "success" y producción sirve los mismos `index-*.js/css` que el build local. Captura: `produccion-390x844-espera.png`. Fase 6 desbloqueada.

## Pendientes del rediseño (histórico; 1–3 cerrados arriba)

Orden: 1 → 2 → 3 → 4. Hasta cerrar el 4 no se empieza la Fase 6.

1. **Panel de "Aún no hay votación"** (`.vt-wait-panel` en `votar.css`, `WaitingView.tsx`): que tenga esquinas redondeadas visibles, quede centrado con margen a los lados y no parezca una caja cortada. Hoy es un fondo translúcido (`--panel-shade`, 78 %) sin borde, por lo que sus bordes casi no se distinguen de la foto y, en escritorio, se ve como un rectángulo recortado. Propuesta: borde de 1 px con `--color-line`, `width: calc(100% - 2 * var(--space-4))` y radio `--radius-lg` (ya tiene), manteniendo el contraste medido (≥ 7,2:1 en 8 tamaños; volver a medirlo). Capturar de nuevo `*-espera-inyectada*.png` a 390 y 1920.
2. **Mensaje del voto en "Ronda cerrada"** (`ResultView.tsx`, función `myVoteLine`). **Revisado en el código el 2026-11-14:** ya distingue los casos: sin voto → "No votaste en esta ronda."; voto por la ganadora → "Tu voto ayudó a ganar."; voto por la otra → "Esta vez ganó la otra opción."; sin ganadora identificable → "Gracias por votar." Falta **probarlo en pantalla** con los tres casos (votó por la ganadora, votó por la otra, no votó) y cubrir el empate y el "sin votos". Caso a decidir: en un empate resuelto por la regla de desempate, quien votó por la que ganó ve "Tu voto ayudó a ganar."; es correcto pero conviene revisar si el texto de empate lo aclara.
3. **Capturas reales de contador urgente (≤ 10 s) y ronda cerrada** con una ronda nueva `…a9`. SQL en bloques separados (los corre el usuario en el SQL Editor; `execute_sql` los rechaza):

   **Bloque 1: INSERT** (45 min de vida; `…a9` con las mismas canciones de prueba que `…a8`).
   ```sql
   insert into public.rounds (id, option_a, option_b, ends_at)
   values (
     '00000000-0000-4000-8000-0000000000a9',
     (select id from public.songs where youtube_id = 'JGwWNGJdvx8'),  -- A: Shape of You
     (select id from public.songs where youtube_id = 'QJ5DOWPGxwg'),  -- B: título largo
     now() + interval '45 minutes'
   );

   -- Comprobación: 1 fila con status 'open'.
   select id, status, ends_at from public.rounds
   where id = '00000000-0000-4000-8000-0000000000a9';
   ```

   **Bloque 2: 2b** (acorta la ronda a 20 s; pg_cron la cierra en ≤ 1 min, con la ganadora que haya votado la mayoría). Correrlo **después** de votar desde el navegador, para que la ronda cierre con `resolution = 'votos'`.
   ```sql
   update public.rounds
   set ends_at = now() + interval '20 seconds'
   where id = '00000000-0000-4000-8000-0000000000a9' and status = 'open';
   ```

   **Bloque 3: LIMPIEZA** (solo por ese id; nada de `delete` sueltos).
   ```sql
   delete from public.votes  where round_id = '00000000-0000-4000-8000-0000000000a9';
   delete from public.rounds where id       = '00000000-0000-4000-8000-0000000000a9';

   -- Comprobación: ambos deben dar 0.
   select (select count(*) from public.rounds) as rounds,
          (select count(*) from public.votes)  as votes;
   ```

   Pasos: correr el bloque 1 → abrir `/votar`, votar con una sesión y dejar la pestaña abierta → correr el bloque 2 → capturar el contador cuando marque ≤ 00:10 y, en menos de un minuto, la ronda cerrada (390×844 y 1920×880) → correr el bloque 3. Reutilizar una sola sesión para no chocar con el rate limit de sign-ins anónimos. Si hace falta cerrar a mano: `select public._close_round('00000000-0000-4000-8000-0000000000a9', true);`.
4. **Commit y push del rediseño, solo con el OK del usuario**, y después la **ronda real con 2–3 celulares** en producción (ver "Para mañana", punto 1) y luego la **Fase 6**. El árbol de trabajo tiene archivos modificados (`index.html`, `src/index.css`, `src/main.tsx`, `src/hooks/useVotar.ts`, `src/components/*`, `PRODUCT.md`, `docs/ESTADO.md`, el brief) y nuevos (`src/styles/`, `src/lib/{cover,time,votes}.ts`, `src/hooks/useCover.ts`, `Cover`/`LiveBadge`/`NowPlaying`/`WaitingView`, `radio.css`, `public/fondo-estudio*.webp`, `docs/evidencias/fase5/rediseno/`). Antes del commit: `npm run build` y `npm run lint` (pasaban al cierre de hoy). El commit lleva el pie de coautoría de Claude.

Notas de la sesión: el servidor de desarrollo local (puerto 5199) quedó detenido; `.playwright-mcp/` ya está en `.gitignore`.

## Para mañana (en este orden)

1. **Ronda real con 2–3 celulares** en https://radio-campus-five.vercel.app/votar, como evidencia de pruebas.
   - El usuario crea la ronda con un `insert` en `public.rounds` (`option_a`, `option_b`, `ends_at`) usando **id fijo** y por separado de la limpieza. Las canciones de prueba: `JGwWNGJdvx8` (A) y `QJ5DOWPGxwg` (B, título largo).
   - Votar desde los celulares, cerrar con `select public._close_round('<id>', true);`, capturar la pantalla de cada celular (también la vista `closed`) y guardarlas en `docs/evidencias/` (carpeta nueva, p. ej. `fase5-ronda-real/`).
   - Limpiar **por id**: `delete from public.rounds where id = '<id>';` y comprobar `count(*)` de `rounds` y `votes` (debe dar 0 y 0).
   - La evidencia debe tomarse con el diseño **rediseñado** (ya commiteado).
   - Para no chocar con el rate limit de sign-ins anónimos (30/hora por IP por defecto), usar datos móviles en algún celular si la Wi-Fi ya se usó mucho.
2. **Rediseño visual: hecho** (2026-11-14), falta cerrar sus pendientes y hacer el commit (ver "Pendientes del rediseño (próxima sesión)"). Decisiones: portadas derivadas de `youtube_id`, sin columna nueva; si una no carga se muestra un bloque con el título; las canciones `restricted` también tienen portada (es solo la miniatura pública).
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

**Se volvió a alcanzar el 2026-11-14** (`Request rate limit reached`) tras un recorrido de capturas con ~25 sesiones nuevas en menos de una hora desde una sola IP. Se recuperó en pocos minutos. Para pruebas automatizadas: reutilizar una sesión en vez de limpiar el almacenamiento en cada paso.

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
