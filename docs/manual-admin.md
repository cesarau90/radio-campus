# Manual del administrador

Guía para el personal que opera la radio desde **`/admin`** (computadora o tableta). No incluye contraseñas: cada administrador usa la suya.

## 1. Entrar

1. Abre `/admin` (en producción: https://radio-campus-five.vercel.app/admin).
2. Escribe tu **correo** y **contraseña** y pulsa **Entrar**.
3. Si ves *"Esta cuenta no tiene permisos de administrador"*, tu usuario existe pero no está en la tabla `admins`. Pide a quien administra Supabase que corra:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'CORREO-DEL-ADMIN';
   ```
4. Si ves *"Correo o contraseña incorrectos"*, revisa los datos o pide que restablezcan la contraseña en Supabase (*Authentication → Users*).

Para salir, pulsa **Salir** (arriba a la derecha). Crear o quitar administradores se hace en Supabase, no en el panel.

## 2. Monitor

La pestaña de inicio muestra la radio **en vivo**:

- **Sonando ahora:** canción, fase (sonando, anunciando resultado, dando un anuncio…) y cuánto lleva.
- **Ronda abierta:** las dos opciones con sus votos y porcentajes, y la cuenta regresiva. Debajo, el **contexto con el que se creó** (hora, temperatura, evento, reglas y cuántas canciones eran elegibles; dice *(simulado)* si hubo simulación).
- **Votos de las últimas rondas:** una barra por ronda (A contra B) con la ganadora y si hubo empate o nadie votó.
- **Últimas reproducciones:** hora, canción y resultado (*Normal*, *Saltada* o *Falló en YouTube*).
- **Avisos:** *En vivo / Reconectando / Sin conexión*, *Radio en pausa* y *Simulación activa*.

### Controles

| Botón | Qué hace | Nota |
|---|---|---|
| **Pausar / Reanudar la radio** | Detiene o reanuda `/pantalla` (la música se detiene y no abre rondas) | Lo atiende `/pantalla`: debe estar abierta |
| **Saltar canción** | Pasa a la siguiente (entra la ganadora si ya está decidida) | Queda registrada como *Saltada* |
| **Cerrar la ronda ahora** | Cierra la votación sin esperar (pide confirmación) | Anuncia la ganadora en `/pantalla` |

## 3. Canciones

- **Buscar y filtrar** por título, artista, género, ánimo o tema; filtros *Todas, Activas, Inactivas, Restringidas*.
- **Agregar una canción:** *Agregar canción* → pega el enlace o el ID de YouTube → **Comprobar en YouTube**. Esto verifica que el video exista y se pueda reproducir en la radio, y rellena título, artista y **duración** (puedes corregirlos). Completa **género**, **ánimo** y **energía** (1 tranquila a 5 muy movida) y pulsa *Agregar al catálogo*.
- **Tema (opcional):** si una canción tiene tema (p. ej. `navidad`), **solo suena cuando ese tema está activo** (un evento vigente o una regla).
- **Activa / Inactiva:** una canción apagada no entra a ninguna ronda. Es la forma segura de "quitarla" sin perder su historial.
- **Restringida:** nunca entra a una ronda (por ejemplo, contenido no apto para el campus). Solo la ve el administrador. Escribe el motivo.
- **Borrar:** el botón de borde rojo pide confirmación (*Sí, borrar* / *No*). Si la canción ya salió en alguna ronda, no se puede borrar: **desactívala**.

Consejo: el catálogo necesita **al menos unas 20 canciones activas** con géneros variados; con pocas, la radio recurre a la playlist de respaldo.

## 4. Eventos y temas

Un evento es un periodo del calendario (festividad, exámenes o evento del campus). **Mientras está vigente** activa su tipo en las reglas y deja salir las canciones con su tema.

1. *Agregar evento* → nombre, tipo, **empieza** y **termina** (hora del campus) y, si quieres, un **tema**.
2. Mientras escribes el tema, el panel avisa cuántas canciones lo usan. Si dice *"Ninguna canción tiene este tema todavía"*, agrégalo a las canciones para que suene.
3. Estados: **Próximo**, **Vigente** y **Terminado**.

Ejemplos del seed: *Posadas y Navidad* (festividad, tema `navidad`, 1–26 de diciembre) y *Exámenes parciales* (23–28 de noviembre: ofrece solo música instrumental tranquila).

## 5. Anuncios

Mensajes que la radio dice en voz alta **entre dos canciones** (nunca encima de la música) y muestra en pantalla.

- **Texto:** hasta 280 caracteres.
- **Cada cuántas canciones:** frecuencia mínima entre apariciones.
- **Horario y fechas (opcionales):** una ventana de horas (puede cruzar la medianoche, p. ej. de 20 a 5) y fechas de inicio y fin.
- **Aprobado y activo:** `/pantalla` **solo lee los anuncios aprobados y activos**. Un anuncio nuevo nace sin aprobar; usa **Aprobar** para publicarlo y **Apagar** para pausarlo sin borrarlo.
- **Probar voz:** lo dice con la voz de la radio en tu navegador (con Microsoft Edge suenan las voces Natural).

Estados: *Sale al aire*, *Sin aprobar*, *Apagado* y *Fuera de fechas*.

## 6. Simular contexto

Sirve para **demostrar y comprobar** que la radio cambia sus opciones según el contexto.

1. Elige un escenario de ejemplo (*Madrugada tranquila, Mañana fresca, Tarde calurosa, Semana de exámenes, Posadas y Navidad, Sin dato de clima*) o escribe el tuyo: **hora**, **temperatura**, **evento** y **tema**.
2. **Ver las 2 opciones** muestra qué ofrecería la radio, con las reglas aplicadas y cuántas canciones eran elegibles. No crea rondas. La lista conserva los últimos 6 escenarios para compararlos.
3. **Aplicar a la radio** guarda la simulación: **las rondas nuevas la usan** hasta que pulses **Quitar simulación**. Mientras esté activa verás el aviso *Simulación activa* en el Monitor y aquí.

> **Importante:** quita siempre la simulación al terminar; si no, la radio seguirá "creyendo" que es otra hora, otro clima u otro evento.

## 7. Configuración

| Ajuste | Qué significa | Valor sugerido |
|---|---|---|
| Duración mínima de la ronda | Segundos mínimos que dura la votación (mínimo 10) | 30 |
| Máximo por canción | `0` = canción completa; con un valor, se corta con fade-out | **90** para la demo |
| No repetir canciones durante | Minutos antes de que una canción pueda volver a salir | 20 |
| Si hay empate, gana | Al azar, la menos reproducida o la opción A | Al azar |
| Si nadie vota, suena | Una de las dos al azar o una de la playlist de respaldo | Una de las dos al azar |
| Latitud y longitud | Ubicación del clima (Tampico: 22.2331, -97.8611) | — |
| Pausar la radio | Detiene `/pantalla` | Apagado |

Guarda con **Guardar cambios**; los valores no válidos se marcan antes de enviar. `/pantalla` toma los cambios en la siguiente ronda.

## 7b. Respaldo y restablecer el servicio

**Reglas** y **Playlists** tienen su propia pestaña. En **Configuración → Respaldo**:

- **Exportar respaldo** descarga un JSON con los ajustes, las reglas, los eventos, los anuncios y las playlists (las canciones van por su ID de YouTube). No incluye el catálogo de canciones ni el historial de votos.
- **Importar respaldo** pide confirmación y **no borra nada**: lo que ya existe con el mismo nombre o texto se sobrescribe y lo que falta se crea. Importar el mismo archivo dos veces no duplica nada.

Para restablecer el servicio:

1. Si el proyecto de Supabase se pausó (plan gratuito, ~7 días sin actividad), reactívalo desde su panel.
2. Recarga `/pantalla` (y pulsa **Activar sonido**).
3. Si la base está vacía o se recreó: aplica las migraciones en orden y el seed (ver el README), crea el admin y luego **importa el respaldo** más reciente.
4. Revisa en **Monitor** que no diga *Simulación activa* ni *Radio en pausa*.

## 8. Antes de la demo (resumen)

1. Aprobar el anuncio *"Bienvenidos a Radio Campus"* (Anuncios).
2. Poner *Máximo por canción* en **90** (Configuración).
3. Comprobar que **no hay simulación activa** ni la radio en pausa (Monitor).
4. Abrir `/pantalla` en **Microsoft Edge**, pulsar *Activar sonido* y dejarla abierta (solo una pantalla).
5. Revisar que el QR apunta a la dirección pública y que un celular puede votar.

La lista completa, con lo que se hace en Supabase, está en [ESTADO.md](ESTADO.md#antes-de-la-demo).

## 9. Problemas frecuentes

| Síntoma | Qué revisar |
|---|---|
| `/pantalla` no suena | Pulsar **Activar sonido** (el navegador bloquea el audio hasta un clic); comprobar que la radio no esté en pausa |
| La voz suena distinta o de mujer | Abrir en **Microsoft Edge**; en otros navegadores se usa la voz del sistema |
| Los celulares ven "No pudimos conectar" | Límite de inicios de sesión anónimos por IP en Supabase (*Authentication → Rate Limits*) |
| Un video no suena | Está eliminado o no permite incrustarse: la radio lo salta y lo registra; desactívalo en Canciones |
| Las opciones no cambian con el contexto | Hay una simulación activa (o no hay temperatura y se usa el respaldo); revisa el contexto de la ronda en el Monitor |
| El panel pide iniciar sesión otra vez | La sesión caducó: vuelve a entrar |
