# Estado del proyecto (para retomar)

Última actualización: 2026-11-17, al cierre del día (Fase 10 hecha y en `main`). Plan completo: [superpowers/plans/2026-11-13-radio-campus.md](superpowers/plans/2026-11-13-radio-campus.md).

## Fase 12 (2026-11-19): audio MP3 opcional en anuncios ✅

- Migración `20261119000100_announcement_audio.sql` (`audio_url text`), ya corrida en Supabase. Admin → Anuncios: campo "Audio MP3 (opcional)" (URL o `/audio/x.mp3`), reproductor de prueba y chip "MP3". `/pantalla` reproduce el MP3 con la música atenuada (`useAnnouncementAudio`, topes de seguridad de 10 s para arrancar y duración + 5 s) y si falla o no hay, usa la voz del navegador. Los MP3 van en `public/audio/` (pendiente: meter el de ElevenLabs). Sin probar en vivo. ElevenLabs agregado a `docs/servicios-y-costos.md`.

## Fase 11 (2026-11-19): pulido del admin ✅ (hecha, falta correr el SQL de las canciones)

- **Hook `useEditFocus`** ([src/hooks/useEditFocus.ts](../src/hooks/useEditFocus.ts)): al abrir Editar/Agregar en Canciones, Reglas, Eventos y Anuncios hace scroll suave al formulario, enfoca el primer campo y lo resalta (`ad-flash`); al guardar o cancelar regresa a la fila (`data-row-id`). Playlists no tiene formulario. Probado en localhost editando y cancelando en las 4 pestañas.
- **Aurora** en `/admin` y su login (solo CSS, `.ad-aurora` en `admin.css`; estática con reduced-motion). Capturas en `docs/evidencias/fase11/`.
- **Seed de 21 canciones pendiente de correr por el dueño** en el SQL Editor: [supabase/seed_canciones_extra.sql](../supabase/seed_canciones_extra.sql) (idempotente; el SELECT final debe dar 60). IDs verificados con oEmbed; ver notas del archivo (4 subidas por canales no oficiales; reguetón revisado).

## Dónde vamos

**Fases 0 a 10 hechas, desplegadas y verificadas.** La Fase 10 ("requisitos faltantes" de la auditoría: reglas, playlists, respaldo, tableta, estadísticas y tarjeta "Siguiente") se probó en vivo con sesión de admin y se fusionó a `main` (commits `2a7f6a4` y `41b1d43`); Vercel en "success" y `/pantalla`, `/votar` y `/admin` responden 200 en producción. Producción: **https://radio-campus-five.vercel.app** (repo público: https://github.com/cesarau90/radio-campus).

**Lo que falta:** solo la limpieza de datos de prueba y la checklist de "Antes de la demo". La tarjeta "Siguiente" aún no se ha visto con una ronda real.

| Fase | Estado | Commit |
|---|---|---|
| 0 Cimientos | hecha | `5d36cf1` |
| 1 Esquema y RLS | hecha, probada | `c05f113` |
| 2 Lógica SQL | hecha, probada (53/53 en `round_logic.sql`) | `0460f1c` |
| 3 Seed verificado | hecha | `cf60093` |
| 4 Núcleo del cliente | hecha, probada | `28fde37` |
| 5 `/votar` + deploy | hecha, verificada en pantalla, desplegada | `08886ed`, `d62d3db` |
| Rediseño visual de `/votar` | hecho y desplegado | `e36a851` |
| 6 `/pantalla` | hecha, verificada en vivo, desplegada | `47b89f9` |
| 7 `/admin` CRUDs | hecha, verificada con sesión de admin, desplegada | `c18ee98` |
| 8 `/admin` monitor, controles y simular contexto | hecha, criterio de contexto cumplido, desplegada | `58654f1` |
| Voz (una sola ruta, dos idiomas) | hecha, desplegada | `f9ee56a` |
| 9 Pulido y documentación (+ voces de mujer y heurística de idioma) | hecha, desplegada | `b3f9d98` |
| Arreglo del voto en Safari (`cast_vote` 401) | hecho, desplegado, verificado en un iPhone real | `6e75d06` |
| Evidencias de la ronda real + portada durante anuncios | hecho, desplegado | `e757429` |
| 10 Requisitos faltantes | hecha, probada en vivo, fusionada a `main` y desplegada ✅ | `2a7f6a4`, `41b1d43` |

## Lo hecho hoy (2026-11-17)

- **Fase 6** (`/pantalla`: director, YouTube, voz, clima, ticker, QR, conexión), **Fase 7** (CRUDs del admin, verificados con sesión real), **Fase 8** (monitor, controles y simulador de contexto; migración `20261117000100_admin_preview_pick.sql`, ya aplicada) y **Fase 9** (pulido, README, arquitectura con 4 diagramas Mermaid, manual de admin, costos, índice de evidencias, criterios de aceptación), todas desplegadas.
- **Voz:** una sola ruta (`useSpeech`), dos idiomas con heurística (`guessLang`), voces de mujer (Dalia en español; Jenny, Aria o Ava en inglés); espera a `voiceschanged`; botones de prueba en `/pantalla?debug=1`.
- **Video de `/pantalla` sin la interfaz de YouTube** (iframe recortado, portada encima, destapa a los 4 s) y portada en lugar del video durante anuncios y al terminar la canción (esto último solo compila; no se probó en vivo).
- **Bug de Safari** encontrado y arreglado (causa reproducida en WebKit); verificado después con un iPhone real.
- **Ronda real en producción** con una PC y un iPhone (Safari desde la cámara): votos, cierre con 2 votos y anuncio entre canciones; 3 evidencias.
- **Auditoría** contra los requisitos del profe (tabla abajo). Sin cambios de código por la auditoría.

