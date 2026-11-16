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

export const PRESETS: { label: string; p: LiftPriorities; f?: Partial<Record<MainLift, number>>; days?: Partial<Record<MainLift, number[]>> }[] = [
  { label: 'Троеборье', p: { squat: 'main', bench: 'main', deadlift: 'main' } },
  { label: 'Жим + присед, тяга изредка', p: { squat: 'high', bench: 'main', deadlift: 'low' }, f: { bench: 2, squat: 2, deadlift: 0.5 }, days: { bench: [0, 2], squat: [0, 1], deadlift: [1] } },
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

/** Не больше 12 подходов одного упражнения за тренировку: при слиянии оставляем самые тяжёлые, по возрастанию */
const MAX_SETS = 12
function capSets(list: PlannedSet[]): PlannedSet[] {
  if (list.length <= MAX_SETS) return list
  const key = (x: PlannedSet) => x.percent ?? x.rpe ?? 0
  return [...list].sort((a, b) => key(b) - key(a)).slice(0, MAX_SETS).sort((a, b) => key(a) - key(b))
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
    const loadOf = (i: number) => days[i].exercises.filter(e => liftOf(e)).length

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
          const di = [...trainDays].sort((x, y) => loadOf(x) - loadOf(y) || y - x)[0]
          const pct = Math.min(0.75, top - 0.1)
          days[di].exercises.splice(days[di].exercises.map(x => !!liftOf(x)).lastIndexOf(true) + 1, 0, { exerciseId: l, sets: sets(3, { reps: 3, percent: pct, weight: w8(l, pct) }), restSec: 180, note: 'поддержка' })
        }
      } else if (!present && !compWeek && trainDays.length) {
        // high (или main без программы под него): тяжёлый и лёгкий день
        const heavyPct = Math.max(0.65, top - 0.05)
        const reps = heavyPct >= 0.85 ? 2 : heavyPct >= 0.78 ? 3 : 5
        const lightPct = Math.max(0.6, top - 0.15)
        // Тяжёлый — в день, где меньше всего соревновательных движений; лёгкий — в следующий по загрузке
        const byLoad = [...trainDays].sort((x, y) => loadOf(x) - loadOf(y) || x - y)
        const a = byLoad[0]
        const b = byLoad.length > 1 ? byLoad[1] : -1
        const insert = (di: number, e: PlannedExercise) => days[di].exercises.splice(days[di].exercises.map(x => !!liftOf(x)).lastIndexOf(true) + 1, 0, e)
        insert(a, { exerciseId: l, sets: sets(easy ? 3 : 4, { reps, percent: heavyPct, weight: w8(l, heavyPct) }), restSec: 210, note: 'добавлено по приоритету' })
        if (b >= 0) insert(b, { exerciseId: l, sets: sets(3, { reps: 5, percent: lightPct, weight: w8(l, lightPct) }), restSec: 180, note: 'лёгкий день' })
      }
    }
    // Дни, ставшие пустыми после удаления, убираем (день соревнований пустой изначально — оставляем)
    days = days.filter((d, i) => d.exercises.length > 0 || week.days[i].exercises.length === 0)
    return { ...week, days }
  })
}

export const FREQ_OPTIONS: [number, string][] = [[0, 'как в программе'], [0.5, 'раз в 2 нед.'], [1, '1'], [2, '2'], [3, '3']]

export function describeFrequency(f: Partial<Record<MainLift, number>> | undefined): string[] {
  if (!f) return []
  return LIFTS.filter(l => f[l]).map(l => `${LIFT_LABELS[l].toLowerCase()}: ${f[l] === 0.5 ? 'раз в 2 недели' : `${f[l]} раз(а) в неделю`}`)
}

/** Равномерно выбирает k дней из списка тренировочных (для 3 дней и k=2 — первый и последний) */
function spread(days: number[], k: number): number[] {
  if (k >= days.length) return days
  if (k === 1) return [days[0]]
  return Array.from({ length: k }, (_, i) => days[Math.round((i * (days.length - 1)) / (k - 1))])
}

/**
 * Частота движений: оставляет движение только в выбранных днях,
 * а объём из убранных дней переносит в ближайший оставшийся (недельный объём сохраняется).
 * Раз в 2 недели — на нечётных неделях движение убирается совсем.
 */
