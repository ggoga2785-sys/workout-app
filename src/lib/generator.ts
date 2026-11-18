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
import { FITNESS_GOAL_LABELS, DISCIPLINE_LABELS, BB_GOAL_LABELS, PL_FOCUS_LABELS, PL_METHOD_LABELS, PL_PHASE_LABELS } from '../data/labels'
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

// Верх/низ/верх на 3 дня: каждую неделю пн — верх (сила + грудь), ср — низ + руки, пт — верх (объём на грудь и руки).
// Прямых подходов в неделю: грудь ~18, бицепс ~14, трицепс ~12 (как в программе upper-lower-3 из базы)
const UPPER_LOWER_3: { title: string; slots: Slot[] }[] = [
  { title: 'Верх А · сила + грудь', slots: [['bench', true], ['db-incline', true], ['dips', true], ['bb-row', true], ['lat-pulldown', true], ['ohp', true], ['skull-crusher', false], ['ez-curl', false], ['incline-curl', false]] },
  { title: 'Низ + руки', slots: [['squat', true], ['rdl', true], ['leg-press', true], ['leg-curl-lying', false], ['calf-standing', false], ['cable-curl', false], ['pushdown-rope', false]] },
  { title: 'Верх Б · грудь и руки', slots: [['bench-incline', true], ['hammer-chest', true], ['cable-fly', false], ['hammer-row', true], ['seated-row', true], ['lateral-raise', false], ['bench-close', true], ['cable-overhead-ext', false], ['preacher-curl', false], ['hammer-curl', false]] },
]

const FITNESS_DAYS: { title: string; slots: Slot[] }[] = [
  { title: 'Общая А', slots: [['goblet-squat', true], ['push-up', true], ['lat-pulldown', true], ['hip-thrust', true], ['plank', false], ['bike', false]] },
  { title: 'Общая Б', slots: [['leg-press', true], ['machine-chest', true], ['seated-row', true], ['kb-swing', true], ['face-pull', false], ['treadmill', false]] },
  { title: 'Общая В', slots: [['lunges', true], ['db-press', true], ['db-row', true], ['hyperext', false], ['pallof', false], ['rower', false]] },
]

// ================= Фитнес для девушек: всё тело 3 раза в неделю =================
// Только простые упражнения, которые есть в любом зале и не требуют постановки техники.
// Кардио — велотренажёр по 30 минут 2 раза в неделю (дни А и В), пресс и кор — в каждой тренировке.

const TIPS: Record<string, string> = {
  'plate-squat': 'Блин прижат к груди, стопы на ширине плеч, садись до параллели, спина прямая, колени смотрят туда же, куда носки',
  'db-rdl': 'Колени чуть согнуты, гантели скользят вдоль ног, таз уводи назад до натяжения сзади бедра, спина прямая',
  'leg-press': 'Стопы повыше и пошире — больше работают ягодицы. Поясница прижата, колени до конца не выпрямляй',
  'hip-thrust': 'Лопатки на скамье, подбородок к груди, вверху сожми ягодицы на 1 секунду. Можно в Смите или в тренажёре',
  'lunges': 'Шагай назад — так легче держать равновесие. Колено почти касается пола, корпус ровно',
  'hyperext': 'Слегка округли спину и подкрути таз — так работают ягодицы, а не поясница',
  'lat-pulldown': 'Тяни к верху груди, локти вниз, без раскачки корпусом',
  'seated-row': 'Грудь вперёд, тяни к поясу и своди лопатки',
  'db-row': 'Колено и рука на скамье, тяни гантель к поясу, спина ровная',
  'db-bench': 'Лопатки сведены, гантели опускай к груди медленно',
  'machine-chest': 'Ручки на уровне груди, плечи не поднимай',
  'db-press': 'Сидя со спинкой, жми вверх без прогиба в пояснице',
  'lateral-raise': 'Лёгкие гантели, локти чуть согнуты, поднимай до уровня плеч',
  'leg-curl-lying': 'Таз прижат, вверх быстро, вниз медленно',
  'hip-abduction': 'Медленно, в крайней точке пауза 1 секунда',
  'glute-kickback': 'Корпус неподвижен, отводи ногу назад за счёт ягодицы, без рывков',
  'plank': 'секунды. Тело прямое, пресс и ягодицы напряжены, не прогибайся',
  'side-plank': 'секунды на каждую сторону. Таз не опускай, тело в одну линию',
  'crunch': 'Поясница прижата, поднимай только лопатки, выдох наверху',
  'lying-leg-raise': 'Поясница прижата к полу, ноги опускай медленно',
  'bike': 'минуты. Ровный темп: дышишь часто, но можешь говорить. Можно заменить быстрой ходьбой на улице',
}

