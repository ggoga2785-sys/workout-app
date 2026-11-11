/**
 * Приоритеты движений пауэрлифтинга.
 * Программа подбирается по «главным» движениям, затем недели правятся под остальные:
 *  - high: если движения нет в программе — добавляется 2 раза в неделю (тяжёлый и лёгкий день),
 *          интенсивность следует за главным движением этой недели;
 *  - low:  остаётся одна тренировка в неделю, объём урезан примерно до 60%;
 *          если движения нет — добавляется раз в неделю 3×3 умеренно;
 *  - off:  движение и его вариации убираются.
 */
import type { Exercise, LiftPriorities, MainLift, PlannedExercise, PlannedSet, PowerliftingFocus, ProgramWeek } from '../types'
import { roundTo } from './util'
import { LIFT_LABELS } from '../data/labels'

export const LIFTS: MainLift[] = ['squat', 'bench', 'deadlift']

export const DEFAULT_PRIORITY: LiftPriorities = { squat: 'main', bench: 'main', deadlift: 'main' }

export const PRESETS: { label: string; p: LiftPriorities }[] = [
  { label: 'Троеборье', p: { squat: 'main', bench: 'main', deadlift: 'main' } },
  { label: 'Жим + присед, тяга изредка', p: { squat: 'high', bench: 'main', deadlift: 'low' } },
  { label: 'Только жим', p: { squat: 'off', bench: 'main', deadlift: 'off' } },
  { label: 'Присед', p: { squat: 'main', bench: 'high', deadlift: 'low' } },
  { label: 'Тяга', p: { squat: 'high', bench: 'high', deadlift: 'main' } },
]

/** По каким движениям подбирать основную программу */
export function focusFrom(pr: LiftPriorities): PowerliftingFocus {
  let main = LIFTS.filter(l => pr[l] === 'main')
  if (!main.length) main = LIFTS.filter(l => pr[l] === 'high')
  return main.length === 1 ? main[0] : 'total'
}

export const activeLifts = (pr: LiftPriorities) => LIFTS.filter(l => pr[l] !== 'off')

export function describePriorities(pr: LiftPriorities): string[] {
  const out: string[] = []
  const focus = focusFrom(pr)
  for (const l of LIFTS) {
    const name = LIFT_LABELS[l].toLowerCase()
    if (pr[l] === 'off') out.push(`${name} убран`)
    else if (pr[l] === 'low') out.push(`${name} — раз в неделю, поддерживающий объём`)
    else if (pr[l] === 'high' && focus !== 'total' && focus !== l) out.push(`${name} добавлен 2 раза в неделю`)
  }
  return out
}

const sets = (n: number, s: PlannedSet) => Array.from({ length: n }, () => ({ ...s }))

export function applyPriorities(
  weeks: ProgramWeek[], pr: LiftPriorities, orm: Partial<Record<MainLift, number>>, rounding: number,
  exMap: Map<string, Exercise>, compWeekLast: boolean,
): ProgramWeek[] {
  const liftOf = (e: PlannedExercise) => exMap.get(e.exerciseId)?.lift
  const mains = LIFTS.filter(l => pr[l] === 'main')
  const w8 = (l: MainLift, pct: number) => (orm[l] ? roundTo(orm[l]! * pct, rounding) : undefined)

  return weeks.map((week, wi) => {
    const compWeek = compWeekLast && wi === weeks.length - 1
    // Интенсивность недели — по самому тяжёлому подходу главного движения
    let top = 0
    for (const d of week.days) for (const e of d.exercises) {
      const l = liftOf(e)
      if (l && (mains.includes(l) || !mains.length)) for (const s of e.sets) top = Math.max(top, s.percent ?? 0)
    }
    if (!top) top = 0.75
    top = Math.min(top, 0.9)
    // Разгрузка и неделя перед стартом — добавленные движения только лёгкие
    const easy = /разгруз|снижен|подводк/i.test(week.block) || (compWeekLast && wi === weeks.length - 2)
    if (easy) top = Math.min(top, 0.72)

    let days = week.days.map(d => ({ ...d, exercises: [...d.exercises] }))
    const trainDays = days.map((d, i) => (d.exercises.length ? i : -1)).filter(i => i >= 0)

    for (const l of LIFTS) {
      const has = days.map(d => d.exercises.some(e => liftOf(e) === l))
      const present = has.some(Boolean)
      if (pr[l] === 'off') {
        days = days.map(d => ({ ...d, exercises: d.exercises.filter(e => liftOf(e) !== l) }))
      } else if (pr[l] === 'low') {
        if (present) {
          const keepDay = has.indexOf(true)
          days = days.map((d, i) => {
            if (i !== keepDay) return { ...d, exercises: d.exercises.filter(e => liftOf(e) !== l) }
            let kept = false
            return {
              ...d,
              exercises: d.exercises.flatMap(e => {
                if (liftOf(e) !== l) return [e]
                if (kept) return []
                kept = true
                return [{ ...e, sets: e.sets.slice(0, Math.max(2, Math.ceil(e.sets.length * 0.6))), note: 'поддержка' }]
              }),
            }
          })
        } else if (!compWeek && trainDays.length) {
          const di = trainDays[trainDays.length - 1]
          const pct = Math.min(0.75, top - 0.1)
          days[di].exercises.push({ exerciseId: l, sets: sets(3, { reps: 3, percent: pct, weight: w8(l, pct) }), restSec: 180, note: 'поддержка' })
        }
      } else if (!present && !compWeek && trainDays.length) {
        // high (или main без программы под него): тяжёлый и лёгкий день
        const heavyPct = Math.max(0.65, top - 0.05)
        const reps = heavyPct >= 0.85 ? 2 : heavyPct >= 0.78 ? 3 : 5
        const lightPct = Math.max(0.6, top - 0.15)
        const a = trainDays[0]
        const b = trainDays.length > 1 ? trainDays[trainDays.length > 2 ? 2 : 1] : -1
        const insert = (di: number, e: PlannedExercise) => days[di].exercises.splice(Math.min(1, days[di].exercises.length), 0, e)
        insert(a, { exerciseId: l, sets: sets(easy ? 3 : 4, { reps, percent: heavyPct, weight: w8(l, heavyPct) }), restSec: 210, note: 'добавлено по приоритету' })
        if (b >= 0) insert(b, { exerciseId: l, sets: sets(3, { reps: 5, percent: lightPct, weight: w8(l, lightPct) }), restSec: 180, note: 'лёгкий день' })
      }
    }
    // Дни, ставшие пустыми после удаления, убираем (день соревнований пустой изначально — оставляем)
    days = days.filter((d, i) => d.exercises.length > 0 || week.days[i].exercises.length === 0)
    return { ...week, days }
  })
}
