import type { Program, Workout } from '../types'

/** Превращает день программы в черновик тренировки с плановыми весами */
export function workoutFromDay(p: Program, week: number, day: number): Omit<Workout, 'id' | 'startedAt'> {
  const d = p.weeks[week].days[day]
  return {
    title: `${d.title} · неделя ${week + 1}`,
    programId: p.id,
    week,
    day,
    exercises: d.exercises.map(e => ({
      exerciseId: e.exerciseId,
      planned: e.sets,
      sets: e.sets.map(s => ({ weight: s.weight ?? 0, reps: s.reps, done: false })),
    })),
  }
}
