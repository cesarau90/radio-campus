# Pruebas y criterios de aceptación

> Qué se probó y cómo. Primero el checklist de aceptación (con su evidencia); después el detalle de las pruebas de base de datos y del cliente. Las capturas están indexadas en [evidencias/README.md](evidencias/README.md).

## Criterios de aceptación

| # | Criterio | Estado | Evidencia |
|---|---|---|---|
| 1 | Un visitante puede votar **una sola vez** por ronda, también si recarga o abre dos pestañas | Cumplido | Pruebas SQL C1–C8 (`round_logic.sql`); [`fase5/`](evidencias/fase5/) (`ya-votaste`); [`fase9/votar-recarga-con-voto-390x844.png`](evidencias/fase9/votar-recarga-con-voto-390x844.png) |
| 2 | El servidor decide los tiempos: un voto tardío o con el reloj del celular desfasado se rechaza | Cumplido | Pruebas SQL B1–B3 y C8 (53/53 sin fallos) |
| 3 | La ronda se **cierra sola** al vencer y gana por votos (con reglas de empate y de "sin votos") | Cumplido | Pruebas SQL D1–D9 (incluye `pg_cron`); [`fase5/rediseno/votar-390x844-cerrada-real.png`](evidencias/fase5/rediseno/votar-390x844-cerrada-real.png) |
| 4 | **Un cambio de contexto cambia las 2 opciones** de la siguiente ronda (hora, temperatura y evento) | Cumplido | [`fase8/simular-comparacion-completa-1366.png`](evidencias/fase8/simular-comparacion-completa-1366.png) (6 escenarios) y rondas reales con simulación: [`fase8/monitor-ronda1-examenes-completo.png`](evidencias/fase8/monitor-ronda1-examenes-completo.png) → [`fase8/monitor-ronda2-calor-completo.png`](evidencias/fase8/monitor-ronda2-calor-completo.png) |
| 5 | La temperatura real llega al algoritmo (Open-Meteo) y sin clima se usa la playlist de respaldo | Cumplido | Ronda con `context_snapshot.temp = 22` y `used_fallback = false` (ESTADO.md); escenario "Sin dato de clima" en [`fase8/`](evidencias/fase8/) |
| 6 | `/pantalla` reproduce la canción, abre la ronda, muestra el QR y los votos en vivo, anuncia la ganadora y la reproduce | Cumplido | [`fase6/`](evidencias/fase6/) (`bloque2c`, `resultado`) |
| 7 | La pantalla **retoma** a media ronda al recargar y avisa si pierde la conexión | Cumplido | ESTADO.md (Fase 6); [`fase6/pantalla-1920x1080-sin-conexion.png`](evidencias/fase6/pantalla-1920x1080-sin-conexion.png) |
| 8 | Un video que falla se registra y se salta | Cumplido en código y probado en parte | El salto del admin queda como "Saltada" en el historial ([`fase8/monitor-ronda2-calor-completo.png`](evidencias/fase8/monitor-ronda2-calor-completo.png)); el error de un video real no se provocó |
| 9 | El admin puede gestionar canciones, eventos, anuncios y configuración, y **la configuración persiste** | Cumplido | [`fase7/`](evidencias/fase7/) (antes / guardado / recargado) |
| 10 | Solo un administrador puede escribir; los anónimos no | Cumplido | `rls_write_access.sql`: 0 fallos en 5 actores (más abajo) |
| 11 | Aceptable en celular (390 y 320 px), con contraste ≥ 4,5:1 y foco visible con teclado | Cumplido | [`fase5/`](evidencias/fase5/) (`contraste`, `foco-teclado`) |
| 12 | Funciona en **producción** (Vercel) | Cumplido | `/votar`, `/pantalla` y `/admin` responden en https://radio-campus-five.vercel.app; [`fase5/rediseno/produccion-390x844-espera.png`](evidencias/fase5/rediseno/produccion-390x844-espera.png) |
| 13 | **Ronda completa desde varios dispositivos** en producción: votos desde una PC y un iPhone, cierre con resultado y reproducción de la siguiente | **Cumplido** (2026-11-17) | [`demo/pantalla-ronda-cerrada-y-anuncio-produccion.png`](evidencias/demo/pantalla-ronda-cerrada-y-anuncio-produccion.png) (ronda cerrada con 2 votos), [`demo/votar-voto-registrado-pc-produccion.png`](evidencias/demo/votar-voto-registrado-pc-produccion.png) |
| 14 | **Anuncio entre canciones**: la radio dice y muestra un anuncio aprobado, sin encimarse con la música | **Cumplido** (2026-11-17) | [`demo/pantalla-ronda-cerrada-y-anuncio-produccion.png`](evidencias/demo/pantalla-ronda-cerrada-y-anuncio-produccion.png) (anuncio "Bienvenidos a Radio Campus" con la ronda cerrada) |
| 15 | **Voto desde un iPhone con Safari** (abierto desde la cámara con el QR) en producción | **Cumplido** (2026-11-17) | [`demo/votar-voto-registrado-iphone-safari-produccion.png`](evidencias/demo/votar-voto-registrado-iphone-safari-produccion.png); el bug que lo impedía y su arreglo, en la sección de Safari más abajo |

