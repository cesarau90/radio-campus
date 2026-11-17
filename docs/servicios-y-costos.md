# Servicios externos y costos

El sistema funciona **sin servidor propio y con servicios gratuitos**. Costo total para el proyecto escolar: **$0**.

> Las cifras de los planes gratuitos cambian con el tiempo. Se anotan como referencia (revisadas al redactar este documento, noviembre de 2026); **confirma los límites vigentes en la página de precios de cada servicio antes de la demo**.

| Servicio | Para qué se usa | Plan | Costo | Límites que importan aquí |
|---|---|---|---|---|
| [Supabase](https://supabase.com/pricing) | Base de datos Postgres, autenticación, Realtime, funciones SQL y `pg_cron` | Free | $0 | Base de datos de ~500 MB (el proyecto usa menos de 1 MB); usuarios activos mensuales (cada visitante anónimo cuenta); conexiones y mensajes Realtime concurrentes; **un proyecto gratuito se pausa tras ~7 días sin actividad** (se reactiva desde el panel); **límite de inicios de sesión anónimos por IP** (por defecto 30 por hora) |
| [Vercel](https://vercel.com/pricing) | Hospedaje del front (HTTPS) con despliegue automático desde GitHub | Hobby | $0 | Uso **no comercial** (cumple: proyecto escolar); ancho de banda y compilaciones generosos para este tráfico |
| [GitHub](https://github.com) | Repositorio y entrega continua hacia Vercel | Free | $0 | Repositorio público |
| [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference) | Reproducir la música con el reproductor oficial y leer la duración | Gratuito | $0 | Debe cumplir las condiciones de YouTube: reproductor visible y sin ocultar publicidad ni controles legales; los videos deben permitir la incrustación |
| [YouTube oEmbed](https://oembed.com) y miniaturas (`img.youtube.com`) | Comprobar que un video exista y mostrar su portada | Gratuito | $0 | Sin clave; las portadas son de sus titulares |
| [Open-Meteo](https://open-meteo.com) | Temperatura actual de Tampico (consulta cada 15 min) | Gratuito, sin clave | $0 | Solo uso no comercial y límite diario holgado (se hacen ~96 consultas al día por pantalla); atribución CC BY 4.0 |
| Web Speech API (`speechSynthesis`) | La voz de la radio | Integrada en el navegador | $0 | Las voces dependen del navegador y del sistema; con Microsoft Edge hay voces "Natural" sin costo |
| Google Fonts | Tipografías (Bricolage Grotesque, DM Mono, DM Serif Display) | Gratuito | $0 | Licencia OFL |

## Qué pasa si crece el uso

- **Más visitantes que usuarios mensuales gratuitos en Supabase:** el plan Pro cuesta unos 25 USD al mes y sube los límites. Para una demo de campus no hace falta.
- **Voz más uniforme en cualquier navegador:** la mejora prevista es TTS en la nube (ElevenLabs o Azure) detrás de una Edge Function de Supabase; tendría costo por carácter. Ver [Mejoras futuras](../README.md#mejoras-futuras).
- **Muchos celulares tras la misma IP:** subir el límite de inicios de sesión anónimos en *Authentication → Rate Limits* (puede requerir plan de pago según el proyecto; si no aparece, el valor `rate_limit_anonymous_users` se cambia con la API de administración de Supabase).

## Datos personales

No se pide registro a los votantes. Cada visitante recibe una sesión anónima de Supabase (un identificador aleatorio) que solo sirve para contar **un voto por ronda**; no se guarda nombre, correo ni ubicación. Las cuentas de administrador sí usan correo y contraseña, gestionadas por Supabase Auth. La clave que va en el navegador es la **clave publicable**; ninguna clave secreta está en el repositorio.
