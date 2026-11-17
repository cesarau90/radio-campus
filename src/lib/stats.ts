import type { Round } from '../types'

export type RoundStatRow = Pick<Round, 'option_a' | 'option_b' | 'votes_a' | 'votes_b' | 'status' | 'resolution'>

export interface RoundStats {
  /** Rondas creadas (abiertas y cerradas). */
  rounds: number
  /** Votos emitidos en todas las rondas. */
  votes: number
  /** Promedio de votos por ronda (un decimal). */
  avgVotes: number
  /** Rondas cerradas en las que nadie votó. */
  noVotes: number
  /** Rondas cerradas que terminaron en empate. */
  ties: number
  /** Canciones con más votos (como opción A o B en cualquier ronda), de mayor a menor. */
  top: Array<{ songId: string; votes: number }>
}

/** Calcula las estadísticas de participación a partir de las rondas. Pura: no consulta nada. */
export function computeStats(rows: RoundStatRow[], topSize = 5): RoundStats {
  const perSong = new Map<string, number>()
  let votes = 0
  let noVotes = 0
  let ties = 0
  for (const r of rows) {
    votes += r.votes_a + r.votes_b
    perSong.set(r.option_a, (perSong.get(r.option_a) ?? 0) + r.votes_a)
    perSong.set(r.option_b, (perSong.get(r.option_b) ?? 0) + r.votes_b)
    if (r.status === 'closed' && r.resolution === 'sin_votos') noVotes++
    if (r.status === 'closed' && r.resolution === 'empate') ties++
  }
  const top = [...perSong.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, topSize)
    .map(([songId, v]) => ({ songId, votes: v }))
  return {
    rounds: rows.length,
    votes,
    avgVotes: rows.length ? Math.round((votes / rows.length) * 10) / 10 : 0,
    noVotes,
    ties,
    top,
  }
}