## Sesión anónima en Safari/WebKit (2026-11-17)

Bug reportado desde un iPhone con Safari en producción: `cast_vote` → 401 / 42501 justo después de crear la sesión anónima (el cliente llamó sin JWT, como rol `anon`). Reproducido y arreglado; el detalle de la causa y del arreglo está en [ESTADO.md](ESTADO.md#bug-del-iphone-con-safari-permission-denied-for-function-cast_vote-2026-11-17).

Prueba en **WebKit (iPhone 13 emulado, Playwright)** llamando a `castVote` con una ronda inexistente (no escribe nada): autenticado responde `not_found`; como `anon` daría 401 / 42501.

| Escenario | Antes | Después |
|---|---|---|
| Normal | OK | OK |
| La clave de la sesión desaparece de `localStorage` | **401 · 42501** | OK (copia en memoria) |
| `localStorage` lanza `SecurityError` | error sin petición | OK |
| La sesión se pierde por completo | — | OK (`ensureSession` crea otra) |
| El servidor responde 401/42501 a la primera llamada | — | OK (reintento con sesión nueva) |

**Prueba con un iPhone real (2026-11-17):** Safari abierto desde la cámara con el QR, en producción: el voto se registró ([`evidencias/demo/votar-voto-registrado-iphone-safari-produccion.png`](evidencias/demo/votar-voto-registrado-iphone-safari-produccion.png)).

## Pruebas de base de datos

### Seguridad RLS: ningún anónimo puede escribir (Fase 1)

Archivo: [`supabase/tests/rls_write_access.sql`](../supabase/tests/rls_write_access.sql)

Qué comprueba:
- 4 actores **no admin** (sin sesión, anónimo, anónimo cuyo uid está por error en `admins`, usuario normal) no pueden `insert`, `update` ni `delete` en ninguna de las 12 tablas de `public`, ni leer datos privados (reglas, playlists, historial, votos ajenos, canciones restringidas, anuncios sin aprobar).
- Control positivo: un admin real sí puede escribir en `songs` y `settings`, leer lo privado, y **no** puede insertar votos directamente (entran solo por RPC).

Cómo correrla: pegar el archivo completo en el SQL Editor de Supabase. Crea filas `TEST_*` y las borra al terminar.

**Resultado (ejecutado el 2026-11-13 en el proyecto "radio", SQL Editor):**

| actor | checks | failed_checks | failures |
|---|---|---|---|
| admin(control) | 7 | 0 | - |
| anon | 44 | 0 | - |
| anonymous_listed_admin | 44 | 0 | - |
| anonymous_user | 44 | 0 | - |
| regular_non_admin | 44 | 0 | - |

**Verificación de limpieza** (consulta de solo lectura posterior a la prueba): 0 filas `TEST_*` en `songs`, `playlists`, `context_rules`, `events` y `announcements`; 0 filas en `rounds`, `votes`, `play_history` y `admins`; 0 usuarios de prueba en `auth.users`; `settings` y `playback_state` conservan su única fila.

Captura: _(pega aquí tu captura del resultado)_

### Lógica de rondas en el servidor (Fase 2)

Archivo: [`supabase/tests/round_logic.sql`](../supabase/tests/round_logic.sql)

Qué comprueba (51 verificaciones):

| Bloque | Qué se prueba |
|---|---|
| A1-A9 | Algoritmo contextual: exámenes (prioridad 100) manda; calor afina por mood sin contradecir; tema de festividad; sin temperatura → respaldo; menos de 2 elegibles → respaldo; no repetir canciones recientes; `start_round` idempotente; temperatura recibida desde la pantalla |
| B1-B3 | Tiempos del servidor: `ends_at = inicio + min(duración, max_play_sec) − 10 s`; `max_play_sec = 0` usa la duración completa; `round_duration_sec` como mínimo |
| C1-C8 | `cast_vote`: voto registrado, segundo voto → "ya votó", no se puede cambiar, contadores, opción inválida, sin sesión, ronda inexistente, voto tras `ends_at` rechazado con el reloj del servidor |
| D1-D3 | `close_round`: gana por votos, idempotente, no cierra antes de `ends_at` |
| D4-D9 | Empates (`opcion_a`, `menos_reproducida`, `aleatorio`), sin votos (`aleatorio`, `respaldo`) y `close_expired_rounds` (lo que ejecuta `pg_cron`) |
| E1-E3 | `admin_force_close_round`: un no admin y un anónimo listado en `admins` no pueden; un admin real sí |
| F1-F7 | Anuncios: frecuencia, horario, aprobación, vigencia y reinicio de la cuenta al reproducirse |
| G1-G5 | `record_play` (ok y error), `set_phase`, fase inválida rechazada, `server_now` |
| H1-H4 | `anon` no ejecuta la API; `authenticated` sí; helpers internos no son llamables; job de `pg_cron` activo cada minuto |

Cómo correrla: pegar el archivo completo en el SQL Editor. Crea fixtures `TEST_*`, aparta y restaura los datos reales, y no deja nada.

**Resultado (ejecutado el 2026-11-13 en el proyecto "radio", SQL Editor):** `RESUMEN: true — 51 checks, 0 fallos`.

> **Actualización (Fase 3):** la migración `20261113000400_theme_eligibility.sql` cambió `_contextual_pick` (ver Fase 3) y el test ganó dos casos (A10 y A11), por lo que el total esperado pasó de 51 a **53 verificaciones**. **Resultado de la nueva corrida (2026-11-13, SQL Editor): `RESUMEN: true — 53 checks, 0 fallos`**, incluidos A10 y A11.

Nota: en la primera ejecución C/D y E fallaron por un error del propio test (`format('%s', boolean)` produce `t`/`f`, JSON inválido). Se corrigió el test con un cast a `text`; las funciones SQL no cambiaron.

Captura: _(pega aquí tu captura del resultado)_

## Datos de ejemplo (Fase 3)

### Verificación de los IDs de YouTube

Ningún ID se inventó. Cada `youtube_id` del seed se verificó contra oEmbed
(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=ID&format=json`):

- Respuesta **HTTP 200** (el video existe y permite embed).
- El **título real** devuelto por YouTube contiene el nombre de la canción esperada (descarta IDs que apunten a otro video).
- `playableInEmbed = true` y duración real (`duration_sec`) leída del video.
- Candidatos descartados: 1 con HTTP 404; "Moonlight Sonata (FULL)" por durar 900 s.

Resultado: **39 canciones** (pop 8, rock 5, electrónica 5, instrumental 7, regional mexicano 8, navideñas 6).
No hay lo-fi: no se encontraron pistas individuales (solo mixes largos y transmisiones en vivo, que no tienen duración).

Para volver a comprobarlo (por ejemplo antes de la demo): `npm run verify:seed`. Última corrida: `39/39 videos disponibles para embed`.

### El algoritmo con las canciones reales

Consultas de solo lectura a `_contextual_pick` (300 sorteos por contexto, sin escribir nada):

| Contexto | Reglas que aplican | Qué se ofrece |
|---|---|---|
| 9 h, 25 °C | Mañana (energía 2-3) | electrónica, instrumental, pop, regional |
| 13 h, 35 °C | Calor + Mediodía | electrónica, pop, regional, rock, con moods frescos/alegres |
| 21 h, 12 °C | Frío + Tarde y noche | instrumental, pop, regional, con moods acogedores |
| Exámenes, 13 h | Exámenes (100) manda sobre Calor y Mediodía | solo instrumentales de energía 1-2 |
| Festividad (con o sin tema en el evento) | Festividad (90) | solo navideñas (600 de 600 opciones) |
| Sin temperatura | — | playlist "respaldo" |

**Defecto encontrado con datos reales y corregido:** al principio se ofrecían navideñas (por ejemplo *Last Christmas* a las 3 am) fuera de temporada, porque el tema solo actuaba como filtro suave cuando había una regla o evento con ese tema. La migración `20261113000400_theme_eligibility.sql` hace que una canción con `theme` solo sea elegible si ese tema está activo (tema del evento o de una regla que aplica). Resultado después de corregir: **0 navideñas ofrecidas fuera de temporada en 3 000 opciones sorteadas**.

Regresión tras la corrección: `round_logic.sql` dio **53 checks, 0 fallos** (incluye A10 y A11, que cubren este defecto).

### Detalle menor: tema duplicado en el snapshot

Con un evento y una regla aportando el mismo tema, `active_themes` salía `["navidad","navidad"]`. La migración `20261113000500_distinct_active_themes.sql` lo devuelve sin duplicados (`["navidad"]`). Verificado con una consulta de solo lectura; no requirió repetir el test.

Captura: _(pega aquí tu captura del seed en Supabase, tabla `songs`)_

## Núcleo del cliente (Fase 4)

### Prueba de humo contra Supabase real

`npm run smoke` ([`scripts/smoke-client.mjs`](../scripts/smoke-client.mjs)) hace lo mismo que el navegador, con la clave publicable del `.env`. No crea rondas ni modifica datos.

| Comprobación | Resultado |
|---|---|
| Sign-in anónimo | OK |
| Lee `settings`, `songs` (39) y `playback_state` | OK |
| NO lee `context_rules` ni `play_history` (solo admin) | OK |
| RPC `server_now` (desfase ~57 ms, latencia ~146 ms) | OK |
| RPC `is_admin` = false para un anónimo | OK |
| RPC `cast_vote` con ronda inexistente → `not_found` | OK |
| Insert directo en `songs` bloqueado (`42501`) | OK |
| Update directo en `settings` bloqueado (0 filas) | OK |
| Insert directo en `votes` bloqueado (`permission denied`) | OK |
| Realtime `SUBSCRIBED` | OK |

Resultado: **13 de 13 comprobaciones**, `Todo bien`.

### Hooks base en un navegador real

Página solo de desarrollo `/diagnostico` (no existe en producción), probada con Playwright:

- Sesión anónima creada y **reutilizada tras recargar** (mismo `uid`, no se crea un usuario por recarga).
- Reloj del servidor sincronizado (desfase ~56 ms, latencia ~128 ms) y cuenta regresiva de 20 s bajando.
- Realtime `connected`; al simular `offline` pasa a `error` y al volver `online` regresa a `connected`.
- Ajustes, estado de reproducción y anuncios cargados desde la base. Consola sin errores ni advertencias.
- `npm run build` y `npm run lint` sin errores ni advertencias.

Captura: _(pega aquí una captura de `/diagnostico`)_
