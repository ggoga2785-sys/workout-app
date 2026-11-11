/**
 * Генератор программ — ЧЕРНОВОЙ.
 * Шаблоны ниже задают структуру (блоки, недели, дни, подходы, % от 1ПМ),
 * чтобы приложение работало от начала до конца. Конкретные методики
 * (по материалам из папки «Фитнес», Верхошанский, Шейко и т.д.) будут
 * подставлены сюда отдельно — интерфейс generateProgram() останется прежним.
 */
import type {
  MainLift, PlannedExercise, PlannedSet, Program, ProgramDay, ProgramSettings, ProgramWeek
} from '../types'
import { DISCIPLINE_LABELS, BB_GOAL_LABELS, PL_FOCUS_LABELS, PL_METHOD_LABELS, PL_PHASE_LABELS } from '../data/labels'
import { roundTo, uid, weeksUntil } from './util'

type OneRM = Partial<Record<MainLift, number>>

const sets = (n: number, s: PlannedSet): PlannedSet[] => Array.from({ length: n }, () => ({ ...s }))
const ex = (exerciseId: string, s: PlannedSet[], restSec = 90, note?: string): PlannedExercise =>
  ({ exerciseId, sets: s, restSec, note })

// ================= Бодибилдинг и фитнес =================

interface RepScheme { compound: [number, number]; isolation: [number, number]; reps: [number, number]; rest: number }

const BB_SCHEMES: Record<string, RepScheme> = {
  mass:    { compound: [4, 4], isolation: [3, 3], reps: [6, 10], rest: 120 },
  recomp:  { compound: [3, 4], isolation: [3, 3], reps: [8, 12], rest: 90 },
  cut:     { compound: [3, 3], isolation: [3, 3], reps: [10, 15], rest: 60 },
  fitness: { compound: [3, 3], isolation: [2, 2], reps: [12, 15], rest: 60 },
}

// Сплиты: списки упражнений [id, базовое?]
type Slot = [string, boolean]
const SPLITS: Record<number, { title: string; slots: Slot[] }[]> = {
  2: [
    { title: 'Всё тело А', slots: [['squat', true], ['bench', true], ['lat-pulldown', true], ['db-press', true], ['leg-curl-lying', false], ['plank', false]] },
    { title: 'Всё тело Б', slots: [['deadlift', true], ['db-incline', true], ['seated-row', true], ['leg-press', true], ['db-curl', false], ['pushdown', false]] },
  ],
  3: [
    { title: 'Всё тело А', slots: [['squat', true], ['bench', true], ['bb-row', true], ['lateral-raise', false], ['ez-curl', false], ['crunch', false]] },
    { title: 'Всё тело Б', slots: [['deadlift', true], ['ohp', true], ['lat-pulldown', true], ['leg-press', true], ['pushdown-rope', false], ['hanging-leg-raise', false]] },
    { title: 'Всё тело В', slots: [['hack-squat', true], ['db-incline', true], ['hammer-row', true], ['leg-curl-seated', false], ['cable-fly', false], ['face-pull', false]] },
  ],
  4: [
    { title: 'Верх А', slots: [['bench', true], ['bb-row', true], ['db-press', true], ['lat-pulldown', true], ['skull-crusher', false], ['db-curl', false]] },
    { title: 'Низ А', slots: [['squat', true], ['rdl', true], ['leg-press', true], ['leg-curl-lying', false], ['calf-standing', false], ['cable-crunch', false]] },
    { title: 'Верх Б', slots: [['hammer-incline', true], ['pull-up', true], ['hammer-shoulder', true], ['seated-row', true], ['lateral-raise', false], ['hammer-curl', false], ['pushdown-rope', false]] },
    { title: 'Низ Б', slots: [['deadlift', true], ['hack-squat', true], ['bulgarian', true], ['leg-ext', false], ['calf-seated', false], ['hanging-leg-raise', false]] },
  ],
  5: [
    { title: 'Грудь и трицепс', slots: [['bench', true], ['db-incline', true], ['hammer-chest', true], ['cable-fly', false], ['skull-crusher', false], ['pushdown-rope', false]] },
    { title: 'Спина и бицепс', slots: [['deadlift', true], ['pull-up', true], ['hammer-row', true], ['straight-pulldown', false], ['ez-curl', false], ['hammer-curl', false]] },
    { title: 'Ноги', slots: [['squat', true], ['leg-press', true], ['rdl', true], ['leg-ext', false], ['leg-curl-seated', false], ['calf-standing', false]] },
    { title: 'Плечи и пресс', slots: [['ohp', true], ['arnold-press', true], ['lateral-raise', false], ['reverse-pec-deck', false], ['shrug-db', false], ['cable-crunch', false]] },
    { title: 'Руки и слабые места', slots: [['bench-close', true], ['chin-up', true], ['preacher-curl', false], ['cable-overhead-ext', false], ['cable-lateral', false], ['hanging-leg-raise', false]] },
  ],
}

