import type { CatalogProgram, PlannedExercise, ProgramDay, ProgramWeek } from '../types'

// Верх/низ на 3 дня: 4 тренировки (Верх А, Низ А, Верх Б, Низ Б) идут по кругу,
// поэтому за 4 недели каждая выполняется 3 раза. Волна RPE 7→8→8→9, 8-я неделя — разгрузка.
type Item = [string, number, number, number] // id, подходов, повторов, отдых

const SESSIONS: { title: string; items: Item[] }[] = [
  { title: 'Верх А · сила', items: [['bench', 4, 6, 180], ['bb-row', 4, 6, 150], ['ohp', 3, 8, 120], ['lat-pulldown', 3, 10, 90], ['skull-crusher', 3, 10, 60], ['db-curl', 3, 10, 60]] },
  { title: 'Низ А · сила', items: [['squat', 4, 6, 180], ['rdl', 3, 8, 150], ['leg-press', 3, 10, 120], ['leg-curl-lying', 3, 12, 60], ['calf-standing', 4, 12, 60], ['hanging-leg-raise', 3, 12, 60]] },
  { title: 'Верх Б · объём', items: [['db-incline', 4, 10, 120], ['hammer-row', 4, 10, 90], ['hammer-shoulder', 3, 12, 90], ['cable-fly', 3, 15, 60], ['lateral-raise', 4, 15, 60], ['pushdown-rope', 3, 12, 60], ['hammer-curl', 3, 12, 60]] },
  { title: 'Низ Б · объём', items: [['deadlift', 3, 5, 180], ['hack-squat', 3, 10, 120], ['bulgarian', 3, 10, 90], ['leg-ext', 3, 15, 60], ['leg-curl-seated', 3, 12, 60], ['calf-seated', 4, 15, 60], ['cable-crunch', 3, 15, 60]] },
]

const RPE = [7, 8, 8, 9, 7, 8, 9, 6]

function session(idx: number, week: number): ProgramDay {
  const s = SESSIONS[idx % 4]
  const deload = week === 7
  return {
    title: s.title,
    exercises: s.items.map(([id, n, reps, rest]): PlannedExercise => ({
      exerciseId: id,
      sets: Array.from({ length: deload ? Math.max(2, n - 1) : n }, () => ({ reps, rpe: RPE[week] })),
      restSec: rest,
    })),
  }
}

const weeks: ProgramWeek[] = RPE.map((_, w) => ({
  index: w,
  block: w === 7 ? 'Разгрузка' : `Неделя ${w + 1}`,
  days: [0, 1, 2].map(d => session(w * 3 + d, w)),
}))

export const EXTRA_PROGRAMS: CatalogProgram[] = [{
  id: 'upper-lower-3',
  name: 'Верх/низ, 3 дня в неделю (ротация А/Б)',
  author: 'Классический сплит верх/низ',
  discipline: 'bodybuilding',
  bodybuildingGoal: 'mass',
  level: 'intermediate',
  daysPerWeek: 3,
  durationWeeks: 8,
  percentBase: 'RPE',
  description: 'Четыре тренировки (Верх А, Низ А, Верх Б, Низ Б) идут по кругу в 3 тренировочных дня. Каждая мышца получает нагрузку примерно 1,5 раза в неделю. «А» — силовые (6–8 повторов), «Б» — объёмные (10–15).',
  progression: 'Двойная прогрессия: сделал верх диапазона во всех подходах — добавь 2,5 кг (ноги — 5 кг). Волна усилий 7→8→8→9 RPE, 8-я неделя — разгрузка.',
  howToUse: 'Тренировки через день (например, пн/ср/пт). Следующая неделя начинается с той тренировки, на которой закончилась предыдущая.',
  fidelity: 'reconstructed',
  fidelityNote: 'Собрано по типовой схеме сплита верх/низ; веса подбираются по RPE.',
  sources: [],
  weeks,
}]
