import type { PlannedSet } from '../types'

export function plannedLabel(s: PlannedSet) {
  const parts = [s.amrap ? `${s.reps}+ повт. (макс.)` : `${s.reps} повт.`]
  if (s.percent) parts.push(`${Math.round(s.percent * 100)}%`)
  if (s.weight) parts.push(`${s.weight} кг`)
  if (s.rpe) parts.push(`RPE ${s.rpe}`)
  return parts.join(' · ')
}

/** Сжимает одинаковые подходы: «4 × 5 повт. · 75% · 100 кг» */
export function groupSets(sets: PlannedSet[]) {
  const out: { n: number; s: PlannedSet }[] = []
  for (const s of sets) {
    const last = out[out.length - 1]
    if (last && plannedLabel(last.s) === plannedLabel(s)) last.n++
    else out.push({ n: 1, s })
  }
  return out.map(g => (g.n > 1 ? `${g.n} × ` : '') + plannedLabel(g.s))
}

/** Короткая подпись плана для таблицы подходов: «5×60», «3+×85», «8 @RPE 7», «5 · 65%» */
export function shortPlan(s: PlannedSet) {
  const r = `${s.reps}${s.amrap ? '+' : ''}`
  if (s.weight) return `${r}×${s.weight}`
  if (s.percent) return `${r} · ${Math.round(s.percent * 100)}%`
  if (s.rpe) return `${r} @${s.rpe}`
  return r
}
