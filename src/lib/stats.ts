import type { Exercise, LoggedSet, MainLift, Workout } from '../types'
import { estimate1RM } from './util'

/** Лучшая оценка 1ПМ в выполненных подходах (повторы до 10 — дальше формула врёт) */
export const bestE1RM = (sets: LoggedSet[]) =>
  Math.max(0, ...sets.filter(s => s.done && s.weight > 0 && s.reps > 0 && s.reps <= 10).map(s => estimate1RM(s.weight, s.reps)))

export const tonnage = (w: Workout) =>
  w.exercises.reduce((n, e) => n + e.sets.filter(s => s.done).reduce((m, s) => m + s.weight * s.reps, 0), 0)

export const doneSets = (w: Workout) => w.exercises.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0)

/** Последний раз, когда делалось упражнение (до тренировки `beforeId`) */
export function lastPerformance(workouts: Workout[], exerciseId: string, beforeId?: string) {
  for (const w of workouts) {
    if (w.id === beforeId || !w.finishedAt) continue
    const e = w.exercises.find(x => x.exerciseId === exerciseId && x.sets.some(s => s.done))
    if (e) return { date: w.startedAt, sets: e.sets.filter(s => s.done) }
  }
  return undefined
}

/** История лучшего e1RM по упражнению: точки по тренировкам, от старых к новым */
export function e1rmHistory(workouts: Workout[], exerciseId: string) {
  return workouts
    .filter(w => w.finishedAt)
    .map(w => ({ date: w.startedAt, v: bestE1RM(w.exercises.filter(e => e.exerciseId === exerciseId).flatMap(e => e.sets)) }))
    .filter(p => p.v > 0)
    .reverse()
}

export interface LiftRecord { exerciseId: string; e1rm: number; weight: number; reps: number; date: string }

/** Рекорды: по каждому упражнению лучший e1RM и подход, который его дал */
export function records(workouts: Workout[]): Map<string, LiftRecord> {
  const out = new Map<string, LiftRecord>()
  for (const w of [...workouts].reverse()) {
    if (!w.finishedAt) continue
    for (const e of w.exercises) for (const s of e.sets) {
      if (!s.done || s.weight <= 0 || s.reps <= 0 || s.reps > 10) continue
      const v = estimate1RM(s.weight, s.reps)
      const cur = out.get(e.exerciseId)
      if (!cur || v > cur.e1rm) out.set(e.exerciseId, { exerciseId: e.exerciseId, e1rm: v, weight: s.weight, reps: s.reps, date: w.startedAt })
    }
  }
  return out
}

/** Новые рекорды, поставленные в тренировке `w` относительно всей прошлой истории */
export function newRecords(all: Workout[], w: Workout) {
  const before = records(all.filter(x => x.id !== w.id && x.startedAt < w.startedAt))
  const res: { exerciseId: string; e1rm: number; prev?: number }[] = []
  for (const e of w.exercises) {
    const v = bestE1RM(e.sets)
    if (!v) continue
    const prev = before.get(e.exerciseId)?.e1rm
    if (!prev || v > prev) if (!res.some(r => r.exerciseId === e.exerciseId)) res.push({ exerciseId: e.exerciseId, e1rm: v, prev })
  }
  return res
}

const weekKey = (d: Date) => {
  const x = new Date(d); x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x.toISOString().slice(0, 10)
}

/** Тоннаж по неделям за последние n недель */
export function weeklyTonnage(workouts: Workout[], n = 12) {
  const now = new Date()
  const weeks: { key: string; v: number; count: number }[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i * 7)
    weeks.push({ key: weekKey(d), v: 0, count: 0 })
  }
  for (const w of workouts) {
    if (!w.finishedAt) continue
    const k = weekKey(new Date(w.startedAt))
    const slot = weeks.find(x => x.key === k)
    if (slot) { slot.v += tonnage(w); slot.count++ }
  }
  return weeks
}

/** Сколько недель подряд (включая текущую) была хотя бы одна тренировка */
export function weekStreak(workouts: Workout[]) {
  const keys = new Set(workouts.filter(w => w.finishedAt).map(w => weekKey(new Date(w.startedAt))))
  let n = 0
  const d = new Date()
  if (!keys.has(weekKey(d))) d.setDate(d.getDate() - 7)
  while (keys.has(weekKey(d))) { n++; d.setDate(d.getDate() - 7) }
  return n
}

/** Основное соревновательное упражнение для движения */
export const LIFT_EXERCISE: Record<MainLift, string> = { squat: 'squat', bench: 'bench', deadlift: 'deadlift' }

export const exName = (m: Map<string, Exercise>, id: string) => m.get(id)?.name ?? id
