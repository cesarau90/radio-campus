import type { RoundOption } from './round'

export type VoteStatus = 'voted' | 'already_voted' | 'closed' | 'not_found'

/** Respuesta de la RPC cast_vote. `option` es el voto del usuario (si ya votó). */
export interface VoteResult {
  ok: boolean
  status: VoteStatus
  option: RoundOption | null
}