## Auditoría contra los requisitos del profe (2026-11-17)

✅ cumple · ⚠️ a medias · ❌ falta.

| # | Requisito | Estado | Dónde está / qué falta | Estimación |
|---|---|---|---|---|
| 1 | Reglas contextuales y prioridades desde el panel | ❌ | Solo en la base (`context_rules`, 7 reglas del seed); sin UI ni funciones de acceso a datos. Las políticas RLS ya dejan escribir al admin | 3–4 h |
| 2 | Playlists y selección de respaldo | ❌ | La tabla y la playlist `respaldo` existen, sin UI; la otra playlist del seed no la usa el algoritmo | 3–4 h |
| 3 | Supervisar la cola de reproducción | ⚠️ | Monitor: qué suena, ronda abierta con las 2 opciones, ganadora pendiente, últimas 15 reproducciones, controles. No hay una "cola" explícita (lo siguiente se decide por voto) | 1–1,5 h |
| 4 | Estadísticas, historial y resultados | ⚠️ | Hay historial (15) y gráfica de votos (10 rondas); faltan las estadísticas de participación | 3–4 h |
| 5 | Admin usable en tableta (768–1024) | ⚠️ | Medido en las 6 pestañas: sin desborde de página; pero a 768 px las acciones de Canciones se cortan a la derecha y las casillas miden 28 px | ~1 h |
| 6 | `.env.example` sin secretos | ✅ | Solo marcadores; `.env` ignorado; el historial de git no contiene la clave real ni claves secretas | — |
| 7 | README (instalación, local, despliegue, arquitectura, BD, servicios) | ✅ | `README.md`, `docs/arquitectura.md`, `docs/servicios-y-costos.md` | — |
| 8 | Crear la base (migraciones en orden + seed) | ✅ | README paso 3 y tabla de migraciones en `docs/arquitectura.md` | — |
| 9 | Respaldo de configuración y restablecer el servicio | ❌ | No hay exportación ni procedimiento; el seed sobrescribe los ajustes | ~2 h |
| 10 | Diagrama de flujo | ✅ | `docs/arquitectura.md`: componentes, secuencia de una ronda y estados de `/pantalla` (el flujo de decisión del algoritmo no está: 30 min, opcional) | — |
| 11 | Funciones simuladas o pendientes | ✅ | README "Funciones simuladas o limitaciones" y "Mejoras futuras" | — |
| 12 | Etiquetas por canción (género, energía, ambiente, temática, restricciones) | ✅ | Tabla `songs` y `/admin → Canciones` | — |

Total aproximado de lo que falta: 13–16 h. Orden sugerido: 1, 2 y 9 (los más claros frente al enunciado), luego 5, 4 y 3.

## Fase 10: requisitos faltantes ✅ (hecha; lo de abajo es el plan original)

**Resultado (2026-11-17):** Reglas, Playlists y Respaldo probados en vivo (regla restaurada a 2–4, respaldo regresado a `respaldo`, reimport sin duplicados: 7 reglas, 2 eventos, 1 anuncio, 2 playlists, 15 canciones antes y después); tableta a 768×1024 sin desborde en las 7 pestañas medidas y casillas de 44 px; estadísticas y tarjeta "Siguiente" en el Monitor; manual y README al día. Capturas en `docs/evidencias/fase10/`.

Versiones sencillas, reutilizando los componentes del admin. **Estado real del árbol de trabajo (sin commit):** compila (`npm run build` y `npm run lint` pasan), **nada de esto está probado en vivo** y **no se ha subido a `main`** a propósito.

| Punto | Qué se pidió | Estado |
|---|---|---|
| 1. Pestaña "Reglas" | Tabla de `context_rules` con crear, editar, activar/desactivar y borrar (con confirmación), todos los campos, prioridad editable, texto "mayor prioridad gana" (Exámenes sobre horario y temperatura). Probar: cambiar una regla y ver en "Simular contexto" que cambian las opciones | Código escrito, sin probar: `src/types/rule.ts`, funciones en `src/lib/api.ts` (`fetchRules`, `insertRule`, `updateRule`, `deleteRule`), `src/hooks/useAdminRules.ts`, `src/components/RulesPanel.tsx`; pestaña "Reglas" ya conectada en `useAdmin.ts` y `AdminView.tsx` |
| 2. Pestaña "Playlists" | Ver playlists, agregar o quitar canciones (buscador) y marcar la de respaldo; sin enlazarlas a las reglas | Código escrito, sin probar: `useAdminPlaylists.ts`, `PlaylistsPanel.tsx`, `fetchPlaylists`, `fetchPlaylistLinks`, `addSongToPlaylist`, `removeSongFromPlaylist`, `setFallbackPlaylist` (apaga la anterior y enciende la nueva por el índice único), `insertPlaylist`, `clearPlaylistSongs`; pestaña conectada |
| 3. Respaldo en Configuración | "Exportar respaldo" (JSON con ajustes, reglas, eventos, anuncios y playlists) e "Importar respaldo" con confirmación; sección "Respaldo y restablecer el servicio" en `docs/manual-admin.md` | Código escrito, sin probar: `src/lib/backup.ts` (exporta, valida, resume y restaura **sin borrar**: sobrescribe por nombre/texto y crea lo que falta; las canciones de las playlists van por `youtube_id`), `src/lib/download.ts`, `useAdminBackup.ts`, `BackupPanel.tsx` (conectado en la pestaña Configuración). **Falta la sección del manual** |
| 4. Tableta | A 768 px las acciones de Canciones bajan de renglón (o menú) y casillas de 44 px | **No aplicado.** El parche (media query ≤1100 px en `admin.css` y token `--check-tap: 2.75rem`) estaba dentro del comando que falló |
| 5. Estadísticas en Monitor | Tarjetas: total de rondas, total de votos, promedio por ronda, rondas sin votos, empates y top 5 de canciones más votadas; sin filtro de fechas | Solo `src/lib/stats.ts` (`computeStats`, función pura). `fetchRoundStatsRows` ya está en `api.ts`, pero **falta conectarla** en `useAdminMonitor.ts` y mostrar las tarjetas en `MonitorPanel.tsx` |
| 6. Tarjeta "Siguiente" | La ganadora parcial de la ronda abierta o "se decide por voto" | **No empezado** (diseño: ronda abierta → quién va ganando o "se decide por voto"/empate parcial; ronda cerrada → la ganadora que sigue) |
| Docs | README (quitar reglas y playlists de "Mejoras futuras"), `docs/pruebas.md`, `docs/manual-admin.md`, índice y capturas en `docs/evidencias/fase10/` | **Pendiente** |

