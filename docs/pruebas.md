# Pruebas y criterios de aceptación

> Este documento se completa en la Fase 9 con el checklist de aceptación y espacio para capturas.
> Mientras tanto, aquí queda la evidencia de las pruebas automáticas de base de datos.

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
