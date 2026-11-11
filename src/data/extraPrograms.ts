import type { CatalogProgram, PlannedExercise, ProgramDay, ProgramWeek } from '../types'

// Верх/низ на 3 дня: каждую неделю пн — Верх А, ср — Низ, пт — Верх Б (2 верха + 1 низ).
// Волна RPE 7→8→8→9, 8-я неделя — разгрузка.
type Item = [string, number, number, number] // id, подходов, повторов, отдых

const SESSIONS: { title: string; items: Item[] }[] = [
  { title: 'Пн · Верх А (сила)', items: [['bench', 4, 6, 180], ['bb-row', 4, 6, 150], ['ohp', 3, 8, 120], ['lat-pulldown', 3, 10, 90], ['skull-crusher', 3, 10, 60], ['db-curl', 3, 10, 60]] },
  { title: 'Ср · Низ', items: [['squat', 4, 6, 180], ['rdl', 3, 8, 150], ['leg-press', 3, 10, 120], ['leg-curl-lying', 3, 12, 60], ['calf-standing', 4, 12, 60], ['hanging-leg-raise', 3, 12, 60]] },
  { title: 'Пт · Верх Б (объём)', items: [['db-incline', 4, 10, 120], ['hammer-row', 4, 10, 90], ['hammer-shoulder', 3, 12, 90], ['cable-fly', 3, 15, 60], ['lateral-raise', 4, 15, 60], ['pushdown-rope', 3, 12, 60], ['hammer-curl', 3, 12, 60]] },
]

const RPE = [7, 8, 8, 9, 7, 8, 9, 6]

function session(idx: number, week: number): ProgramDay {
  const s = SESSIONS[idx]
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
  days: [0, 1, 2].map(d => session(d, w)),
}))

export const EXTRA_PROGRAMS: CatalogProgram[] = [{
  id: 'upper-lower-3',
  name: 'Верх/низ/верх, 3 дня в неделю',
  author: 'Классический сплит верх/низ',
  discipline: 'bodybuilding',
  bodybuildingGoal: 'mass',
  level: 'intermediate',
  daysPerWeek: 3,
  durationWeeks: 8,
  percentBase: 'RPE',
  description: 'Каждую неделю: понедельник — верх (сила), среда — низ, пятница — верх (объём). Верх тренируется 2 раза в неделю, ноги — 1 раз.',
  progression: 'Двойная прогрессия: сделал верх диапазона во всех подходах — добавь 2,5 кг (ноги — 5 кг). Волна усилий 7→8→8→9 RPE, 8-я неделя — разгрузка.',
  howToUse: 'Пн / ср / пт или любые 3 дня с отдыхом между тренировками. Порядок каждую неделю одинаковый.',
  fidelity: 'reconstructed',
  fidelityNote: 'Собрано по типовой схеме сплита верх/низ; веса подбираются по RPE.',
  sources: [],
  weeks,
}]