export function applyFrequency(
  weeks: ProgramWeek[], freq: Partial<Record<MainLift, number>>, orm: Partial<Record<MainLift, number>>, rounding: number,
  exMap: Map<string, Exercise>, compWeekLast: boolean,
): ProgramWeek[] {
  const liftOf = (e: PlannedExercise) => exMap.get(e.exerciseId)?.lift
  return weeks.map((week, wi) => {
    const compWeek = compWeekLast && wi === weeks.length - 1
    const days = week.days.map(d => ({ ...d, exercises: d.exercises.map(e => ({ ...e, sets: [...e.sets] })) }))
    const train = days.map((d, i) => (d.exercises.length ? i : -1)).filter(i => i >= 0)
    for (const l of LIFTS) {
      const f = freq[l]
      if (!f || compWeek) continue
      const withLift = train.filter(i => days[i].exercises.some(e => liftOf(e) === l))
      if (f === 0.5 && wi % 2 === 1) {
        withLift.forEach(i => { days[i].exercises = days[i].exercises.filter(e => liftOf(e) !== l) })
        continue
      }
      const k = Math.max(1, Math.round(f))
      if (withLift.length > k) {
        // Оставляем дни, разнесённые по неделе (пн и пт, а не пн и ср)
        const keep = spread(train, k).map(t => withLift.reduce((best, i) => (Math.abs(i - t) < Math.abs(best - t) ? i : best)))
        const keepSet = [...new Set(keep)]
        for (const i of withLift) {
          if (keepSet.includes(i)) continue
          const moved = days[i].exercises.filter(e => liftOf(e) === l)
          days[i].exercises = days[i].exercises.filter(e => liftOf(e) !== l)
          const target = keepSet.reduce((best, j) => (Math.abs(j - i) < Math.abs(best - i) ? j : best))
          for (const m of moved) {
            const same = days[target].exercises.find(e => e.exerciseId === m.exerciseId)
            if (same) same.sets = capSets([...same.sets, ...m.sets])
            else {
              const lastIdx = days[target].exercises.map(e => liftOf(e) === l).lastIndexOf(true)
              days[target].exercises.splice(lastIdx + 1, 0, { ...m, note: m.note ? `${m.note}; перенесено` : 'перенесено с другого дня' })
            }
          }
        }
      } else if (withLift.length && withLift.length < k) {
        // Добавляем лёгкие дни: 3×5 на 60–70% от 1ПМ
        const free = train.filter(i => !withLift.includes(i))
        const add = spread(free, k - withLift.length)
        let top = 0
        for (const i of withLift) for (const e of days[i].exercises) if (liftOf(e) === l) for (const s of e.sets) top = Math.max(top, s.percent ?? 0)
        const pct = Math.max(0.6, Math.min(0.7, (top || 0.8) - 0.15))
        const w = orm[l] ? roundTo(orm[l]! * pct, rounding) : undefined
        for (const i of add) days[i].exercises.splice(days[i].exercises.map(x => !!liftOf(x)).lastIndexOf(true) + 1, 0,
          { exerciseId: l, sets: sets(3, { reps: 5, percent: pct, weight: w }), restSec: 180, note: 'лёгкий день' })
      }
    }
    return { ...week, days: days.filter((d, i) => d.exercises.length > 0 || week.days[i].exercises.length === 0) }
  })
}

const DAY_NAMES_3 = ['пн', 'ср', 'пт']
export const dayName = (i: number, n: number) => (n === 3 ? DAY_NAMES_3[i] : `д${i + 1}`)

export function describeDays(d: Partial<Record<MainLift, number[]>> | undefined, n: number): string[] {
  if (!d) return []
  return LIFTS.filter(l => d[l]?.length).map(l => `${LIFT_LABELS[l].toLowerCase()}: ${d[l]!.map(i => dayName(i, n)).join(', ')}`)
}

/** Подсобка, которая «принадлежит» движению: уходит вместе с ним из незакреплённых дней */
const ASSIST_PRIMARY: Record<MainLift, string[]> = { bench: ['chest', 'triceps'], squat: ['quads'], deadlift: [] }

/**
 * Закрепление движений за днями. Из остальных дней движение (и его подсобка) переносится
 * в ближайший закреплённый день. В дне, где есть другое главное движение, это движение — лёгкое
 * (3×5 на ~65–70%), а основной объём уходит в закреплённый день без других главных движений.
 * Главные движения ставятся в начало тренировки.
 */
