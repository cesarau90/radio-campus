/** Porcentajes enteros de A y B que suman 100. Sin votos: 0 y 0. */
export function percentages(votesA: number, votesB: number): { a: number; b: number } {
  const total = votesA + votesB
  if (total <= 0) return { a: 0, b: 0 }
  const a = Math.round((votesA / total) * 100)
  return { a, b: 100 - a }
}
