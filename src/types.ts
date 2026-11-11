// ===== Упражнения =====
export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'forearms'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'abs' | 'fullbody'

export type Equipment =
  | 'barbell' | 'dumbbell' | 'machine' | 'hammer' | 'cable' | 'smith'
  | 'bodyweight' | 'kettlebell' | 'band' | 'cardio'

export type Mechanics = 'compound' | 'isolation'

/** Соревновательное движение пауэрлифтинга, к которому относится упражнение */
export type MainLift = 'squat' | 'bench' | 'deadlift'

export interface Exercise {
  id: string
  name: string
  primary: MuscleGroup
  secondary?: MuscleGroup[]
  equipment: Equipment
  mechanics: Mechanics
  /** Соревновательное упражнение или его вариация (для пауэрлифтинга) */
  lift?: MainLift
  competition?: boolean
  /** Упражнение на время/дистанцию, а не на вес и повторы */
  timed?: boolean
  custom?: boolean
}

// ===== Цели и настройки программы =====
export type Discipline = 'bodybuilding' | 'fitness' | 'powerlifting'
export type BodybuildingGoal = 'mass' | 'recomp' | 'cut'
export type PowerliftingFocus = 'total' | MainLift
export type PowerliftingPhase = 'offseason' | 'prep'
/** Методика: generic — базовый шаблон, остальные — авторские циклы */
export type PowerliftingMethod = 'generic' | 'verkhoshansky' | 'sheiko'
export type Level = 'beginner' | 'intermediate' | 'advanced'

export interface ProgramSettings {
  discipline: Discipline
  level: Level
  daysPerWeek: 2 | 3 | 4 | 5
  bodybuildingGoal?: BodybuildingGoal
  plFocus?: PowerliftingFocus
  plPhase?: PowerliftingPhase
  plMethod?: PowerliftingMethod
  /** Дата соревнований (ISO yyyy-mm-dd) — для подготовки с подводкой */
  competitionDate?: string
  /** Длительность в неделях, если нет даты соревнований */
  weeks: number
}

// ===== Сгенерированная программа =====
export interface PlannedSet {
  reps: number
  /** Процент от 1ПМ (0.75 = 75%) — для пауэрлифтинговых движений */
  percent?: number
  /** Рассчитанный рабочий вес, кг */
  weight?: number
  /** Целевой RPE, если работа по ощущениям */
  rpe?: number
}

export interface PlannedExercise {
  exerciseId: string
  sets: PlannedSet[]
  restSec?: number
  note?: string
}

export interface ProgramDay {
  title: string
  exercises: PlannedExercise[]
}

export interface ProgramWeek {
  index: number
  /** Название блока/мезоцикла: «Накопление», «Интенсификация», «Подводка»… */
  block: string
  days: ProgramDay[]
}

export interface Program {
  id: string
  name: string
  createdAt: string
  settings: ProgramSettings
  /** 1ПМ на момент создания программы */
  oneRepMax: Partial<Record<MainLift, number>>
  weeks: ProgramWeek[]
  /** Пометка, что шаблон черновой и будет заменён методикой */
  draft?: boolean
  description: string
}

// ===== Дневник =====
export interface LoggedSet {
  weight: number
  reps: number
  rpe?: number
  done: boolean
}

export interface LoggedExercise {
  exerciseId: string
  sets: LoggedSet[]
  /** План из программы для подсказки */
  planned?: PlannedSet[]
}

export interface Workout {
  id: string
  startedAt: string
  finishedAt?: string
  title: string
  programId?: string
  week?: number
  day?: number
  exercises: LoggedExercise[]
  note?: string
}

export interface Profile {
  name: string
  bodyweight?: number
  oneRepMax: Partial<Record<MainLift, number>>
  /** Шаг округления весов, кг */
  rounding: number
}