export function applyDayPins(
  weeks: ProgramWeek[], pins: Partial<Record<MainLift, number[]>>, pr: LiftPriorities,
  orm: Partial<Record<MainLift, number>>, rounding: number, exMap: Map<string, Exercise>, compWeekLast: boolean,
): ProgramWeek[] {
  const liftOf = (e: PlannedExercise) => exMap.get(e.exerciseId)?.lift
  const rank = (e: PlannedExercise) => {
    const l = liftOf(e)
    if (!l) return 9
    return { main: 0, high: 1, low: 2, off: 3 }[pr[l]] + (exMap.get(e.exerciseId)?.competition ? 0 : 0.5)
  }
  return weeks.map((week, wi) => {
    if (compWeekLast && wi === weeks.length - 1) return week
    const days = week.days.map(d => ({ ...d, exercises: d.exercises.map(e => ({ ...e, sets: [...e.sets] })) }))
    const n = days.length
    for (const l of LIFTS) {
      const p = pins[l]
      if (!p?.length || pr[l] === 'off' || p.some(i => i >= n)) continue
      // Пины только переставляют: если на этой неделе движения нет (например, тяга раз в 2 недели) — не добавляем
      if (!days.some(d => d.exercises.some(e => liftOf(e) === l))) continue
      const belongs = (e: PlannedExercise) => liftOf(e) === l ||
        (!liftOf(e) && ASSIST_PRIMARY[l].includes(exMap.get(e.exerciseId)?.primary ?? ''))
      const nearest = (i: number) => p.reduce((b, j) => (Math.abs(j - i) < Math.abs(b - i) ? j : b))
      const otherMain = (i: number) => days[i].exercises.some(e => { const x = liftOf(e); return x && x !== l && pr[x] === 'main' })
      // В каких закреплённых днях движение тяжёлое: где нет другого главного (если таких нет — во всех)
      const heavyDays = p.filter(i => !otherMain(i))
      const heavy = heavyDays.length ? heavyDays : p
      // 1) убираем из незакреплённых дней
      for (let i = 0; i < n; i++) {
        if (p.includes(i)) continue
        const moved = days[i].exercises.filter(belongs)
        if (!moved.length) continue
        days[i].exercises = days[i].exercises.filter(e => !belongs(e))
        const t = heavy.includes(nearest(i)) ? nearest(i) : heavy[0]
        for (const m of moved) {
          const same = days[t].exercises.find(e => e.exerciseId === m.exerciseId)
          if (same) same.sets = capSets([...same.sets, ...m.sets])
          else days[t].exercises.push({ ...m })
        }
      }
      // 2) в «лёгких» днях оставляем только лёгкий вариант, объём — в тяжёлый день
      let top = 0
      for (const d of days) for (const e of d.exercises) if (liftOf(e) === l) for (const s of e.sets) top = Math.max(top, s.percent ?? 0)
      const lightPct = Math.max(0.6, Math.min(0.7, (top || 0.8) - 0.15))
      const lightSets = () => sets(3, { reps: 5, percent: lightPct, weight: orm[l] ? roundTo(orm[l]! * lightPct, rounding) : undefined })
      for (const i of p) {
        if (heavy.includes(i)) continue
        const mine = days[i].exercises.filter(e => liftOf(e) === l)
        if (mine.length) {
          days[i].exercises = days[i].exercises.filter(e => liftOf(e) !== l)
          const t = heavy[0]
          for (const m of mine) {
            const same = days[t].exercises.find(e => e.exerciseId === m.exerciseId)
            if (same) same.sets = capSets([...same.sets, ...m.sets])
            else days[t].exercises.push({ ...m })
          }
        }
        const pos = days[i].exercises.map(x => !!liftOf(x)).lastIndexOf(true) + 1
        days[i].exercises.splice(pos, 0, { exerciseId: l, sets: lightSets(), restSec: 180, note: 'лёгкий' })
      }
      // 3) в тяжёлых закреплённых днях без движения — добавляем рабочие подходы
      const anyHeavy = heavy.some(i => days[i].exercises.some(e => liftOf(e) === l && e.note !== 'лёгкий'))
      if (!anyHeavy && heavy.some(i => !p.includes(i) || !otherMain(i))) {
        const pct = Math.max(0.7, Math.min(0.85, (top || 0.8) - 0.05))
        const t = heavy[0]
        days[t].exercises.push({ exerciseId: l, sets: sets(4, { reps: pct >= 0.8 ? 3 : 5, percent: pct, weight: orm[l] ? roundTo(orm[l]! * pct, rounding) : undefined }), restSec: 210 })
      }
    }
    // Главные движения — в начало, порядок остального сохраняем
    for (const d of days) d.exercises = d.exercises.map((e, i) => ({ e, i })).sort((a, b) => rank(a.e) - rank(b.e) || a.i - b.i).map(x => x.e)
    return { ...week, days: days.filter((d, i) => d.exercises.length > 0 || week.days[i].exercises.length === 0) }
  })
}
