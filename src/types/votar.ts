/**
 * Qué pantalla de /votar corresponde mostrar:
 * - connecting: sesión, reloj o datos aún cargando
 * - error: no se pudo iniciar sesión o cargar (se ofrece reintentar)
 * - no-round: no hay ninguna ronda todavía
 * - voting: ronda abierta, aún sin voto
 * - voted: ronda abierta, ya votó (recién o antes de recargar)
 * - counting: venció el tiempo y el servidor aún está contando
 * - closed: ronda cerrada, se muestra la ganadora
 */
export type VotarView = 'connecting' | 'error' | 'no-round' | 'voting' | 'voted' | 'counting' | 'closed'

/** Una fila del recuento final de una ronda cerrada (opción, canción, votos y porcentaje). */
export interface TallyRow {
  option: 'a' | 'b'
  title: string
  votes: number
  /** 0–100; las dos filas suman 100 (o 0 si nadie votó). */
  percent: number
  isWinner: boolean
}
