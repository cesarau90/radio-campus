/**
 * Qué muestra /pantalla:
 * - connecting: sesión, reloj o datos aún cargando
 * - error: no se pudo conectar ni cargar
 * - voting: ronda abierta (suena una canción y se vota la siguiente)
 * - result: la ronda cerró; se anuncia la ganadora mientras termina la canción en curso
 * - idle: sin ronda todavía (arrancando la radio) o en pausa
 */
export type PantallaViewName = 'connecting' | 'error' | 'voting' | 'result' | 'idle'
