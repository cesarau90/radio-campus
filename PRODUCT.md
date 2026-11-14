# Product

<!-- impeccable:product-schema 1 -->

> Redactado a partir del brief del usuario (sin entrevista de init, con su aprobación implícita al pedir continuar). Lo marcado como *inferido* o *sin decidir* no fue confirmado.

## Platform

web

## Users

- **Estudiantes del campus (Tampico)**, desde su celular, sin instalar nada. Llegan escaneando el QR de la pantalla del campus, de pie o caminando, a veces con sol y con poca atención. Su trabajo: elegir entre dos canciones y saber que su voto cuenta. *Inferido:* usan el navegador del celular, sin cuenta, y la sesión dura segundos.
- **Pantalla del campus (TV horizontal)**, vista a distancia por muchas personas a la vez. Es también el "reproductor" que toca la música.
- **Administrador (personal escolar)**, desde computadora o tableta. Configura canciones, reglas, anuncios y vigila la operación.

## Product Purpose

"Sistema de Radio Inteligente e Interactiva para el Campus": un proyecto escolar. Una radio del campus que elige sola dos canciones según el contexto (hora, clima, eventos como exámenes o festividades) y deja que la comunidad vote cuál suena después. Éxito: una ronda completa con varios celulares (dos canciones contextuales, QR, votos, cierre automático, resultado y reproducción de la ganadora), y que se demuestre que un cambio de contexto cambia las opciones.

## Positioning

La radio responde a **dónde y cuándo está el campus** (exámenes → instrumental, calor → moods frescos, Navidad → villancicos) y a **lo que vota la gente**, sin servidor propio, con servicios gratuitos y reproducción real vía YouTube.

## Operating Context

- Rutas: `/pantalla` (TV, controla YouTube, voz y avance de rondas), `/votar` (móvil), `/admin` (login, computadora y tableta).
- Una ronda dura lo que dura la canción en curso menos 10 s (con mínimo configurable); el servidor decide todos los tiempos con su propio reloj.
- Cada visitante vota una vez por ronda mediante sesión anónima de Supabase. No hay registro.
- Se despliega en Vercel (HTTPS) y se prueba en celulares reales. Es un entregable escolar: el historial de commits y la documentación se evalúan.

## Capabilities and Constraints

- Stack obligatorio: React + Vite + TypeScript + React Router, Supabase (Postgres, Auth, Realtime, RPC), Vercel, YouTube IFrame API, Open-Meteo, Web Speech API, qrcode.react.
- Toda la lógica en hooks (`src/hooks`); los componentes solo reciben props; tipos en `src/types` con barrel.
- Estados de `/votar` que deben existir: ronda abierta con dos opciones, voto confirmado, "ya votaste" (también tras recargar), ronda cerrada, sin ronda activa, sin conexión.
- Terminología: "ronda", "votar", "ganadora", "pantalla", "siguiente canción". Idioma: español de México.
- *Sin decidir:* qué mostrar a quien llega con la ronda cerrada (resultado de la última ronda vs. solo "espera la siguiente").

## Brand Commitments

Nombre de trabajo: **Radio Campus**. Dirección visual aprobada por el usuario en la Fase 0: *cartel de radio universitaria* (ver `src/index.css`). No hay logotipo ni nombre institucional definido.

## Evidence on Hand

- 39 canciones reales verificadas (oEmbed), con duración, género, energía y mood: `supabase/seed.sql`.
- No hay logotipo, nombre de la escuela, ni textos institucionales: no inventarlos.

## Product Principles

1. El voto debe sentirse instantáneo y definitivo: el estudiante tiene unos segundos de atención.
2. Cada estado explica qué pasó y qué sigue ("ya votaste", "ronda cerrada", "sin conexión"); nunca un error técnico crudo.
3. La verdad la tiene el servidor: ni el reloj ni el estado del celular deciden tiempos ni resultados.
4. Funciona sin instalar nada y sin registrarse, en cualquier celular con navegador.

## Accessibility & Inclusion

Legible a la luz del sol (alto contraste), objetivos táctiles amplios, respeta `prefers-reduced-motion`, estado del voto comunicado con texto y no solo con color. Español de México.
