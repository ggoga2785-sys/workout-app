/**
 * Подсобка для пауэрлифтинговых программ: спина, руки, плечи, грудь.
 * Основная работа (соревновательные движения и их вариации, ноги, пресс, гиперэкстензии) не трогается.
 * Верхняя подсобка из исходной программы убирается и собирается заново:
 *  - жимовой день А: наклонный жим, вертикальная тяга, горизонтальная тяга, тяжёлый трицепс, бицепс, махи;
 *  - жимовой день Б: жим над головой, грудь (брусья/сведения), тяга, трицепс, бицепс, махи;
 *  - день ног: тяга (с упором, если в этот день становая), вертикальная тяга, шраги, бицепс, трицепс.
 * Задняя дельта — 2 подхода раз в 3 недели, а не в каждой тренировке.
 * Упражнения меняются каждые 2 недели; объём режется к пику и в разгрузку, в неделю старта подсобки нет.
 */
import type { Exercise, PlannedExercise, PlannedSet, ProgramWeek } from '../types'

const P = {
  rowFree: ['bb-row', 't-bar-row', 'pendlay-row', 'db-row'],
  rowSupported: ['machine-row', 'seated-row', 'hammer-row', 'hammer-low-row'],
  vertical: ['pull-up', 'lat-pulldown', 'chin-up', 'hammer-pulldown', 'lat-pulldown-close'],
  pullover: ['straight-pulldown', 'db-pullover'],
  shrug: ['shrug-db', 'shrug-bb'],
  chestA: ['db-incline', 'hammer-incline', 'smith-incline', 'db-bench'],
  chestB: ['dips', 'cable-fly', 'pec-deck', 'hammer-chest'],
  press: ['ohp', 'db-press', 'arnold-press', 'seated-bb-press'],
  lateral: ['lateral-raise', 'cable-lateral', 'machine-lateral'],
  triHeavy: ['skull-crusher', 'jm-press', 'machine-dips', 'pushdown'],
  triLight: ['pushdown-rope', 'db-overhead-ext', 'cable-overhead-ext', 'tricep-kickback'],
  biA: ['bb-curl', 'ez-curl', 'preacher-curl'],
  biB: ['hammer-curl', 'incline-curl', 'db-curl', 'cable-curl'],
  rear: ['face-pull', 'reverse-pec-deck', 'rear-delt-fly'],
}
type Pool = keyof typeof P
/** [пул, подходы, повторы, отдых] */
type Slot = [Pool, number, number, number]

const BENCH_A: Slot[] = [['chestA', 3, 10, 120], ['vertical', 4, 8, 120], ['rowFree', 4, 10, 120], ['triHeavy', 4, 10, 90], ['biA', 3, 10, 75], ['lateral', 3, 15, 60]]
const BENCH_B: Slot[] = [['press', 3, 8, 120], ['chestB', 3, 12, 90], ['rowSupported', 4, 10, 120], ['pullover', 2, 12, 75], ['triLight', 3, 12, 75], ['biB', 3, 12, 75], ['lateral', 3, 15, 60]]
const LOWER: Slot[] = [['rowFree', 3, 10, 120], ['vertical', 3, 10, 120], ['shrug', 3, 12, 75], ['biB', 3, 12, 75], ['triLight', 3, 12, 75]]

const UPPER = new Set(['back', 'biceps', 'triceps', 'shoulders', 'chest', 'forearms'])
const KEEP = new Set(['hyperext'])

function isUpperAccessory(id: string, exMap: Map<string, Exercise>) {
  const e = exMap.get(id)
  if (!e || e.lift || KEEP.has(id)) return false
  return UPPER.has(e.primary)
}

/** Множитель объёма подсобки для недели */
function scaleFor(w: ProgramWeek, idx: number, total: number, prep: boolean) {
  if (w.days.some(d => /соревнован/i.test(d.title))) return 0
  if (prep) {
    const left = total - idx
    if (left <= 1) return 0
    if (left === 2) return 0.4
    if (left <= 5) return 0.65
  }
  if (/разгруз/i.test(w.block ?? '')) return 0.5
  return 1
}

const sets = (n: number, s: PlannedSet) => Array.from({ length: n }, () => ({ ...s }))

export function applyAccessories(weeks: ProgramWeek[], exMap: Map<string, Exercise>, prep: boolean): ProgramWeek[] {
  const known = (id: string) => exMap.has(id)
  return weeks.map((w, wi) => {
    const k = scaleFor(w, wi, weeks.length, prep)
    const rot = Math.floor(wi / 2)
    let benchDays = 0
    let rearDone = false
    return {
      ...w,
      days: w.days.map(d => {
        if (!d.exercises.length) return d
        const kept = d.exercises.filter(e => !isUpperAccessory(e.exerciseId, exMap))
        if (!k) return { ...d, exercises: kept }
        const lifts = new Set(kept.map(e => exMap.get(e.exerciseId)?.lift).filter(Boolean))
        const bench = lifts.has('bench')
        const tpl = bench ? (benchDays++ % 2 === 0 ? BENCH_A : BENCH_B) : LOWER
        const used = new Set(kept.map(e => e.exerciseId))
        const add: PlannedExercise[] = []
        tpl.forEach(([pool, n, reps, rest], si) => {
          // В день становой — тяги с упором в грудь, чтобы не добивать поясницу
          const name: Pool = pool === 'rowFree' && lifts.has('deadlift') ? 'rowSupported' : pool
          const list = P[name].filter(known)
          if (!list.length) return
          let id = list[(rot + si + (tpl === BENCH_B ? 1 : 0)) % list.length]
          if (used.has(id)) id = list.find(x => !used.has(x)) ?? id
          used.add(id)
          const cnt = Math.max(k < 0.5 ? 1 : 2, Math.round(n * k))
          add.push({ exerciseId: id, sets: sets(cnt, { reps, rpe: k < 1 ? 7 : 8 }), restSec: rest })
        })
        // Задняя дельта — 2 подхода раз в 3 недели, один раз за неделю
        if (k >= 0.65 && wi % 3 === 2 && !rearDone && tpl !== BENCH_A) {
          const list = P.rear.filter(known)
          if (list.length) { rearDone = true; add.push({ exerciseId: list[Math.floor(wi / 3) % list.length], sets: sets(2, { reps: 15, rpe: 7 }), restSec: 60 }) }
        }
        return { ...d, exercises: [...kept, ...add] }
      }),
    }
  })
}
