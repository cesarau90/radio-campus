---
version: 2
slug: "src-pages-votar-tsx"
primary_target: "src/pages/Votar.tsx"
related_targets: []
---

# Surface brief: /votar

> Versión 2 (2026-11-14): reemplaza la dirección "papeleta en papel crema" de la versión 1 por **cartel + app de música**, tras el rediseño aprobado por el usuario.

## Scope and mode
Mode: **Operate**. Una sola tarea: elegir una de dos canciones y confirmar el voto. Móvil, de pie, con sol, atención de segundos. Sin instalar ni registrarse. También se abre en computadora.

## Audience, task, content, constraints
- Estudiante del campus, llegó por el QR de la pantalla. Un voto por ronda, definitivo (no se puede cambiar).
- Contenido real: dos canciones (portada de YouTube, título, artista, género), cuenta regresiva del servidor en mm:ss, estado del voto, ganadora y recuento al cerrar, "Sonando ahora" si hay dato.
- Estados obligatorios: conectando, sin ronda ("Aún no hay votación"), votando, voto registrado, "ya votaste" (también tras recargar), contando votos, ronda cerrada con ganadora y recuento, sin conexión, error de envío, error de conexión.
- No mostrar conteos mientras la ronda está abierta (no sesgar el voto); se muestran solo con la ronda cerrada.
- Sin emojis como íconos, sin modal de confirmación, sin botones ni secciones que no existan (nada de menú, podcasts ni reproducir).
- Datos reales siempre: nada de canciones, conteos ni "Sonando ahora" inventados.

## Direction contract
THESIS: /votar es una **app de música con pulso de radio**: portadas grandes, una pastilla EN VIVO, el contador en naranja y un solo botón. Rechaza el modal de confirmación y el botón genérico "Votar".
OWN-WORLD: un estudio de radio de noche. Foto de fondo (generada con IA, sin texto) bajo una capa oscura; superficies de café casi negro; crema para el texto; **un único acento fijo, el naranja `#FF6B00`**, que nunca cambia con la portada. Título en DM Serif Display; interfaz en Bricolage Grotesque; contador y datos en DM Mono. Tokens en `src/styles/tokens.css`: ningún hex suelto en componentes.
STORY: entiende en un vistazo que hay dos opciones y cuánto tiempo queda, elige (borde naranja de 3 px y palomita), confirma, ve "Voto registrado" y espera el resultado en la misma pantalla; al cerrar ve la ganadora con su portada y el recuento.
FIRST VIEWPORT (390x844): encabezado con la marca y EN VIVO; "La votación cierra en" con el contador en naranja y su barra; "Sonando ahora" si hay dato; título serif y subtítulo "Elige la canción que quieres escuchar"; dos tarjetas altas del mismo tamaño que reparten la altura (tope 21 rem) con portada sin deformar y etiqueta A/B chica; botón de confirmar abajo con margen seguro del teléfono. Si no cabe (pantalla baja, textos largos), la página se desplaza.
DESKTOP (≥ 900 px): contenedor de 56 rem centrado, título más grande y centrado, las dos tarjetas lado a lado, botón centrado debajo sin barra fija; cabe sin scroll en 1366x768 y 1920x1080.
STATES:
- *Ronda cerrada:* título serif; "Sonando ahora" si hay dato; la ganadora en tarjeta grande con portada 16:9, etiqueta A/B y marca "Ganadora"; recuento A contra B (votos y %, barra naranja para la ganadora); un panel sólido con qué pasó con su voto y "La siguiente ronda empieza pronto."; en escritorio, ganadora a la izquierda y recuento a la derecha.
- *Aún no hay votación:* dial de la marca con dos anillos que se expanden (se detienen con reduced-motion), título serif, "La siguiente ronda empieza pronto." y "Esta pantalla se actualiza sola.", sobre un panel oscuro translúcido; "Sonando ahora" grande si hay dato.
FORM: derivada directamente del brief y de los mockups aportados por el usuario (se descartaron del mockup: menú, botones de reproducir y la serif en la interfaz).
MOTION (Emil Kowalski): solo transform y opacidad, ease-out, < 300 ms. Momentos: el sello "Voto registrado" (escala 1.3 a 1, 280 ms), el pulso del punto de EN VIVO, los anillos del dial. Feedback `:active` a scale(0.98). Sin animación al recargar si ya votó. `prefers-reduced-motion` respetado.
FINISH: contraste ≥ 4,5:1 medido en el navegador sobre la foto y las superficies; foco al título tras votar y `role="status"` montado desde el inicio; evidencias en `docs/evidencias/fase5/rediseno/`.

## Unresolved
- Contador urgente (≤ 10 s) y ronda cerrada reales: pendientes de capturar con la ronda de prueba.
- DESIGN.md con el sistema visual: opcional, después del rediseño.
