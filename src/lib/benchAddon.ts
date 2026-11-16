/**
 * «Жим лёжа по циклу» для бодибилдинговых программ: в дни верха (где есть работа на грудь)
 * первым упражнением ставится жим лёжа из выбранной жимовой программы базы пауэрлифтинга
 * (или своей периодизации), веса — от 1ПМ в жиме. Подсобка жимовой программы не берётся —
 * её роль выполняет бодибилдинговая часть. Если жимовая программа короче — цикл повторяется.
 */
import type { CatalogProgram, Exercise, Level, PlannedExercise, Program, ProgramWeek } from '../types'
import type { Catalog } from './catalog'
import { instantiate } from './catalog'
import { generateProgram } from './generator'

export interface BenchChoice { id: string; name: string; days: number; weeks: number; recommended?: boolean }

const LV: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 }

/** Жимовые программы из базы + своя периодизация; рекомендуется ближайшая по числу дней верха и уровню */
export function benchChoices(c: Catalog, upperDays: number, level: Level): BenchChoice[] {
  const list: (BenchChoice & { score: number })[] = c.programs
    .filter(p => p.discipline === 'powerlifting' && p.plFocus === 'bench')
    .map(p => ({ id: p.id, name: p.name, days: p.daysPerWeek, weeks: p.durationWeeks,
      score: Math.abs(p.daysPerWeek - upperDays) * 2 + Math.max(0, LV[p.level] - LV[level]) * 2 }))
  list.push({ id: 'generic', name: 'Своя периодизация жима (волны по 4 недели)', days: upperDays, weeks: 0, score: 1.5 })
  list.sort((a, b) => a.score - b.score)
  return list.map(({ score: _s, ...x }, i) => ({ ...x, recommended: i === 0 }))
}

/** Дни верха: те, где есть работа на грудь */
export function upperDayIdx(week: ProgramWeek, exMap: Map<string, Exercise>): number[] {
  return week.days.map((d, i) => (d.exercises.some(e => exMap.get(e.exerciseId)?.primary === 'chest') ? i : -1)).filter(i => i >= 0)
}

const MAX = 12

export function addBenchCycle(
  prog: Program, c: Catalog, choiceId: string, bench1RM: number, rounding: number, exMap: Map<string, Exercise>,
): Program {
  const ups = prog.weeks.map(w => upperDayIdx(w, exMap))
  const nUp = Math.max(1, ...ups.map(u => u.length))
  let src: ProgramWeek[]
  let name: string
  if (choiceId === 'generic') {
    const g = generateProgram({ discipline: 'powerlifting', level: prog.settings.level, daysPerWeek: nUp, weeks: prog.weeks.length,
      plFocus: 'bench', plPhase: 'offseason', plMethod: 'generic' }, { bench: bench1RM }, rounding)
    src = g.weeks
    name = 'своя периодизация'
  } else {
    const cp = c.programs.find(p => p.id === choiceId) as CatalogProgram
    src = instantiate(cp, { bench: bench1RM }, rounding, exMap).weeks
    name = cp.name
  }
  const isBench = (e: PlannedExercise) => exMap.get(e.exerciseId)?.lift === 'bench'

  const weeks = prog.weeks.map((w, wi) => {
    // В разгрузочную неделю бодибилдинга берём разгрузочную неделю жимового цикла (если она есть)
    const deload = /разгруз/i.test(w.block)
    const srcDeload = src.find(x => /разгруз|снижен/i.test(x.block))
    const bw = deload && srcDeload ? srcDeload : src[wi % src.length]
    const lap = deload ? 0 : Math.floor(wi / src.length)
    // Жимовые упражнения по дням жимовой программы
    const benchDays = bw.days.map(d => d.exercises.filter(isBench)).filter(x => x.length)
    const up = ups[wi]
    if (!up.length || !benchDays.length) return w
    const days = w.days.map(d => ({ ...d, exercises: [...d.exercises] }))
    // Дней жима больше, чем дней верха — лишние сливаем в ближайший день (не больше 12 подходов)
    const perUp: PlannedExercise[][] = up.map(() => [])
    benchDays.forEach((ex, i) => {
      const t = Math.min(up.length - 1, Math.round((i * (up.length - 1)) / Math.max(1, benchDays.length - 1)))
      for (const e of ex) {
        const same = perUp[t].find(x => x.exerciseId === e.exerciseId)
        if (same) same.sets = [...same.sets, ...e.sets].slice(0, MAX)
        else perUp[t].push({ ...e, sets: (deload && !srcDeload ? e.sets.filter(x => (x.percent ?? 0) <= 0.75) : e.sets).slice(0, MAX), note: e.note ?? `жим по циклу (${bw.block}${lap ? `, круг ${lap + 1}` : ''})` })
      }
    })
    up.forEach((di, k) => {
      if (!perUp[k].length) return
      // Бодибилдинговый жим штанги лёжа заменяется циклом, остальная работа сохраняется
      days[di].exercises = [...perUp[k], ...days[di].exercises.filter(e => e.exerciseId !== 'bench')]
    })
    return { ...w, days }
  })
  return {
    ...prog,
    weeks,
    name: `${prog.name} + жим по циклу`,
    oneRepMax: { ...prog.oneRepMax, bench: bench1RM },
    description: `${prog.description} Жим лёжа в дни верха идёт по циклу: ${name}.`,
  }
}