**Archivos del trabajo en curso (sin commit):** modificados `src/components/AdminView.tsx`, `src/components/admin.css`, `src/hooks/useAdmin.ts`, `src/hooks/useAdminSongs.ts` (expone `all`), `src/lib/api.ts`, `src/types/index.ts`; nuevos `src/components/{BackupPanel,PlaylistsPanel,RulesPanel}.tsx`, `src/hooks/{useAdminBackup,useAdminPlaylists,useAdminRules}.ts`, `src/lib/{backup,download,stats}.ts`, `src/types/rule.ts`.

### Siguiente paso exacto

1. `git status` para ver el trabajo en curso (no se perdió nada) y levantar `npm run dev` (puerto 5199). La sesión de admin de Playwright sigue iniciada en `localhost:5199`; si no, entrar con la cuenta de pruebas.
2. **Probar lo ya escrito, con sesión de admin, antes de seguir:** (a) pestaña **Reglas**: editar la regla "Tarde y noche (relajada)" a energía 1–1, mirar en **Simular contexto** ("Madrugada tranquila") que cambian las opciones, y **restaurar** el valor original 2–4; probar también la prioridad de "Exámenes (instrumental)" (100) bajándola por debajo de 20 y volviéndola a 100; (b) pestaña **Playlists**: agregar y quitar una canción de `respaldo` y cambiar el respaldo a otra playlist y regresarlo; (c) **Configuración → Respaldo**: exportar, importar el mismo archivo (debe actualizar sin duplicar) y un archivo con una prioridad cambiada para ver que se restaura. Todo lo que se cree debe llevar "PRUEBA" y se limpia por id.
3. **Aplicar los puntos 4, 5 y 6** (CSS de tableta y token; conectar `stats`/`top`/`next` en `useAdminMonitor.ts`; tarjetas en `MonitorPanel.tsx`) y probar a 768×1024 y en el Monitor con datos.
4. Docs: README, `docs/pruebas.md`, `docs/manual-admin.md` (nueva sección "Respaldo y restablecer el servicio": proyecto pausado → reactivar en Supabase; recargar `/pantalla`; importar el respaldo; reaplicar migraciones), índice de evidencias y capturas en `docs/evidencias/fase10/`.
5. `npm run build` + `npm run lint`, pedir un solo OK y hacer un único commit + push de la Fase 10.

## Bug del iPhone con Safari: "permission denied for function cast_vote" (2026-11-17)

- **Síntoma (logs de Supabase, iPhone con Safari, producción):** `POST /auth/v1/signup` → 200 y, 11 s después, `POST /rest/v1/rpc/cast_vote` → **401, 42501 "permission denied for function cast_vote"** (4 veces). En Chromium/Playwright funcionaba.
- **Causa exacta (reproducida):** `supabase-js` pide el token con `auth.getSession()` y, **si no devuelve sesión en ese momento, usa la clave publicable** (`_getAccessToken` → `supabaseKey`), es decir, la llamada sale como rol `anon`, sin avisar. `cast_vote` solo está concedida a `authenticated`, por eso 401/42501. Se reprodujo en WebKit (iPhone 13 emulado) quitando de `localStorage` la clave de la sesión **después** de iniciar sesión: `cast_vote` → `HTTP 401 · 42501 · permission denied for function cast_vote`, idéntico al log. Si `localStorage` empieza a lanzar `SecurityError`, el cliente ni llega a enviar la petición. **Lo que no se pudo reproducir** es *por qué* el iPhone perdió la sesión (WebKit emulado conserva la sesión; un reloj desfasado ±2 h tampoco lo provoca: la librería se recupera con un refresh). Lo más probable en Safari real es la purga o el bloqueo del almacenamiento (prevención de rastreo, modo privado, Bloqueo de contenido/Lockdown); no está confirmado.
- **Arreglo (sin darle permiso a `anon` sobre `cast_vote`):**
  - `src/lib/safeStorage.ts` + `src/lib/supabase.ts`: el cliente guarda la sesión en `localStorage` **y en memoria** (nunca lanza errores), con `persistSession` y `autoRefreshToken` explícitos y sin cabecera `Authorization` global.
  - `src/lib/session.ts`: `createAnonymousSession()` crea la sesión y **confirma con `getSession()`** que quedó guardada (si no, error claro); `ensureSession()` la garantiza antes de llamar.
  - `castVote` (en `src/lib/api.ts`): `await ensureSession()` antes del RPC; si responde **401/42501**, rehace la sesión anónima y **reintenta una vez**. `fetchMyVote` también confirma la sesión (sin sesión, RLS devolvería "sin voto" sin error).
  - `useAnonymousSession`: la pantalla no queda lista para votar hasta que la sesión está confirmada; si el navegador no puede conservarla, muestra "Este navegador no deja guardar tu sesión (¿modo privado o almacenamiento bloqueado?)…".
  - `src/lib/errors.ts`: `ApiError` (con código y estado HTTP), `SessionError` y mensajes por causa: **401/42501 ya no se muestra como "sin conexión"** ("No pudimos verificar tu sesión en este navegador… Recarga la página…"); sin red → "Revisa tu conexión"; otro error → "No se pudo registrar tu voto. Inténtalo otra vez".
