import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Exercise, LoggedExercise, Profile, Program, Workout } from './types'
import { BASE_EXERCISES } from './data/exercises'
import { uid } from './lib/util'

interface State {
  profile: Profile
  customExercises: Exercise[]
  programs: Program[]
  activeProgramId?: string
  /** Прогресс по активной программе: следующая неделя/день */
  cursor: { week: number; day: number }
  workouts: Workout[]
  current?: Workout

  setProfile: (p: Partial<Profile>) => void
  addCustomExercise: (e: Omit<Exercise, 'id' | 'custom'>) => void
  addProgram: (p: Program) => void
  removeProgram: (id: string) => void
  setActiveProgram: (id?: string) => void
  setCursor: (week: number, day: number) => void

  startWorkout: (w: Omit<Workout, 'id' | 'startedAt'>) => void
  updateCurrent: (fn: (w: Workout) => Workout) => void
  finishWorkout: () => void
  cancelWorkout: () => void
  deleteWorkout: (id: string) => void
  importData: (json: string) => void
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      profile: { name: '', oneRepMax: {}, rounding: 2.5 },
      customExercises: [],
      programs: [],
      cursor: { week: 0, day: 0 },
      workouts: [],

      setProfile: p => set(s => ({ profile: { ...s.profile, ...p } })),
      addCustomExercise: e => set(s => ({ customExercises: [...s.customExercises, { ...e, id: 'c-' + uid(), custom: true }] })),
      addProgram: p => set(s => ({ programs: [p, ...s.programs], activeProgramId: p.id, cursor: { week: 0, day: 0 } })),
      removeProgram: id => set(s => ({
        programs: s.programs.filter(p => p.id !== id),
        activeProgramId: s.activeProgramId === id ? undefined : s.activeProgramId,
      })),
      setActiveProgram: id => set({ activeProgramId: id, cursor: { week: 0, day: 0 } }),
      setCursor: (week, day) => set({ cursor: { week, day } }),

      startWorkout: w => set({ current: { ...w, id: uid(), startedAt: new Date().toISOString() } }),
      updateCurrent: fn => set(s => (s.current ? { current: fn(s.current) } : {})),
      finishWorkout: () => {
        const { current, programs, activeProgramId } = get()
        if (!current) return
        const done = { ...current, finishedAt: new Date().toISOString() }
        const patch: Partial<State> = { workouts: [done, ...get().workouts], current: undefined }
        // Сдвигаем курсор программы на следующий день
        const prog = programs.find(p => p.id === activeProgramId)
        if (prog && current.programId === prog.id && current.week !== undefined && current.day !== undefined) {
          const days = prog.weeks[current.week].days.length
          patch.cursor = current.day + 1 < days
            ? { week: current.week, day: current.day + 1 }
            : { week: Math.min(current.week + 1, prog.weeks.length - 1), day: 0 }
        }
        set(patch)
      },
      cancelWorkout: () => set({ current: undefined }),
      deleteWorkout: id => set(s => ({ workouts: s.workouts.filter(w => w.id !== id) })),
      importData: json => {
        const d = JSON.parse(json)
        set({
          profile: d.profile ?? get().profile,
          customExercises: d.customExercises ?? [],
          programs: d.programs ?? [],
          activeProgramId: d.activeProgramId,
          cursor: d.cursor ?? { week: 0, day: 0 },
          workouts: d.workouts ?? [],
        })
      },
    }),
    { name: 'workout-app-v1', version: 1 }
  )
)

export const useExercises = () => {
  const custom = useStore(s => s.customExercises)
  return [...BASE_EXERCISES, ...custom]
}

export const exerciseMap = (list: Exercise[]) => new Map(list.map(e => [e.id, e]))

export const emptyLogged = (exerciseId: string): LoggedExercise => ({
  exerciseId,
  sets: [{ weight: 0, reps: 0, done: false }],
})
