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

Nota: en la primera ejecución C/D y E fallaron por un error del propio test (`format('%s', boolean)` produce `t`/`f`, JSON inválido). Se corrigió el test con un cast a `text`; las funciones SQL no cambiaron.

Captura: _(pega aquí tu captura del resultado)_