- **Prueba (WebKit/iPhone 13, `castVote` real, sin escribir datos: ronda inexistente → `not_found` si va autenticado):** normal OK; clave de sesión borrada de `localStorage` OK; `localStorage` lanzando `SecurityError` OK; sesión perdida por completo (nueva sesión anónima) OK; servidor responde 401/42501 a la primera llamada → reintento con sesión nueva OK. **Antes del arreglo**, el segundo caso daba 401/42501.
- **Límites:** (1) rehacer la sesión anónima crea otra identidad: si alguien ya había votado con la anterior y la perdió, podría votar otra vez (límite conocido del voto anónimo). (2) No se probó en un iPhone real; **antes de la demo, votar desde un iPhone con Safari** (y, si falla, abrir la consola/`Develop` o mirar de nuevo los logs de la API). (3) En desarrollo React crea la sesión dos veces (StrictMode); en producción es una. **Verificado en un iPhone real el 2026-11-17** (Safari abierto desde la cámara): voto registrado; evidencia en `docs/evidencias/demo/`.

## Fase 9 (pulido y documentación): hecha y desplegada, commit `b3f9d98` (2026-11-17)

- **Bloque 1, pulido (hecho, verificado en vivo; capturas en `docs/evidencias/fase9/`):** "Borrar" con borde de peligro y confirmación ("Sí, borrar" / "No"); acciones de la tabla de canciones en un solo renglón; configuración en 2 columnas en escritorio; `/pantalla` sin hueco entre las opciones y el QR (el bloque se centra; en 1366×768 sigue sin scroll); `/votar` ya no parpadea al recargar con el voto emitido: muestra "Sintonizando…" hasta saber si ya votaste y la secuencia medida es Sintonizando → Voto registrado, sin pasar por las opciones activas.
- **Bloque 2, documentación (escrita):** `README.md` (instalación, uso, limitaciones, créditos, mejoras futuras), `docs/arquitectura.md` (diagramas Mermaid de arquitectura, ronda, fases y base de datos), `docs/manual-admin.md` (sin contraseñas), `docs/servicios-y-costos.md`, `docs/evidencias/README.md` (índice) y la tabla de criterios de aceptación al inicio de `docs/pruebas.md`.
- **Interfaz de YouTube oculta (2026-11-17, verificado en vivo, capturas `fase9/pantalla-*.png` y `pantalla-1920x1080-inicio-video.png`):** el iframe es 1,25 veces más grande que el recuadro y va centrado (token `--video-zoom`), así el recuadro recorta la barra del título; la **portada va encima** del video y se desvanece solo cuando el reproductor está en PLAYING (arranque, buffering, pausa y final la muestran de nuevo). YouTube dibuja un ícono de pausa al centro en los primeros segundos, así que el video se destapa **4 s después** de entrar en PLAYING (`REVEAL_MS`); medido: la portada se oculta a los ~3 s de cargar y el primer cuadro destapado sale limpio. Sin scroll en 1920×1080 y 1366×768.
- **Bloque 3:** checklist "Antes de la demo" (más abajo).
- **Ronda real en producción: HECHA (2026-11-17):** votos desde PC e iPhone (Safari), ronda cerrada con 2 votos y anuncio entre canciones; 3 evidencias en `docs/evidencias/demo/`, indexadas y marcadas como cumplidas en `docs/pruebas.md` (criterios 13, 14 y 15).
- **Cambio chico (2026-11-17):** durante un anuncio y cuando el tiempo de la canción ya terminó, `/pantalla` muestra la portada en lugar del video (antes se veía el último cuadro congelado, visible en la evidencia). Compilado; no se probó en vivo porque requiere un anuncio real en pantalla.
- **Pendiente tuyo:** limpiar los datos de prueba (rondas, historial, votos).

## Voz de la radio (2026-11-17): una sola ruta, dos idiomas (ACTUALIZADO 2026-11-19: se probó Jorge, se quedó Dalia)

- **2026-11-19: se probó Jorge (es-MX) en Edge, pero se regresó a Dalia (mujer) porque suena mejor** (revert de `e41cec2`: `speech.ts`, `useSpeech.ts`, README y manual quedaron como antes). Azure Speech se descartó por riesgo antes de la demo; ElevenLabs/Antonio también se canceló (el soporte de MP3 por anuncio sigue en el código, opcional). La voz vigente es la que se describe abajo.

