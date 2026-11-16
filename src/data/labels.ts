import type { LiftPriority, Equipment, MuscleGroup, Discipline, BodybuildingGoal, PowerliftingFocus, PowerliftingPhase, PowerliftingMethod, Level, MainLift } from '../types'

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Грудь', back: 'Спина', shoulders: 'Плечи', biceps: 'Бицепс', triceps: 'Трицепс',
  forearms: 'Предплечья', quads: 'Квадрицепс', hamstrings: 'Бицепс бедра', glutes: 'Ягодицы',
  calves: 'Икры', abs: 'Пресс', fullbody: 'Всё тело'
}

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Штанга', dumbbell: 'Гантели', machine: 'Тренажёр', hammer: 'Хаммер',
  cable: 'Блок', smith: 'Смит', bodyweight: 'Свой вес', kettlebell: 'Гиря',
  band: 'Резина', cardio: 'Кардио'
}

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  bodybuilding: 'Бодибилдинг', fitness: 'Фитнес', powerlifting: 'Пауэрлифтинг'
}

export const BB_GOAL_LABELS: Record<BodybuildingGoal, string> = {
  mass: 'Набор массы', recomp: 'Рекомпозиция', cut: 'Сушка'
}

export const PL_FOCUS_LABELS: Record<PowerliftingFocus, string> = {
  total: 'Троеборье', squat: 'Присед', bench: 'Жим лёжа', deadlift: 'Становая тяга'
}

export const PL_PHASE_LABELS: Record<PowerliftingPhase, string> = {
  offseason: 'Межсезонье', prep: 'Подготовка к соревнованиям'
}

export const PL_METHOD_LABELS: Record<PowerliftingMethod, string> = {
  generic: 'Тяжёлый/средний/лёгкий день', verkhoshansky: 'Цикл Верхошанского', sheiko: 'Шейко',
  rpe: 'По RPE', smolov: 'Смолов', russian: 'Русский цикл', piklyaev: 'Пикляев',
  texas: 'Texas Method', '531': '5/3/1', conjugate: 'Сопряжённый метод'
}

export const LEVEL_LABELS: Record<Level, string> = {
  beginner: 'Новичок', intermediate: 'Средний', advanced: 'Продвинутый'
}

export const LIFT_LABELS: Record<MainLift, string> = {
  squat: 'Присед', bench: 'Жим лёжа', deadlift: 'Становая тяга'
}

export const FIDELITY_LABELS: Record<'source-exact' | 'source-converted' | 'reconstructed', string> = {
  'source-exact': 'Точно по первоисточнику',
  'source-converted': 'По открытому источнику',
  reconstructed: 'Собрано по описанию автора',
}

export const PRIORITY_LABELS: Record<LiftPriority, string> = {
  main: 'Главное', high: 'Высокий', low: 'Поддержка', off: 'Не делаю',
}
export const PRIORITY_HINTS: Record<LiftPriority, string> = {
  main: 'готовлюсь к старту в этом движении',
  high: 'тренирую регулярно, хочу прогресс',
  low: 'изредка, без упора',
  off: 'не делаю',
}
