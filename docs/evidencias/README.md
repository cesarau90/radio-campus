# Índice de evidencias

Capturas y registros que respaldan lo que hace cada fase. Todas se tomaron con el sistema funcionando contra Supabase real (salvo donde el nombre dice **inyectada**, que son vistas probadas con datos puestos solo en el navegador). Los criterios de aceptación y su evidencia están resumidos en [pruebas.md](../pruebas.md#criterios-de-aceptación).

| Carpeta | Fase | Qué demuestra | Archivos clave |
|---|---|---|---|
| [`fase5/`](fase5/) | `/votar` (celular) | Cada estado de la pantalla de votación a **390×844 y 320 px**: sintonizando, votar, elección, voto registrado, "ya votaste" (también tras recargar), sin conexión, sin ronda, ronda cerrada; títulos largos; **contraste** de las opciones y del botón; **foco con teclado** | `votar-390-votar.png`, `votar-390-voto-registrado.png`, `votar-390-ya-votaste.png`, `votar-390-closed.png`, `votar-320-titulos-largos-*.png`, `votar-*-contraste-*.png`, `votar-390-foco-teclado-*.png` |
| [`fase5/rediseno/`](fase5/rediseno/) | Rediseño visual de `/votar` | El diseño final (cartel + app de música) a **390×844, 320×568, 1366×768 y 1920×880**: ronda abierta, elección, voto registrado, "ya votaste", sin conexión, "Sonando ahora", pantalla de espera (con borde y dial), **ronda cerrada real**; capturas de **producción** | `votar-390x844-*.png`, `votar-1920x880-*.png`, `votar-390x844-cerrada-real.png`, `produccion-390x844-espera.png` · `iteraciones/` guarda los intentos anteriores |
| [`fase6/`](fase6/) | `/pantalla` (TV) | La pantalla del campus a **1920×1080 y 1366×768** sin scroll: canción sonando con el video de YouTube, ronda en vivo con votos, QR de 280 px, ticker y reloj, **resultado de la ronda**, aviso de **sin conexión** | `pantalla-1920x1080-bloque2c.png`, `pantalla-1366x768-bloque4.png`, `pantalla-1920x1080-resultado.png`, `pantalla-1920x1080-sin-conexion.png` |
| [`fase7/`](fase7/) | `/admin` CRUDs | Login, canciones (alta con "Comprobar en YouTube", edición, desactivación), eventos y temas, anuncios (crear y aprobar) y **configuración que persiste tras recargar** (antes, guardado y recargado) | `admin-login-1366x768.png`, `admin-canciones-*.png`, `admin-eventos-*.png`, `admin-anuncios-*.png`, `admin-config-antes/guardado/recargado-1366x768.png` |
| [`fase8/`](fase8/) | `/admin` monitor y simulador | **Criterio "un cambio de contexto cambia las opciones"**: comparación de 6 escenarios y rondas reales con simulación; monitor con contexto de la ronda, historial y gráfica; pausa; simulación activa y quitada | `simular-comparacion-completa-1366.png`, `monitor-ronda1-examenes-completo.png`, `monitor-ronda2-calor-completo.png`, `monitor-pausa-1366x768.png`, `simulacion-activa-1366x768.png` |
| [`fase9/`](fase9/) | Pulido | "Borrar" con estilo de peligro y confirmación, acciones de canciones en un renglón, configuración en 2 columnas, `/pantalla` sin hueco entre opciones y QR, `/votar` sin parpadeo al recargar con el voto emitido; **video de `/pantalla` sin la interfaz de YouTube** (recortado y con la portada encima mientras no suena) | `admin-borrar-confirmacion-1366x768.png`, `admin-canciones-1366x768.png`, `admin-config-2-columnas-1366x768.png`, `pantalla-1920x1080.png`, `pantalla-1920x1080-inicio-video.png`, `pantalla-1366x768.png`, `votar-recarga-con-voto-390x844.png` |
| [`demo/`](demo/) | **Ronda real en producción** (2026-11-17) | La radio funcionando de punta a punta en https://radio-campus-five.vercel.app con varios dispositivos: voto registrado desde una **PC** y desde un **iPhone con Safari** (abierto desde la cámara con el QR), y la **ronda cerrada con 2 votos** en `/pantalla` con el **anuncio de bienvenida** dicho entre canciones | `votar-voto-registrado-pc-produccion.png`, `votar-voto-registrado-iphone-safari-produccion.png`, `pantalla-ronda-cerrada-y-anuncio-produccion.png` |

## Otras evidencias (no son capturas)

- **Pruebas de base de datos:** [`supabase/tests/rls_write_access.sql`](../../supabase/tests/rls_write_access.sql) (seguridad: 0 fallos) y [`supabase/tests/round_logic.sql`](../../supabase/tests/round_logic.sql) (lógica de rondas: 53 checks, 0 fallos). Resultados en [pruebas.md](../pruebas.md).
- **Seed verificado:** `npm run verify:seed` (39 de 39 videos disponibles para incrustar).
- **Prueba de humo del cliente:** `npm run smoke` (sesión anónima, lectura pública, RPC, escritura bloqueada y Realtime).
- **Historial de commits:** un commit por fase (`git log --oneline`).

## Pendiente

- No hay capturas pendientes. Antes de la demo solo queda la limpieza de los datos de prueba (ver la lista "Antes de la demo" en [ESTADO.md](../ESTADO.md#antes-de-la-demo)).