type FSlot = [string, 'big' | 'small' | 'core' | 'bike']
const WOMEN_DAYS: Record<'fatloss' | 'glutes' | 'tone', { title: string; slots: FSlot[] }[]> = {
  fatloss: [
    { title: 'Всё тело А + кардио', slots: [['plate-squat', 'big'], ['db-rdl', 'big'], ['lat-pulldown', 'big'], ['db-bench', 'small'], ['plank', 'core'], ['crunch', 'core'], ['bike', 'bike']] },
    { title: 'Всё тело Б', slots: [['leg-press', 'big'], ['hip-thrust', 'big'], ['db-row', 'big'], ['db-press', 'small'], ['leg-curl-lying', 'small'], ['lying-leg-raise', 'core'], ['side-plank', 'core']] },
    { title: 'Всё тело В + кардио', slots: [['lunges', 'big'], ['hyperext', 'big'], ['seated-row', 'big'], ['machine-chest', 'small'], ['crunch', 'core'], ['plank', 'core'], ['bike', 'bike']] },
  ],
  glutes: [
    { title: 'Ягодицы и ноги А + кардио', slots: [['plate-squat', 'big'], ['db-rdl', 'big'], ['hip-abduction', 'small'], ['lat-pulldown', 'big'], ['db-press', 'small'], ['plank', 'core'], ['bike', 'bike']] },
    { title: 'Ягодицы Б', slots: [['hip-thrust', 'big'], ['leg-press', 'big'], ['leg-curl-lying', 'small'], ['glute-kickback', 'small'], ['db-row', 'big'], ['lying-leg-raise', 'core'], ['side-plank', 'core']] },
    { title: 'Ягодицы и ноги В + кардио', slots: [['lunges', 'big'], ['hyperext', 'big'], ['hip-abduction', 'small'], ['seated-row', 'big'], ['db-bench', 'small'], ['crunch', 'core'], ['bike', 'bike']] },
  ],
  tone: [
    { title: 'Всё тело А + кардио', slots: [['plate-squat', 'big'], ['lat-pulldown', 'big'], ['db-rdl', 'big'], ['lateral-raise', 'small'], ['plank', 'core'], ['crunch', 'core'], ['bike', 'bike']] },
    { title: 'Всё тело Б', slots: [['hip-thrust', 'big'], ['db-row', 'big'], ['db-press', 'small'], ['leg-curl-lying', 'small'], ['lateral-raise', 'small'], ['lying-leg-raise', 'core'], ['side-plank', 'core']] },
    { title: 'Всё тело В + кардио', slots: [['leg-press', 'big'], ['seated-row', 'big'], ['hyperext', 'big'], ['machine-chest', 'small'], ['crunch', 'core'], ['plank', 'core'], ['bike', 'bike']] },
  ],
}

/** Прогрессия: недели 1–4 освоение (первые 2 — по 2 подхода), 5–8 прогресс, 9+ рельеф и форма */
function buildWomenWeek(goal: 'fatloss' | 'glutes' | 'tone', weekIdx: number): ProgramWeek {
  const stage = weekIdx < 4 ? 0 : weekIdx < 8 ? 1 : 2
  const block = ['Освоение техники', 'Прогресс в весах', 'Рельеф и форма'][stage]
  const reps = goal === 'fatloss' ? [15, 12, 12] : goal === 'glutes' ? [12, 10, 10] : [12, 12, 10]
  const rpe = [7, 8, 8][stage]
  const bigSets = weekIdx < 2 ? 2 : stage === 2 ? 4 : 3
  const smallSets = weekIdx < 2 ? 2 : 3
  const rest = goal === 'fatloss' ? 60 : 90
  const days: ProgramDay[] = WOMEN_DAYS[goal].map(d => ({
    title: d.title,
    exercises: d.slots.map(([id, kind]) => {
      const tip = TIPS[id]
      if (kind === 'bike') return ex(id, [{ reps: 30 }], 0, tip)
      if (kind === 'core') {
        const timed = id === 'plank' || id === 'side-plank'
        const n = weekIdx < 2 ? 2 : 3
        return ex(id, sets(n, { reps: timed ? [30, 40, 50][stage] : [15, 15, 20][stage] }), 45, tip)
      }
      // На ягодицы — главный подход тяжелее и больше подходов
      const glute = goal === 'glutes' && (id === 'hip-thrust' || id === 'plate-squat' || id === 'lunges')
      return ex(id, sets(kind === 'big' ? bigSets + (glute && weekIdx >= 2 ? 1 : 0) : smallSets, { reps: kind === 'big' ? reps[stage] : reps[stage] + 3, rpe }), kind === 'big' ? rest : 60, tip)
    }),
  }))
  return { index: weekIdx, block, days }
}

