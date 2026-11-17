# Estado del proyecto (para retomar)

Última actualización: 2026-11-17 (Fase 9 en curso). Plan completo: [superpowers/plans/2026-11-13-radio-campus.md](superpowers/plans/2026-11-13-radio-campus.md).

## Dónde vamos

**Fases 0 a 8 hechas, desplegadas y verificadas; la Fase 9 (pulido y documentación) está en curso.** Producción: **https://radio-campus-five.vercel.app** (repo público: https://github.com/cesarau90/radio-campus). Cada push a `main` se publica solo en Vercel (cada fase se comprobó con el estado "success" y los mismos archivos `index-*.js/css` que el build local).

**Lo que falta para cerrar:** commit de la Fase 9 (con el OK del usuario), la **ronda real con 2–3 celulares** y la limpieza de datos de prueba (ver "Antes de la demo").

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
| **9 Pulido y documentación** | **en curso**: bloque 1 (pulido) hecho; bloque 2 (README, arquitectura, manual, costos, índice de evidencias, criterios de aceptación) y bloque 3 (checklist) escritos; **sin commit** | |

## Fase 9 (pulido y documentación): en curso (2026-11-17)

- **Bloque 1, pulido (hecho, verificado en vivo; capturas en `docs/evidencias/fase9/`):** "Borrar" con borde de peligro y confirmación ("Sí, borrar" / "No"); acciones de la tabla de canciones en un solo renglón; configuración en 2 columnas en escritorio; `/pantalla` sin hueco entre las opciones y el QR (el bloque se centra; en 1366×768 sigue sin scroll); `/votar` ya no parpadea al recargar con el voto emitido: muestra "Sintonizando…" hasta saber si ya votaste y la secuencia medida es Sintonizando → Voto registrado, sin pasar por las opciones activas.
- **Bloque 2, documentación (escrita):** `README.md` (instalación, uso, limitaciones, créditos, mejoras futuras), `docs/arquitectura.md` (diagramas Mermaid de arquitectura, ronda, fases y base de datos), `docs/manual-admin.md` (sin contraseñas), `docs/servicios-y-costos.md`, `docs/evidencias/README.md` (índice) y la tabla de criterios de aceptación al inicio de `docs/pruebas.md`.
- **Interfaz de YouTube oculta (2026-11-17, verificado en vivo, capturas `fase9/pantalla-*.png` y `pantalla-1920x1080-inicio-video.png`):** el iframe es 1,25 veces más grande que el recuadro y va centrado (token `--video-zoom`), así el recuadro recorta la barra del título; la **portada va encima** del video y se desvanece solo cuando el reproductor está en PLAYING (arranque, buffering, pausa y final la muestran de nuevo). YouTube dibuja un ícono de pausa al centro en los primeros segundos, así que el video se destapa **4 s después** de entrar en PLAYING (`REVEAL_MS`); medido: la portada se oculta a los ~3 s de cargar y el primer cuadro destapado sale limpio. Sin scroll en 1920×1080 y 1366×768.
- **Bloque 3:** checklist "Antes de la demo" (más abajo).
- **Pendiente tuyo:** limpiar los datos de prueba (rondas, historial, votos) y hacer la ronda real con celulares.

## Voz de la radio (2026-11-17): una sola ruta, dos idiomas, voces de mujer

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
- [ ] Opcional: crear un evento propio de la semana de la demo (Eventos y temas).

**Equipo de la TV y celulares**

- [ ] `npm run verify:seed` (39/39 videos) y `npm run smoke` (todo OK) el día anterior.
- [ ] Abrir `/pantalla` en **Microsoft Edge**, pulsar **Activar sonido** y dejar **una sola** pantalla abierta (`/pantalla?debug=1` para probar la voz Dalia y la de inglés).
- [ ] Comprobar que el **QR** apunta a `radio-campus-five.vercel.app/votar` (no a localhost) y que el recuadro mide 280 px o más.
- [ ] **Ronda real con 2–3 celulares** en producción: votar, esperar el cierre, capturar la pantalla de cada celular y la ronda cerrada, y guardarlas en `docs/evidencias/ronda-real/`.
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