const FITNESS_DAYS: { title: string; slots: Slot[] }[] = [
  { title: 'Общая А', slots: [['goblet-squat', true], ['push-up', true], ['lat-pulldown', true], ['hip-thrust', true], ['plank', false], ['bike', false]] },
  { title: 'Общая Б', slots: [['leg-press', true], ['machine-chest', true], ['seated-row', true], ['kb-swing', true], ['face-pull', false], ['treadmill', false]] },
  { title: 'Общая В', slots: [['lunges', true], ['db-press', true], ['db-row', true], ['hyperext', false], ['pallof', false], ['rower', false]] },
]

function buildHypertrophyWeek(s: ProgramSettings, weekIdx: number, totalWeeks: number): ProgramWeek {
  const isFitness = s.discipline === 'fitness'
  const scheme = BB_SCHEMES[isFitness ? 'fitness' : s.bodybuildingGoal ?? 'mass']
  const deload = !isFitness && (weekIdx + 1) % 4 === 0 && weekIdx + 1 < totalWeeks
  // Волна RPE внутри 4-недельного блока: 7 → 8 → 9 → разгрузка
  const rpe = deload ? 6 : isFitness ? 7 : 7 + (weekIdx % 4)
  const template = isFitness
    ? FITNESS_DAYS.slice(0, Math.min(3, s.daysPerWeek))
    : SPLITS[s.daysPerWeek]

  const days: ProgramDay[] = template.map(d => ({
    title: d.title,
    exercises: d.slots.map(([id, isCompound]) => {
      const [minS, maxS] = isCompound ? scheme.compound : scheme.isolation
      let n = weekIdx % 4 >= 2 ? maxS : minS
      if (deload) n = Math.max(2, n - 1)
      const timed = ['plank', 'bike', 'treadmill', 'rower'].includes(id)
      const reps = timed ? (id === 'plank' ? 45 : 15) : isCompound ? scheme.reps[0] + 2 : scheme.reps[1]
      const note = timed ? (id === 'plank' ? 'секунды' : 'минуты, умеренный темп') : undefined
      return ex(id, sets(timed ? (id === 'plank' ? 3 : 1) : n, { reps, rpe }), isCompound ? scheme.rest : 60, note)
    }),
  }))

  if (s.discipline === 'bodybuilding' && s.bodybuildingGoal === 'cut') {
    days.forEach(d => d.exercises.push(ex('treadmill', [{ reps: 20 }], 0, 'минуты, кардио после силовой')))
  }
  return { index: weekIdx, block: deload ? 'Разгрузка' : isFitness ? 'Общая подготовка' : `Блок ${Math.floor(weekIdx / 4) + 1}`, days }
}

// ================= Пауэрлифтинг =================

interface PLWeekPlan { block: string; topPct: number; topReps: number; topSets: number; volPct: number; volReps: number; volSets: number }

/** Простая линейная блоковая периодизация по неделям до старта */
function plWeekPlan(weekIdx: number, total: number, prep: boolean): PLWeekPlan {
  if (!prep) {
    // Межсезонье: 4-недельные волны, 4-я — разгрузка
    const w = weekIdx % 4
    if (w === 3) return { block: 'Разгрузка', topPct: 0.65, topReps: 5, topSets: 3, volPct: 0.6, volReps: 5, volSets: 2 }
    return { block: `Волна ${Math.floor(weekIdx / 4) + 1}`, topPct: 0.70 + w * 0.05, topReps: 5 - w, topSets: 5, volPct: 0.65, volReps: 6, volSets: 3 }
  }
  const left = total - weekIdx // недель до старта, включая текущую
  if (left === 1) return { block: 'Неделя старта', topPct: 0.6, topReps: 2, topSets: 3, volPct: 0, volReps: 0, volSets: 0 }
  if (left === 2) return { block: 'Подводка', topPct: 0.9, topReps: 1, topSets: 2, volPct: 0.7, volReps: 3, volSets: 2 }
  if (left <= 5) return { block: 'Пик', topPct: 0.85 + (5 - left) * 0.025, topReps: 2, topSets: 3, volPct: 0.75, volReps: 3, volSets: 3 }
  if (left <= 9) return { block: 'Интенсификация', topPct: 0.78 + (9 - left) * 0.015, topReps: 3, topSets: 4, volPct: 0.7, volReps: 5, volSets: 3 }
  return { block: 'Накопление', topPct: 0.68 + ((total - left) % 4) * 0.02, topReps: 5, topSets: 5, volPct: 0.65, volReps: 8, volSets: 3 }
}

const ASSIST: Record<MainLift, string[]> = {
  squat: ['squat-pause', 'leg-press', 'leg-curl-lying', 'hanging-leg-raise'],
  bench: ['bench-close', 'db-row', 'pushdown-rope', 'face-pull'],
  deadlift: ['deadlift-deficit', 'bb-row', 'hyperext', 'ab-wheel'],
}

function liftSets(lift: MainLift, pct: number, reps: number, n: number, orm: OneRM, step: number): PlannedSet[] {
  const max = orm[lift]
  return sets(n, { reps, percent: pct, weight: max ? roundTo(max * pct, step) : undefined })
}

