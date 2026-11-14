# Estado del proyecto (para retomar)

Última actualización: 2026-11-14. Plan completo: [superpowers/plans/2026-11-13-radio-campus.md](superpowers/plans/2026-11-13-radio-campus.md).

## Dónde vamos

**Fase 5 (`/votar`): código verificado en pantalla y commiteado; falta el deploy.** Se recorrieron todos los estados a 390×844 y 320 px (evidencias en `docs/evidencias/fase5/`), el detector de impeccable dio `[]`, y `build` y `lint` están limpios. Falta: repo en GitHub, Vercel y la prueba real con 2–3 celulares en la URL HTTPS.

| Fase | Estado | Commit |
|---|---|---|
| 0 Cimientos | hecha | `5d36cf1` |
| 1 Esquema y RLS | hecha, probada | `c05f113` |
| 2 Lógica SQL | hecha, probada (53/53 en `round_logic.sql`) | `0460f1c` |
| 3 Seed verificado | hecha | `cf60093` |
| 4 Núcleo del cliente | hecha, probada | `28fde37` |
| (extra) `.gitattributes` | hecho | `4745430` |
| 5 `/votar` | hecha y verificada en pantalla (sin deploy) | ver `git log` |
| 5b deploy (GitHub + Vercel) y prueba real | **pendiente** | |
| 6 `/pantalla` | pendiente | |
| 7 `/admin` CRUDs | pendiente | |
| 8 `/admin` operación | pendiente | |
| 9 Pulido y documentación | pendiente | |

## Qué quedó hecho en la Fase 5

- `PRODUCT.md` (verdad del producto, redactado del brief) y el brief de la superficie con el contrato de dirección: `.impeccable/surfaces/src-pages-votar-tsx.md`.
- Hook principal `src/hooks/useVotar.ts`: sesión anónima, reloj del servidor, estado en vivo, voto, "ya votó" tras recargar, y la vista que toca (`connecting`, `error`, `no-round`, `voting`, `voted`, `counting`, `closed`).
- Componentes (solo props): `VotarView`, `OptionPanel`, `VotarHeader`, `StatusNotice`, `ResultView`, `ConnectionBanner`, `icons`, y los estilos `votar.css`. Tipo `VotarView` en `src/types/votar.ts`.
- Diseño: papeleta con dos paneles grandes (A = tinta, B = naranja señal), toque para elegir y botón fijo para confirmar, sello "Voto registrado" como único momento animado. Base móvil en `index.css` (sin destello al tocar, sin pull-to-refresh, `dvh`, márgenes seguros) y `index.html` (`viewport-fit=cover`, `theme-color`).
- La base de datos está limpia: 0 rondas, 0 votos, 39 canciones.

## Qué falta

1. Repo en GitHub y deploy a Vercel (ver "Pendiente de entorno"); cada acción externa se confirma antes con el usuario.
2. Prueba real de una ronda desde 2–3 celulares en la URL HTTPS, como evidencia de pruebas.
3. Opcional: `DESIGN.md` con el sistema visual (comando `document` de impeccable).
4. Pendiente conocido de `/votar`: al recargar con voto ya emitido, la vista pasa un instante por "votar" hasta que llega `fetchMyVote` (parpadeo; el servidor igual rechaza un segundo voto).
5. La revisión de calidad se hizo en el mismo hilo (el subagente `impeccable-finish-reviewer` no existe en este entorno).

## Siguiente paso exacto

1. Confirmar con el usuario y crear el repo: `gh repo create cesarau90/radio-campus --public --source=. --remote=origin --push` (antes `git log --all -- .env` debe salir vacío).
2. Vercel: el login lo hace el usuario; luego `vercel link`, variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (production y preview), `vercel --prod` y `vercel git connect`.
3. Crear una ronda real con un `insert` en `public.rounds` (`option_a`, `option_b`, `ends_at`), abrir la URL HTTPS en 2–3 celulares, votar, cerrar con `_close_round(<id>, true)` y capturar.
4. **Antes de la prueba con varios celulares**: revisar en Supabase → Authentication → Rate Limits el límite de inicios de sesión anónimos. Se alcanzó un `429 Request rate limit reached` en `/auth/v1/signup` al abrir ~17 sesiones nuevas en pocos minutos desde una IP. Con una red de campus (muchos estudiantes tras una misma IP) puede dejar a gente sin entrar; subirlo o avisar en "limitaciones".

Comandos de verificación: `npm run build`, `npm run lint`, `C:\Users\petoa\.claude\skills\impeccable\scripts\impeccable.cmd detect --json src/components src/pages/Votar.tsx`. Las rondas de prueba se crean con id fijo y se borran por id (`delete from public.rounds where id = '<id>'`; los votos caen en cascada).

## Pendiente de entorno (lo que el usuario ya dejó listo)

- **Supabase**: proyecto `radio` (`xoepecxnhiqytwbmahau`, us-west-2). Migraciones y seed aplicados. Sign-in anónimo activado, confirmación de correo apagada.
- **`.env`** (ignorado por git, nunca estuvo en un commit): `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (clave `sb_publishable_…`). `.env.example` tiene solo marcadores.
- **GitHub**: `gh` autenticado como `cesarau90`. **Falta crear** el repo público `radio-campus` y hacer push: `gh repo create cesarau90/radio-campus --public --source=. --remote=origin --push`. Antes: `git log --all -- .env` debe salir vacío (ya se comprobó).
- **Vercel**: CLI 65.11 con sesión `cesarau90`. **Falta**: `vercel link`, cargar las dos variables (`vercel env add VITE_SUPABASE_URL production` y `VITE_SUPABASE_PUBLISHABLE_KEY`, también en preview), `vercel --prod`, y `vercel git connect` para que cada push se publique solo. `vercel.json` ya tiene el rewrite del SPA.
- **Usuario admin** (para la Fase 7): crearlo en Authentication y luego `insert into public.admins (user_id) select id from auth.users where email = '...';` (este SQL va también en el README).

## Decisiones y avisos para recordar

- Duración: la canción suena `min(duration_sec, max_play_sec)` (0 = completa); la ronda dura eso menos 10 s, mínimo `round_duration_sec`. Para la demo, `max_play_sec = 90` desde `/admin`.
- `no_repeat_minutes = 20` en el seed (con 39 canciones, 60 min agotaría las opciones).
- Las canciones con `theme` (navideñas) solo se ofrecen si su tema está activo (evento o regla).
- Sin lo-fi en el seed: el usuario las agrega desde `/admin`. En el admin, la duración al agregar una canción se obtiene con `getDuration()` del reproductor de YouTube (oEmbed no la da).
- `src/lib/api.ts` (acceso a datos, sin lógica) queda fuera de `src/hooks`; el usuario lo aprobó.
- **QR de `/pantalla`**: en un recuadro de papel claro, de **mínimo 280 px** y con margen (quiet zone).
- Seguridad conocida (va en "Funciones simuladas o limitaciones"): cualquiera con la clave publicable puede llamar `record_play`/`set_phase` y cerrar rondas ya vencidas; `start_round` está protegido (una sola ronda abierta).
- Las pruebas SQL se corren pegando el archivo completo en el SQL Editor (`supabase/tests/*.sql`); la herramienta `execute_sql` rechazó los scripts que crean usuarios de prueba.
- Comandos útiles: `npm run build`, `npm run lint`, `npm run smoke` (13 comprobaciones contra Supabase), `npm run verify:seed` (los 39 IDs de YouTube), `/diagnostico` solo en desarrollo.
- Impeccable avisó que hay una versión nueva (4.9.0); no se actualizó.
