# Radio Campus

Sistema de **radio inteligente e interactiva para el campus**. Una pantalla (TV) reproduce música de YouTube, anuncia en voz alta lo que pasa y propone **dos canciones elegidas según el contexto** (hora, clima, eventos como exámenes o Navidad). La comunidad **vota desde el celular** escaneando un QR, y la ganadora suena después. Un panel de administración permite gestionar canciones, eventos, anuncios y la configuración, y vigilar la radio en vivo.

- **Producción:** https://radio-campus-five.vercel.app (`/pantalla`, `/votar`, `/admin`)
- **Proyecto escolar:** el historial de commits y la carpeta [`docs/`](docs/) forman parte de la entrega.

## Cómo funciona

1. **`/pantalla`** (TV) es el "director": arranca una canción, abre una ronda de votación con **dos opciones contextuales**, cierra la ronda al vencer, anuncia la ganadora y la reproduce cuando termina la canción en curso. Muestra un QR hacia `/votar`, el clima y un ticker.
2. **`/votar`** (celular) muestra las dos opciones y deja votar **una vez por ronda**, sin registrarse (sesión anónima). Funciona aunque recargues la página.
3. **`/admin`** (computadora) es el panel: monitor en vivo, canciones, eventos y temas, anuncios, simulador de contexto y configuración.
4. **Toda la lógica crítica vive en el servidor** (funciones SQL en Supabase): tiempos, votos, cierre de rondas y el algoritmo contextual. El cliente nunca decide tiempos; compara contra el reloj del servidor.

Más detalle y diagramas: [docs/arquitectura.md](docs/arquitectura.md).

## Tecnologías

React 19 · Vite · TypeScript · React Router · Supabase (Postgres, Auth, Realtime, RPC, `pg_cron`) · Vercel · YouTube IFrame API · Open-Meteo · Web Speech API · `qrcode.react`. Sin servidor propio.

## Instalación