/** Шейко-подобная лесенка: разминочные ступени + рабочие подходы (черновое приближение) */
function sheikoLadder(lift: MainLift, top: number, reps: number, n: number, orm: OneRM, step: number): PlannedSet[] {
  const steps = [0.5, 0.6, 0.7].filter(p => p < top - 0.02)
  return [
    ...steps.flatMap(p => liftSets(lift, p, Math.max(reps, 3) + (p < 0.6 ? 2 : 0), 1, orm, step)),
    ...liftSets(lift, top, reps, n, orm, step),
  ]
}

function buildPowerliftingWeek(s: ProgramSettings, weekIdx: number, total: number, orm: OneRM, step: number): ProgramWeek {
  const prep = s.plPhase === 'prep'
  const p = plWeekPlan(weekIdx, total, prep)
  const focus = s.plFocus ?? 'total'
  const method = s.plMethod ?? 'generic'
  const mk = method === 'sheiko' ? sheikoLadder : liftSets
  const days: ProgramDay[] = []
  const n = s.daysPerWeek

  // Порядок дней: для троеборья чередуем движения, для одного движения — оно в каждой тренировке
  for (let d = 0; d < n; d++) {
    const exercises: PlannedExercise[] = []
    const heavy = d === 0 || (n >= 4 && d === 2)
    let main: MainLift
    if (focus === 'total') {
      const order: MainLift[][] = [['squat', 'bench'], ['deadlift', 'bench'], ['squat', 'bench'], ['deadlift', 'bench'], ['bench', 'squat']]
      const [a, b] = order[d % order.length]
      main = a
      exercises.push(ex(a === 'deadlift' && s.plMethod !== 'sheiko' ? 'deadlift' : a, mk(a, heavy ? p.topPct : p.topPct - 0.05, p.topReps, p.topSets, orm, step), 240))
      if (p.volSets) exercises.push(ex(b, liftSets(b, p.volPct, p.volReps, p.volSets, orm, step), 180))
    } else {
      main = focus
      const pct = heavy ? p.topPct : p.topPct - 0.07
      exercises.push(ex(focus, mk(focus, pct, p.topReps, p.topSets, orm, step), 240))
      if (p.volSets) {
        const variant = ASSIST[focus][0]
        exercises.push(ex(variant, liftSets(focus, p.volPct - 0.05, p.volReps, p.volSets, orm, step), 180, 'вариация, % от 1ПМ основного движения'))
      }
    }
    // Подсобка (кроме недели старта)
    if (p.volSets) {
      ASSIST[main].slice(1, 4).forEach(id => exercises.push(ex(id, sets(3, { reps: 10, rpe: 7 }), 90)))
    }
    days.push({ title: `День ${d + 1}${heavy ? ' · тяжёлый' : ''}`, exercises })
  }
  if (prep && total - weekIdx === 1) {
    days.splice(Math.min(2, days.length))
    days.push({ title: 'Соревнования', exercises: [] })
  }
  return { index: weekIdx, block: p.block, days }
}

// ================= Точка входа =================

export function programWeeks(s: ProgramSettings): number {
  if (s.discipline === 'powerlifting' && s.plPhase === 'prep' && s.competitionDate) {
    return Math.max(2, Math.min(24, weeksUntil(s.competitionDate)))
  }
  return s.weeks
}

export function programName(s: ProgramSettings): string {
  if (s.discipline === 'bodybuilding') return `${DISCIPLINE_LABELS.bodybuilding}: ${BB_GOAL_LABELS[s.bodybuildingGoal ?? 'mass']}`
  if (s.discipline === 'fitness') return 'Фитнес: здоровье и тонус'
  return `${PL_FOCUS_LABELS[s.plFocus ?? 'total']} · ${PL_PHASE_LABELS[s.plPhase ?? 'offseason']} · ${PL_METHOD_LABELS[s.plMethod ?? 'generic']}`
}

export function generateProgram(s: ProgramSettings, orm: OneRM, rounding = 2.5): Program {
  const total = programWeeks(s)
  const weeks: ProgramWeek[] = []
  for (let w = 0; w < total; w++) {
    weeks.push(s.discipline === 'powerlifting'
      ? buildPowerliftingWeek(s, w, total, orm, rounding)
      : buildHypertrophyWeek(s, w, total))
  }
  const description = s.discipline === 'powerlifting'
    ? (s.plPhase === 'prep'
        ? `Подводка к старту за ${total} нед.: накопление → интенсификация → пик → подводка. Веса считаются от введённого 1ПМ.`
        : 'Межсезонье: 4-недельные волны с разгрузкой, поддержание и рост силы.')
    : s.discipline === 'fitness'
      ? 'Тренировки на всё тело, умеренная интенсивность, кардио в конце.'
      : 'Сплит под цель, волна усилий по RPE в 4-недельных блоках, разгрузка каждую 4-ю неделю.'
  return {
    id: uid(),
    name: programName(s),
    createdAt: new Date().toISOString(),
    settings: s,
    oneRepMax: { ...orm },
    weeks,
    draft: true,
    description,
  }
}
