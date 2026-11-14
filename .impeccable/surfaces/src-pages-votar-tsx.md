---
version: 1
slug: "src-pages-votar-tsx"
primary_target: "src/pages/Votar.tsx"
related_targets: []
---

# Surface brief: /votar

## Scope and mode
Mode: **Operate**. Una sola tarea: elegir una de dos canciones y confirmar el voto. Móvil, de pie, con sol, atención de segundos. Sin instalar ni registrarse.

## Audience, task, content, constraints
- Estudiante del campus, llegó por el QR de la pantalla. Un voto por ronda, definitivo (no se puede cambiar).
- Contenido real: dos canciones (título, artista, género), cuenta regresiva del servidor, estado del voto, ganadora al cerrar.
- Estados obligatorios: conectando, sin ronda, votando, voto registrado, "ya votaste" (también tras recargar), contando votos, ronda cerrada con ganadora, sin conexión, error de envío.
- No mostrar conteos mientras la ronda está abierta (no sesgar el voto); eso es de la TV.
- Sin emojis como íconos, sin tarjetas iguales en rejilla, sin modal de confirmación.

## Direction contract
THESIS: /votar es una **papeleta**, no una app: dos paneles enormes, un toque elige, un botón fijo confirma y el voto se sella. Rechaza la rejilla de tarjetas, el modal de confirmación y el botón genérico "Votar".
OWN-WORLD: el mundo ya aprobado, "cartel de radio universitaria": papel crema `--paper` de fondo (se lee al sol), tinta `--ink` y naranja señal `--signal`. Bricolage Grotesque para todo; DM Mono solo para la cuenta regresiva y los conteos (medición). Opción A = bloque de tinta, opción B = bloque naranja: dos estaciones del dial. Letras A y B gigantes como firma. Esquinas casi rectas.
STORY: entiende en un vistazo que hay dos opciones y cuánto tiempo queda, elige, confirma, ve el sello "Voto registrado" y espera el resultado en la misma pantalla.
FIRST VIEWPORT (390x844): barra superior con marca y cuenta regresiva en mono grande, con filete de progreso; título "¿Qué suena después?"; los dos paneles llenan el alto restante (letra gigante, título, artista, género); barra fija inferior con el botón de confirmar, con el margen seguro del teléfono.
FORM: papeleta en el mundo establecido; derivada directamente del brief (superficie precisa, sin torneo de conceptos). seed: none (unavailable)
MOTION (Emil Kowalski): un momento autorizado, el sello. Al confirmar, el sello baja (rotación leve, escala 1.3 a 1, opacidad, 280 ms, ease-out) y el panel no elegido se atenúa. Todo lo demás es feedback mínimo: `:active` a scale(0.98) en 120 ms, transiciones solo de transform y opacidad, nada desde scale(0), sin animación al recargar si ya votó, `prefers-reduced-motion` respetado.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved
- Qué mostrar tras cerrar: se muestra la ganadora y los conteos finales (decisión mía, corregible).
- Fuente: las fuentes vienen de Google Fonts (como en la Fase 0).