**Requisitos:** Node.js 20.19 o superior (o 22.12+), una cuenta gratuita de [Supabase](https://supabase.com) y (para publicar) una de [Vercel](https://vercel.com).

1. **Clonar e instalar**
   ```bash
   git clone https://github.com/cesarau90/radio-campus.git
   cd radio-campus
   npm install
   ```
2. **Crear el proyecto en Supabase** y, en *Authentication → Sign In / Providers*, activar **Anonymous sign-ins** (y dejar apagada la confirmación de correo).
3. **Aplicar la base de datos.** En el *SQL Editor* de Supabase, pegar y ejecutar **en este orden** cada archivo de [`supabase/migrations/`](supabase/migrations/):
   1. `20261113000100_schema.sql`
   2. `20261113000200_rls.sql`
   3. `20261113000300_round_logic.sql`
   4. `20261113000400_theme_eligibility.sql`
   5. `20261113000500_distinct_active_themes.sql`
   6. `20261117000100_admin_preview_pick.sql`

   Después, [`supabase/seed.sql`](supabase/seed.sql): 39 canciones verificadas, reglas contextuales, eventos de ejemplo, ajustes y un anuncio de bienvenida (sin aprobar).
4. **Variables de entorno.** Copiar `.env.example` a `.env` y poner la URL del proyecto y la **clave publicable** (`sb_publishable_…`, en *Project Settings → API Keys*). Nunca pongas ahí una clave secreta.
5. **Crear al administrador.** En *Authentication → Users → Add user* crea un usuario con correo y contraseña, y en el SQL Editor:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'TU-CORREO';
   ```
6. **Arrancar:** `npm run dev` y abrir `http://localhost:5173`.
7. **Publicar (opcional).** Importar el repositorio en Vercel, agregar las dos variables `VITE_…` y desplegar (`vercel.json` ya trae el *rewrite* de la SPA). En Supabase, *Authentication → URL Configuration*, poner como **Site URL** la dirección de Vercel.

### Comandos

| Comando | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Comprobación de tipos + build de producción |
| `npm run lint` | Linter (oxlint) |
| `npm run smoke` | Prueba de humo contra Supabase real (sesión anónima, lectura pública, RPC, escritura bloqueada, Realtime) |
| `npm run verify:seed` | Comprueba que los 39 videos del seed sigan disponibles para incrustar |

## Uso

| Ruta | Quién | Cómo |
|---|---|---|
| `/pantalla` | La TV del campus | Abrirla en **Microsoft Edge** (mejores voces), pulsar **"Activar sonido"** una vez si aparece, y dejarla abierta. **Una sola pantalla a la vez.** |
| `/votar` | Estudiantes | Escanear el QR de la pantalla. Elegir una canción y confirmar. |
| `/admin` | Personal | Entrar con la cuenta de administrador. Ver el [manual](docs/manual-admin.md). |

`/pantalla?debug=1` agrega botones para probar la voz.

## Documentación

- [Arquitectura y base de datos (diagramas)](docs/arquitectura.md)
- [Manual del administrador](docs/manual-admin.md)
- [Servicios externos y costos](docs/servicios-y-costos.md)
- [Pruebas y criterios de aceptación](docs/pruebas.md)
- [Índice de evidencias (capturas)](docs/evidencias/README.md)
- [Estado del proyecto y checklist antes de la demo](docs/ESTADO.md)
- [Verdad del producto](PRODUCT.md) y [plan de implementación](docs/superpowers/plans/2026-11-13-radio-campus.md)

## Funciones simuladas o limitaciones

- **Límite de inicios de sesión anónimos.** Supabase limita los inicios de sesión anónimos por IP (por defecto **30 por hora**). Si muchos estudiantes comparten la misma red del campus, algunos verán "No pudimos conectar". **Se sube en Supabase → Authentication → Rate Limits antes de la demo** y se anota el valor usado.
- **Quien borra los datos del navegador puede votar otra vez.** El voto único se apoya en la sesión anónima, sin cuenta real.
- **Si Safari borra la sesión anónima, se crea una nueva identidad y esa persona podría votar otra vez en la misma ronda.** El navegador guarda la sesión en `localStorage` y en memoria, y la app la rehace si desaparece, pero una sesión nueva es otro votante para el servidor.
- **Primera canción al azar.** Cuando la radio arranca de cero, la primera canción se elige al azar entre las tranquilas, sin tema y activas: la playlist de respaldo solo la puede leer un administrador (RLS) y no se abrió a lectura pública por decisión de diseño.
- **La voz depende del navegador.** Se usa la voz del sistema (Web Speech API). Con **Microsoft Edge** hay voces "Natural" y la radio usa voces de mujer: **Dalia** para español de México y **Jenny, Aria o Ava** para inglés; en otros navegadores suena la voz de mujer instalada que se encuentre (o la del sistema). Hay que pulsar "Activar sonido" una vez por sesión (política de los navegadores).
- **Idioma de los títulos por heurística.** Para decir "Shape of You" con voz en inglés y "Cielito Lindo" con voz en español se usa una regla simple: género latino o regional (latino, urbano, reggaetón, salsa, bachata, cumbia, banda, regional, norteño, mariachi, ranchera, corrido, bolero, trova), acentos o ñ **en el título**, una palabra común en español en el título o el artista (de, la, el, los, amor, corazón, feliz, navidad, volver…) o un diminutivo (-ito/-ita, como "Despacito") → español; si no → inglés. No es un detector de idioma: las clásicas francesas o italianas se leen con la voz que les toque ("Clair de Lune" y "Gymnopédie" en español; "Nocturne" en inglés). Una columna de idioma por canción lo resolvería (ver Mejoras futuras).
- **YouTube puede fallar.** Si un video se elimina o bloquea la incrustación, `/pantalla` lo registra como error y salta a otra canción (tras 3 errores seguidos se detiene y avisa). Si el video dura menos que `duration_sec`, termina antes del tiempo previsto.
- **Una sola `/pantalla`.** Con dos pantallas abiertas se duplicarían registros de reproducción (el servidor impide dos rondas abiertas, pero no dos directores).
- **Seguridad conocida.** Quien tenga la clave publicable puede llamar a `record_play` y `set_phase`, y cerrar rondas ya vencidas; `start_round` está protegido (no abre una ronda si ya hay una abierta). Es aceptable para un proyecto escolar sin servidor propio.
- **El clima es opcional.** Si Open-Meteo falla o no responde, la ronda usa la playlist de respaldo (sin temperatura) en lugar de inventar un dato.
- **Pruebas.** Hay pruebas de base de datos (SQL), una prueba de humo y verificación manual con capturas; no hay pruebas automáticas del front.

## Créditos

- **Imagen de fondo del estudio de radio:** generada con **IA** (la aportó el equipo); sin texto ni interfaz.
- **Portadas de las canciones:** miniaturas públicas de YouTube (`img.youtube.com`); los derechos pertenecen a sus titulares. La música se reproduce con el reproductor oficial de YouTube.
- **Tipografías** (Google Fonts, licencia OFL): Bricolage Grotesque, DM Mono y DM Serif Display.
- **Clima:** datos de [Open-Meteo](https://open-meteo.com) (licencia CC BY 4.0).
- **Software:** React, Vite, TypeScript, React Router, Supabase y qrcode.react.
- **Desarrollo asistido por IA:** el código se construyó con ayuda de Claude Code (Anthropic), bajo la dirección y revisión del equipo; los commits llevan la coautoría.

## Mejoras futuras

- **TTS en la nube (ElevenLabs / Azure) vía Edge Function**, para que la voz sea la misma en cualquier navegador.
- Una columna de **idioma** por canción para decir los títulos con la voz correcta, en lugar de la heurística.
- Abrir la **playlist de respaldo** a lectura pública (o una función segura) para arrancar la radio con ella.
- Pruebas automáticas de extremo a extremo (Playwright) en CI.
- Límite de votos por dispositivo más robusto y panel de analítica (participación por hora).