function buildHypertrophyWeek(s: ProgramSettings, weekIdx: number, totalWeeks: number): ProgramWeek {
  const isFitness = s.discipline === 'fitness'
  const fg = s.fitnessGoal
  if (isFitness && fg && fg !== 'health') return buildWomenWeek(fg, weekIdx)
  const scheme = BB_SCHEMES[isFitness ? 'fitness' : s.bodybuildingGoal ?? 'mass']
  const deload = !isFitness && (weekIdx + 1) % 4 === 0 && weekIdx + 1 < totalWeeks
  // Волна RPE внутри 4-недельного блока: 7 → 8 → 9 → разгрузка
  const rpe = deload ? 6 : isFitness ? 7 : 7 + (weekIdx % 4)
  const template = isFitness
    ? FITNESS_DAYS.slice(0, Math.min(3, s.daysPerWeek))
    : s.split === 'upperlower' && s.daysPerWeek === 3
      // Верх/низ на 3 дня: каждую неделю верх А — низ + руки — верх Б
      ? UPPER_LOWER_3
      : SPLITS[Math.min(5, Math.max(2, s.daysPerWeek))]

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
  bench: ['bench-close', 'db-row', 'pushdown-rope', 'bb-curl'],
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
    // Волнообразная недельная нагрузка (DUP): тяжёлый / лёгкий / средний
    const kind = (['heavy', 'light', 'medium', 'heavy', 'light'] as const)[d]
    const heavy = kind === 'heavy'
    const shift = kind === 'heavy' ? 0 : kind === 'medium' ? -0.05 : -0.12
    const repsAdd = kind === 'light' ? 1 : 0
    let main: MainLift
    if (focus === 'total') {
      const order: MainLift[][] = [['squat', 'bench'], ['deadlift', 'bench'], ['squat', 'bench'], ['deadlift', 'bench'], ['bench', 'squat']]
      const [a, b] = order[d % order.length]
      main = a
      exercises.push(ex(a === 'deadlift' && s.plMethod !== 'sheiko' ? 'deadlift' : a, mk(a, p.topPct + shift, p.topReps + repsAdd, p.topSets, orm, step), 240))
      if (p.volSets) exercises.push(ex(b, liftSets(b, p.volPct, p.volReps, p.volSets, orm, step), 180))
    } else {
      main = focus
      exercises.push(ex(focus, mk(focus, p.topPct + shift, p.topReps + repsAdd, p.topSets, orm, step), 240))
      if (p.volSets) {
        const variant = ASSIST[focus][0]
        exercises.push(ex(variant, liftSets(focus, p.volPct - 0.05, p.volReps, p.volSets, orm, step), 180, 'вариация, % от 1ПМ основного движения'))
      }
    }
    // Подсобка (кроме недели старта)
    if (p.volSets) {
      ASSIST[main].slice(1, 4).forEach(id => exercises.push(ex(id, sets(3, { reps: 10, rpe: 7 }), 90)))
    }
    days.push({ title: `День ${d + 1} · ${heavy ? 'тяжёлый' : kind === 'medium' ? 'средний' : 'лёгкий'}`, exercises })
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
  if (s.discipline === 'fitness') return `Фитнес: ${FITNESS_GOAL_LABELS[s.fitnessGoal ?? 'health'].replace('Девушкам: ', 'для девушек, ')}`
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
      ? (s.fitnessGoal && s.fitnessGoal !== 'health'
          ? 'Всё тело 3 раза в неделю на простых упражнениях из обычного зала. Вес подбирай так, чтобы последние 2–3 повтора давались тяжело, но техника не ломалась; получается легко — добавь вес. Пресс и кор в каждой тренировке, велотренажёр по 30 минут 2 раза в неделю. Для похудения главное — небольшой дефицит калорий и 8–10 тысяч шагов в день.'
          : 'Тренировки на всё тело, умеренная интенсивность, кардио в конце.')
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