- **Una sola función:** `useSpeech.speak` es el único lugar que crea `SpeechSynthesisUtterance` (`/pantalla`, "Probar voz" del admin y el desbloqueo con el clic). En la primera frase de la sesión, si todavía no hay una voz Natural en español, espera hasta 2,5 s a que Edge las cargue, y el utterance de desbloqueo usa la misma voz elegida (silencioso). Commit `f9ee56a`.
- **La voz es Dalia (Edge)** — decisión del usuario (2026-11-17): voces de MUJER. Español: `Dalia` Natural → cualquier es-MX Natural de mujer → cualquier es-MX → es-US → cualquier es. Inglés (títulos y artistas): `Jenny`, `Aria` o `Ava` Natural (en ese orden) → cualquier en-US Natural de mujer → cualquier en-US → cualquier en. "De mujer" se decide descartando nombres masculinos conocidos (`MALE_NAME` en `src/lib/speech.ts`). Probado con listas de voces simuladas (todas las prioridades); el audio real solo se oye en Edge. Antes se había configurado Jorge/Andrew (voces de hombre) y el usuario lo cambió.
- **Dos idiomas:** `src/lib/speech.ts` (puro): `guessLang` (género latino/pop latino/urbano/reggaetón/salsa/bachata/cumbia/banda/regional/norteño/mariachi/ranchera/corrido/bolero/trova, acentos o ñ, una palabra común en español —de, la, el, los, mi, tu, te, que, amor, corazón, cielito, volver…— o un diminutivo -ito/-ita → español; si no, inglés) y `nowPlayingSegments` / `newRoundSegments` / `roundResultSegments` parten el anuncio en tramos: lo fijo en español y el título/artista con la voz del idioma de la canción.
- **Heurística sobre el seed (2026-11-17):** el acento o la ñ solo cuentan **en el título** (no en el artista: Michael Bublé, Frédéric Chopin), y se agregaron "feliz" y "navidad" a las palabras en español. "Despacito" estaba como `pop` (no `latino`); lo arregla el diminutivo -ito. Comprobado: "It's Beginning to Look a Lot Like Christmas" → **inglés**, "Feliz Navidad" → **español**, "Despacito" → español. De las 39 canciones, **26 quedan en inglés** y 13 en español: las 24 anteriores (Shape of You, Uptown Funk, Hymn for the Weekend, All of Me, Happy, Waka Waka, Bohemian Rhapsody, Smells Like Teen Spirit, Sweet Child O' Mine, Thunderstruck, Livin' on a Prayer, Wake Me Up, Levels, This Is What You Came For, One More Time, Faded, Canon in D, River Flows in You, Experience, Nuvole Bianche, All I Want for Christmas Is You, Last Christmas, Santa Tell Me, Rockin' Around the Christmas Tree) más "It's Beginning to Look a Lot Like Christmas" y "Nocturne Op. 9 No. 2" (su único acento estaba en el artista). Las clásicas francesas se dejaron como están: "Clair de Lune" (palabra "de") y "Gymnopédie No. 1" (acento en el título) en español.
- **Debug:** `/pantalla?debug=1` tiene "Probar voz" y "Probar canción en inglés" ("Ahora suena Shape of You de Ed Sheeran"). En consola: `[voz] voces es-*`, `[voz] voces en-*` y `[voz] elegidas → es: … | en: …`.

## Fase 8 (`/admin` monitor, controles y simular contexto): hecha y desplegada, commit `58654f1` (2026-11-17)

- **Migración nueva (ya aplicada por el usuario en el SQL Editor):** `supabase/migrations/20261117000100_admin_preview_pick.sql`, función `admin_preview_pick(hora, temp, tipo de evento, tema)`: solo lectura, solo `is_admin()`, no crea rondas; devuelve contexto, cómo se eligió (reglas, tamaño del conjunto elegible, respaldo) y las 2 canciones. Quien monte la base desde cero debe correrla después de las otras 5 migraciones.
- **Qué hay en `/admin`:** pestaña **Monitor** (`useAdminMonitor`, `MonitorPanel`): qué suena, ronda en vivo con votos A/B y cuenta regresiva, contexto con el que se creó la ronda (marca "simulado"), gráfica de votos de las últimas 10 rondas, últimas 15 reproducciones, y controles **pausar/reanudar**, **saltar canción** (`skip_requested_at`) y **cerrar la ronda ahora** (con confirmación). Pestaña **Simular contexto** (`useAdminSimulator`, `SimulatorPanel`): 6 escenarios de ejemplo, escenario propio (hora, temperatura, evento, tema), comparación de los últimos 6 escenarios, **Aplicar a la radio** (guarda `settings.context_override`) y **Quitar simulación**; aviso "Simulación activa" en ambas pestañas.
- **Criterio "un cambio de contexto cambia las opciones": cumplido, con evidencia** (`docs/evidencias/fase8/`):
  - Vista previa (`simular-comparacion-completa-1366.png`): Madrugada → La Bikina / La Puerta Negra (regional, energía 2–4); Mañana fresca → Experience / Primera Cita (acogedor/calmado); Tarde calurosa → One More Time / This Is What You Came For (electrónica, fresco/alegre, energía 3–5); Exámenes → Nocturne Op. 9 / Clair de Lune (solo instrumental, energía 1–2); Navidad → Feliz Navidad / It's Beginning to Look a Lot Like Christmas (tema navidad); Sin clima → respaldo.
  - **Ronda real:** con la simulación Exámenes (10:00, 24 °C) `/pantalla` creó una ronda con **Nuvole Bianche / Gymnopédie No. 1**; al cambiar a Tarde calurosa, cerrar la ronda y saltar la canción, la siguiente ronda real fue **Hymn for the Weekend / Uptown Funk** (`monitor-ronda1-examenes-*.png`, `monitor-ronda2-calor-*.png`; `context_snapshot` con `overridden`).
  - Pausa: chip "Radio en pausa" en el monitor y `/pantalla` en "Votación en pausa"; al reanudar vuelve (`monitor-pausa-1366x768.png`). Salto: queda "Saltada" en el historial. La simulación se quitó y se confirmó en la base (`context_override` null, `paused` false).
- **Datos de prueba creados por esta verificación** (rondas, historial y `playback_state`; y los de la verificación en producción de `/pantalla`): se limpian por id antes de la ronda con celulares (SQL en la conversación). `settings.skip_requested_at` quedó con un valor de la prueba (inofensivo; el SQL lo limpia).
- **Pendiente para la Fase 9:** el panel Monitor y los demás siguen sin versión de celular pulida; el `/admin` guarda la simulación sin pedir confirmación (avisa con banner).

## Fase 7 (`/admin` CRUDs): hecha y desplegada, commit `c18ee98` (2026-11-17)

- **Commit pendiente:** Fase 6 está en `main` (`47b89f9`, desplegada; `/pantalla` carga en producción con la URL de Vercel en el QR). **Este ESTADO.md va junto con la Fase 7**, no por separado (decisión del usuario).
- **Limpieza de datos de prueba de `/pantalla`: pendiente, se hace antes de la ronda con celulares.** Abrir `/pantalla` (también en producción) escribe en la base real (`rounds`, `play_history`, `playback_state`). Los ids de `play_history` solo los lee el admin; se limpia por rango de hora o con los ids que muestre un `select` previo.
- **Qué hay:** `useAdmin` (hook principal: sesión + pestaña + una sección por hook), `api.ts` con las escrituras (RLS: solo `is_admin()`), `AdminView` con login y 4 pestañas.
  - **Canciones** (`useAdminSongs`, `SongsPanel`): búsqueda y filtros (todas/activas/inactivas/restringidas), alta con enlace o ID → "Comprobar en YouTube" (oEmbed 200 + título/canal + duración con el reproductor oculto `getDuration()`), editar, activar/desactivar, restringir con motivo, borrar con confirmación (si ya salió en una ronda, avisa y sugiere desactivarla).
  - **Eventos y temas** (`useAdminEvents`, `EventsPanel`): nombre, tipo, fechas (hora del campus), tema; estado vigente/próximo/terminado y aviso de cuántas canciones usan el tema.
  - **Anuncios** (`useAdminAnnouncements`, `AnnouncementsPanel`): texto (≤ 280), aprobado y activo (lo único que lee `/pantalla`), fechas, horario, cada N canciones, "Probar voz", borrar.
  - **Configuración** (`useAdminSettings`, `SettingsForm`): `round_duration_sec` (≥ 10), `max_play_sec` (0 = completa), `no_repeat_minutes`, empate, sin votos, pausa y coordenadas, con las mismas validaciones que los `check` de la tabla.
- **Verificado con Playwright en vivo (2026-11-17, sesión de admin real, todo marcado "PRUEBA", capturas a 1366×768 en `docs/evidencias/fase7/`; el login está en `admin-login-1366x768.png`):**
  - **Canciones:** "Comprobar en YouTube" rellenó título, canal y duración (214 s); alta, edición (energía y ánimo) y desactivación funcionan (`admin-canciones-*.png`).
  - **Eventos:** alta con tema, aviso "Ninguna canción tiene este tema todavía", validación de fechas (el botón se deshabilita), estado "Próximo" (`admin-eventos-*.png`).
  - **Anuncios:** Sin aprobar → Sale al aire → Apagado. Con un cliente anónimo (como `/pantalla`) el anuncio solo se vio aprobado **y** activo (0 → 1 → 0) (`admin-anuncios-*.png`).
  - **Configuración (criterio de aceptación):** `no_repeat_minutes` 20 → 27, guardado, **recargado y persiste** (`admin-config-antes/guardado/recargado-*.png`); un valor inválido deshabilita Guardar; se restauró a 20 y se confirmó tras otra recarga (resto intacto: 30 / 0 / 22.2331 / -97.8611).
  - No se probó el botón "Borrar" de la interfaz (la limpieza se hace por SQL por id).
- **Datos de PRUEBA que quedan en la base (limpiar por id):** canción `f62849f9-f806-44ea-bdcc-f2fa61d5c447` (inactiva), evento `5da886aa-a4ad-4a00-9c14-5c60b4d50858` (marzo 2027), anuncio `5bcd7b4c-12c6-45b7-baeb-7c933aa3f5f5` (sin aprobar y apagado).
- **Admin de pruebas:** `admin@radiocampus.test` (creado por el usuario; está en `admins`).
- **Decisiones:** las fechas de eventos/anuncios se escriben en la hora del navegador y se muestran en la del campus (`America/Mexico_City`); `context_override` y `skip_requested_at` quedan para la Fase 8 (operación).

## Fase 6 (`/pantalla`): hecha y desplegada (2026-11-17)

Bloques: 1 núcleo (hecho, sin commit) · 2 YouTube (`useYouTubePlayer`, corte a `max_play_sec` con fade-out, errores a respaldo, pausa/salto) · 3 voz (`useSpeech`, es-MX) · 4 clima + ticker (`useWeather`, temperatura a `start_round`) · 5 cierre (conexión, recarga, capturas, build + lint).

- **Bloque 1:** `usePantalla` (el "director": arranca canción, cierra ronda vencida, mete a la ganadora al terminar la canción, abre la siguiente; cada paso es seguro de repetir y respeta `paused`), `PantallaView`, `QrCard` (280 px, papel claro con margen), `pantalla.css` (solo tokens; tokens nuevos `--space-10/12`, `--cover-xl`, `--qr-size/--qr-pad`), `lib/playback.ts` (`playSeconds`, misma cuenta que SQL). Probado en vivo a 1920×1080: arrancó "All of Me", abrió la ronda y al recargar retomó la misma ronda (el contador no se reinició). Captura: `docs/evidencias/fase6/pantalla-1920x1080-bloque1.png`.
- **Decisión:** la playlist de respaldo solo la lee el admin (RLS), así que la primera canción se elige al azar entre las activas, sin tema y de energía ≤ 3 (`fetchStarterSong`). Si se prefiere la playlist de respaldo, falta una policy de lectura pública (migración).
- **Ojo:** probar `/pantalla` **escribe en la base real** (`playback_state`, `play_history`, `rounds`). Quedan datos de prueba (una canción en curso y una ronda); limpiar por id antes de la ronda real con celulares.
- **Bloque 2 (YouTube) hecho, sin commit:** `useYouTubePlayer` (IFrame API; arranca en `now − started_at`, así que recargar retoma a media canción; fade-out en los últimos 3 s y corte en `started_at + play_sec`; pausa de la radio; botón "Activar sonido" si el navegador bloquea el audio automático) dentro de `usePantalla`. Video que falla (código de YouTube) o salto del admin (`skip_requested_at`) → `record_play` con `error`/`skipped` y entra la ganadora si ya está decidida, o una canción al azar; tras 3 errores seguidos se detiene y avisa. El video llena el recuadro cuadrado de la portada. Probado en vivo: sonó el video, el director cerró la ronda, metió a la ganadora y abrió la siguiente. Captura: `docs/evidencias/fase6/pantalla-1920x1080-bloque2.png`. El logo del encabezado ahora es de 48 px (se veía como una rayita). El QR usa `window.location.origin` (en producción sale la URL de Vercel).
- **Pendiente de probar a mano** (no se pudo desde aquí): bloqueo de audio con un clic real, fade-out al oído, error de video y salto del admin (Fase 8 lo dispara).
- **README → Limitaciones:** la primera canción se elige al azar (activas, sin tema, energía ≤ 3) porque la playlist de respaldo solo la lee el admin; decisión del usuario: sin migración. El hueco entre las opciones y el QR se deja para la Fase 9.
- **Ajustes al reproductor (2026-11-17):** video 16:9 a todo el ancho del panel izquierdo (mismo radio y borde; la portada de respaldo tiene el mismo 16:9 y queda debajo si el video no carga), subtítulos fuera (`cc_load_policy=0` + `unloadModule('captions')`), y si el video se pausa solo antes de acabar se reanuda. Cabe sin scroll a 1920×1080 y 1366×768 (media query de pantallas bajas; el QR sigue en 280 px). Capturas: `docs/evidencias/fase6/pantalla-1920x1080-bloque2b.png` y `pantalla-1366x768-bloque2b.png`.
- **Bloque 3 (voz) hecho, sin commit:** `useSpeech` (speechSynthesis `es-MX`, cola sin encimarse, promesa que siempre termina). Dice la nueva ronda ("Ya puedes votar… Opción A… Opción B…") y el resultado ("Ronda cerrada. Sigue…") con la música atenuada a 25 %, y solo si acaba de ocurrir (al recargar no se repite). Anuncios del admin: entre canciones, `next_announcement` → `mark_announcement_played` → fase `announcement` → se dice y se muestra en pantalla → entra la ganadora (nunca se encima con la canción). Chrome pide una interacción previa: el botón "Activar sonido" también habilita la voz. **No verificado todavía:** la voz real (no se pudo escuchar desde aquí) ni un anuncio real (no hay anuncios aprobados hasta la Fase 7).
- **Arreglo del video (2026-11-17):** `playerVars` ya traía `controls=0, disablekb=1, rel=0, iv_load_policy=3, playsinline=1, fs=0` (+ `cc_load_policy=0`); el iframe y su contenedor llevan `pointer-events: none` y solo el botón "Activar sonido" recibe clics. La pausa que se vio en la captura de 1366×768 **no se reprodujo** en dos intentos (estados de YouTube 3 → 1, sin pausa, también al cambiar el tamaño de la ventana); ocurrió en una recarga + resize **antes** de existir el seguro de reanudar, así que lo más probable es un bloqueo de autoplay del navegador de pruebas, no un fallo del código. En 1920 el recuadro del video crece en alto (hasta 4:3, recortando lados) para llenar el panel; a 1366×768 y 1920×1080 no hay scroll. Capturas `*-bloque2c.png`.
- **Bloque 4 (clima y ticker) hecho, sin commit:** `useWeather` (Open-Meteo `current=temperature_2m,weather_code`, coordenadas de `settings`, cada 15 min, conserva el último dato y reintenta al minuto), `useClockLabel` (hora de `America/Mexico_City` con el reloj del servidor), `Ticker` (cinta en la barra superior; con movimiento reducido queda quieta) y reloj junto a EN VIVO. La temperatura se pasa a `start_round(p_temp)`; sin dato, `null` (plan de respaldo). Probado en vivo: "22 °C · Despejado en el campus" y 10:56. **Falta comprobar en la base** que la primera ronda creada con este código guarde `context_snapshot.temp` (la que había se creó antes del cambio). Capturas `*-bloque4.png`.
- **Verificado en la base (2026-11-17):** la primera ronda creada con el clima guardó `context_snapshot.temp = 22` y `used_fallback = false` (las anteriores: `temp` null y `fallback_reason = sin_temperatura`). Criterio de aceptación del clima cumplido.
- **Voz:** `pickVoice` elige es-MX "Natural" → es-MX → es-US → cualquier es, espera `voiceschanged` (tope 2 s), `rate 0.95`, `pitch 1.0` y registra en consola `[voz] …`. En el Chrome de pruebas eligió "Microsoft Helena (es-ES)" (no había es-MX ni es-US instalada). Ticker con desvanecido de 12 % en ambas orillas.
- **Bloque 5 (cierre) hecho, sin commit:** aviso de conexión en `/pantalla` (`pt-banner`: "Reconectando…" / "Sin conexión. La radio sigue con lo que ya tiene y se reconecta sola."), probado con el evento `offline`/`online` (captura `pantalla-1920x1080-sin-conexion.png`). Recarga a media ronda: retoma la misma ronda y canción (probado varias veces). **Video en pausa en 2 capturas:** apareció la interfaz de YouTube con el video pausado en dos capturas (1366×768 y sin conexión) y no se pudo reproducir después (estados de YouTube 3 → 1 sin pausa, con captura, con `offline` y con cambio de tamaño); sigue sin causa confirmada. Existe el seguro que reanuda si se pausa solo. **Causa probable hallada después:** la captura `pantalla-1920x1080-resultado.png` muestra la pantalla final de YouTube (videos sugeridos) cuando el video termina unos segundos antes que el tiempo de la canción (`duration_sec` del seed puede pasarse de la duración real). Arreglo: si el video no está sonando (pausa o fin) se oculta y se ve la portada. Vigilar en la prueba real con TV.
- **README (Fase 9):** "Funciones simuladas o limitaciones": primera canción al azar (la playlist de respaldo solo la lee el admin); la voz depende del navegador. Instrucciones: **"Para mejor voz, abrir /pantalla en Microsoft Edge"** (voces Natural es-MX como Dalia). **Mejoras futuras: "TTS en la nube (ElevenLabs/Azure) vía Edge Function".**

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

## Antes de la demo

Checklist. Lo marcado **(Supabase)** lo hace el usuario en el panel o el SQL Editor de Supabase; el resto, desde `/admin` o el equipo de la TV.

**Supabase (a cargo del usuario)**

- [ ] **Subir el límite de inicios de sesión anónimos por IP** (*Authentication → Rate Limits*; por defecto 30 por hora). Si el campus comparte IP, subirlo y **anotar el valor usado** en el README ("Funciones simuladas o limitaciones"). Si la opción no aparece, es `rate_limit_anonymous_users` en la Management API. Para ensayar con celulares, usar datos móviles en algunos para variar la IP.
- [ ] **Site URL** (*Authentication → URL Configuration*): `https://radio-campus-five.vercel.app`.
- [ ] **Despertar el proyecto**: un proyecto gratuito se pausa tras ~7 días sin actividad; abrirlo el día anterior y comprobar que `/votar` conecta.
- [ ] **Limpiar los datos de prueba por id** (rondas, historial, `playback_state`, votos): ver el SQL de limpieza de la conversación del 2026-11-17. Datos conocidos al cierre de la Fase 9 (verificación del video): ronda `4e88f92b-3af0-4cf4-86d8-815be4b5b8d2` e historial `8bca12af-337f-4b70-86c9-00591c0c586c` (los votos caen en cascada con la ronda; si se vuelve a abrir `/pantalla`, aparecerán ids nuevos). Comprobar al final: `rounds` 0, `play_history` 0, `playback_state.phase = 'idle'`.
- [ ] **Cuenta de administrador**: la de pruebas (`admin@radiocampus.test`) es de uso escolar; **cambiarle la contraseña o borrarla** después de la demo (*Authentication → Users*, y su fila en `admins`).
- [ ] Confirmar `settings.context_override` en `null` y `paused = false` (`select context_override, paused from public.settings;`).

**Desde `/admin`**

- [ ] **Aprobar el anuncio "Bienvenidos a Radio Campus"** (Anuncios → Aprobar; nace sin aprobar).
- [ ] **Poner "Máximo por canción" en 90** (Configuración) para que las rondas no duren minutos.
- [ ] Revisar en **Monitor** que no diga *Simulación activa* ni *Radio en pausa*.
- [ ] **Verificar la tarjeta "Siguiente" del Monitor con una ronda real** (abierta con y sin votos, y cerrada); solo se probó con la base vacía.
- [ ] Opcional: crear un evento propio de la semana de la demo (Eventos y temas).

**Equipo de la TV y celulares**

- [ ] `npm run verify:seed` (39/39 videos) y `npm run smoke` (todo OK) el día anterior.
- [ ] Abrir `/pantalla` en **Microsoft Edge**, pulsar **Activar sonido** y dejar **una sola** pantalla abierta (`/pantalla?debug=1` para probar la voz Dalia y la de inglés).
- [ ] Comprobar que el **QR** apunta a `radio-campus-five.vercel.app/votar` (no a localhost) y que el recuadro mide 280 px o más.
- [x] **Ronda real con celulares** en producción: hecha el 2026-11-17 (PC + iPhone con Safari, cierre con 2 votos); evidencias en `docs/evidencias/demo/`. Repetirla solo si se quiere mostrar con más dispositivos.
- [ ] Mostrar el criterio de contexto: **Simular contexto** → escenarios → "Aplicar a la radio" → ver cambiar las opciones de la siguiente ronda → **Quitar simulación**.
- [ ] Después de la demo: borrar los datos de prueba otra vez y quitar la simulación.

## Qué falta además

- **Fase 9, bloque 1 — pulido: HECHO (2026-11-17, sin commit)**; evidencias en `docs/evidencias/fase9/`. Lo pedido tras revisar las capturas de la Fase 7:
  - "Borrar" con estilo distinto (de peligro) y confirmación antes de borrar (hoy hay un "¿Sí, borrar?" en la fila; revisar que el botón de borrar ya se vea como acción destructiva desde el primer clic).
  - Acciones de la tabla de canciones en un solo renglón.
  - Configuración en 2 columnas en escritorio.

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
