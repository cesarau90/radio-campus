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
