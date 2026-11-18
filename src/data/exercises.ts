import extra from './newExercises.json'
import type { Equipment, Exercise, MainLift, Mechanics, MuscleGroup } from '../types'

// Компактная запись: [id, название, основная группа, оборудование, механика, доп. группы?, свойства?]
type Row = [string, string, MuscleGroup, Equipment, Mechanics, MuscleGroup[]?, { lift?: MainLift; competition?: boolean; timed?: boolean }?]

const C: Mechanics = 'compound'
const I: Mechanics = 'isolation'

const rows: Row[] = [
  // ===== Соревновательные движения и вариации =====
  ['squat', 'Приседания со штангой на спине', 'quads', 'barbell', C, ['glutes', 'hamstrings'], { lift: 'squat', competition: true }],
  ['squat-pause', 'Приседания с паузой', 'quads', 'barbell', C, ['glutes'], { lift: 'squat' }],
  ['squat-box', 'Приседания на ящик', 'quads', 'barbell', C, ['glutes', 'hamstrings'], { lift: 'squat' }],
  ['squat-front', 'Фронтальные приседания', 'quads', 'barbell', C, ['glutes', 'abs'], { lift: 'squat' }],
  ['squat-highbar', 'Приседания (высокий гриф)', 'quads', 'barbell', C, ['glutes'], { lift: 'squat' }],
  ['squat-safety', 'Приседания с безопасным грифом', 'quads', 'barbell', C, ['glutes'], { lift: 'squat' }],
  ['bench', 'Жим штанги лёжа', 'chest', 'barbell', C, ['triceps', 'shoulders'], { lift: 'bench', competition: true }],
  ['bench-pause', 'Жим лёжа с паузой на груди', 'chest', 'barbell', C, ['triceps', 'shoulders'], { lift: 'bench' }],
  ['bench-close', 'Жим лёжа узким хватом', 'triceps', 'barbell', C, ['chest', 'shoulders'], { lift: 'bench' }],
  ['bench-wide', 'Жим лёжа широким хватом', 'chest', 'barbell', C, ['shoulders'], { lift: 'bench' }],
  ['bench-board', 'Жим лёжа с бруском', 'chest', 'barbell', C, ['triceps'], { lift: 'bench' }],
  ['bench-spoto', 'Жим Спото (остановка над грудью)', 'chest', 'barbell', C, ['triceps'], { lift: 'bench' }],
  ['bench-feet-up', 'Жим лёжа с поднятыми ногами', 'chest', 'barbell', C, ['triceps'], { lift: 'bench' }],
  ['bench-incline', 'Жим штанги на наклонной скамье', 'chest', 'barbell', C, ['shoulders', 'triceps'], { lift: 'bench' }],
  ['bench-decline', 'Жим штанги на скамье с обратным наклоном', 'chest', 'barbell', C, ['triceps']],
  ['bench-floor', 'Жим штанги лёжа на полу', 'triceps', 'barbell', C, ['chest'], { lift: 'bench' }],
  ['deadlift', 'Становая тяга (классика)', 'back', 'barbell', C, ['hamstrings', 'glutes'], { lift: 'deadlift', competition: true }],
  ['deadlift-sumo', 'Становая тяга сумо', 'glutes', 'barbell', C, ['quads', 'back', 'hamstrings'], { lift: 'deadlift', competition: true }],
  ['deadlift-deficit', 'Становая тяга с подставки (дефицит)', 'back', 'barbell', C, ['hamstrings', 'glutes'], { lift: 'deadlift' }],
  ['deadlift-pause', 'Становая тяга с паузой у колен', 'back', 'barbell', C, ['hamstrings'], { lift: 'deadlift' }],
  ['deadlift-blocks', 'Тяга с плинтов', 'back', 'barbell', C, ['glutes'], { lift: 'deadlift' }],
  ['rdl', 'Румынская тяга', 'hamstrings', 'barbell', C, ['glutes', 'back'], { lift: 'deadlift' }],
  ['db-rdl', 'Румынская тяга с гантелями', 'hamstrings', 'dumbbell', C, ['glutes', 'back']],
  ['plate-squat', 'Приседания с блином у груди', 'quads', 'barbell', C, ['glutes']],
  ['sldl', 'Тяга на прямых ногах', 'hamstrings', 'barbell', C, ['back', 'glutes'], { lift: 'deadlift' }],
  ['good-morning', 'Наклоны со штангой (гуд морнинг)', 'hamstrings', 'barbell', C, ['back', 'glutes']],

  // ===== Грудь =====
  ['db-bench', 'Жим гантелей лёжа', 'chest', 'dumbbell', C, ['triceps', 'shoulders']],
  ['db-incline', 'Жим гантелей на наклонной скамье', 'chest', 'dumbbell', C, ['shoulders', 'triceps']],
  ['db-fly', 'Разведение гантелей лёжа', 'chest', 'dumbbell', I],
  ['db-pullover', 'Пуловер с гантелью', 'chest', 'dumbbell', I, ['back']],
  ['hammer-chest', 'Жим в хаммере от груди', 'chest', 'hammer', C, ['triceps']],
  ['hammer-incline', 'Жим в хаммере под углом вверх', 'chest', 'hammer', C, ['shoulders']],
  ['hammer-decline', 'Жим в хаммере под углом вниз', 'chest', 'hammer', C, ['triceps']],
  ['machine-chest', 'Жим в тренажёре сидя', 'chest', 'machine', C, ['triceps']],
  ['pec-deck', 'Сведение рук в тренажёре (бабочка)', 'chest', 'machine', I],
  ['cable-fly', 'Сведение рук в кроссовере', 'chest', 'cable', I],
  ['cable-fly-low', 'Сведение в кроссовере снизу вверх', 'chest', 'cable', I],
  ['smith-incline', 'Жим в Смите на наклонной скамье', 'chest', 'smith', C, ['shoulders']],
  ['dips', 'Отжимания на брусьях', 'chest', 'bodyweight', C, ['triceps', 'shoulders']],
  ['push-up', 'Отжимания от пола', 'chest', 'bodyweight', C, ['triceps']],

  // ===== Спина =====
  ['pull-up', 'Подтягивания', 'back', 'bodyweight', C, ['biceps']],
  ['chin-up', 'Подтягивания обратным хватом', 'back', 'bodyweight', C, ['biceps']],
  ['lat-pulldown', 'Тяга верхнего блока к груди', 'back', 'cable', C, ['biceps']],
  ['lat-pulldown-close', 'Тяга верхнего блока узким хватом', 'back', 'cable', C, ['biceps']],
  ['seated-row', 'Тяга нижнего блока к поясу', 'back', 'cable', C, ['biceps']],
  ['straight-pulldown', 'Пуловер в блоке прямыми руками', 'back', 'cable', I],
  ['bb-row', 'Тяга штанги в наклоне', 'back', 'barbell', C, ['biceps', 'hamstrings']],
  ['pendlay-row', 'Тяга Пендлея', 'back', 'barbell', C, ['biceps']],
  ['t-bar-row', 'Тяга Т-грифа', 'back', 'barbell', C, ['biceps']],
  ['db-row', 'Тяга гантели одной рукой', 'back', 'dumbbell', C, ['biceps']],
  ['hammer-row', 'Тяга в хаммере к поясу', 'back', 'hammer', C, ['biceps']],
  ['hammer-pulldown', 'Тяга в хаммере сверху', 'back', 'hammer', C, ['biceps']],
  ['hammer-low-row', 'Тяга в хаммере снизу одной рукой', 'back', 'hammer', C, ['biceps']],
  ['machine-row', 'Тяга в рычажном тренажёре с упором в грудь', 'back', 'machine', C, ['biceps']],
  ['hyperext', 'Гиперэкстензия', 'back', 'bodyweight', I, ['glutes', 'hamstrings']],
  ['shrug-bb', 'Шраги со штангой', 'back', 'barbell', I],
  ['shrug-db', 'Шраги с гантелями', 'back', 'dumbbell', I],

  // ===== Плечи =====
  ['ohp', 'Жим штанги стоя (армейский)', 'shoulders', 'barbell', C, ['triceps']],
  ['seated-bb-press', 'Жим штанги сидя', 'shoulders', 'barbell', C, ['triceps']],
  ['db-press', 'Жим гантелей сидя', 'shoulders', 'dumbbell', C, ['triceps']],
  ['arnold-press', 'Жим Арнольда', 'shoulders', 'dumbbell', C, ['triceps']],
  ['hammer-shoulder', 'Жим в хаммере на плечи', 'shoulders', 'hammer', C, ['triceps']],
  ['machine-shoulder', 'Жим в тренажёре на плечи', 'shoulders', 'machine', C, ['triceps']],
  ['lateral-raise', 'Махи гантелями в стороны', 'shoulders', 'dumbbell', I],
  ['cable-lateral', 'Отведение руки в блоке', 'shoulders', 'cable', I],
  ['machine-lateral', 'Махи в стороны в тренажёре', 'shoulders', 'machine', I],
  ['front-raise', 'Подъём гантелей перед собой', 'shoulders', 'dumbbell', I],
  ['rear-delt-fly', 'Разведение гантелей в наклоне', 'shoulders', 'dumbbell', I, ['back']],
  ['reverse-pec-deck', 'Обратная бабочка', 'shoulders', 'machine', I, ['back']],
  ['face-pull', 'Тяга каната к лицу', 'shoulders', 'cable', I, ['back']],
  ['upright-row', 'Тяга штанги к подбородку', 'shoulders', 'barbell', C, ['back']],

  // ===== Руки =====
  ['bb-curl', 'Подъём штанги на бицепс', 'biceps', 'barbell', I, ['forearms']],
  ['ez-curl', 'Подъём EZ-штанги на бицепс', 'biceps', 'barbell', I],
  ['db-curl', 'Подъём гантелей на бицепс', 'biceps', 'dumbbell', I],
  ['hammer-curl', 'Молотки с гантелями', 'biceps', 'dumbbell', I, ['forearms']],
  ['incline-curl', 'Сгибания на наклонной скамье', 'biceps', 'dumbbell', I],
  ['preacher-curl', 'Сгибания на скамье Скотта', 'biceps', 'barbell', I],
  ['cable-curl', 'Сгибания рук в блоке', 'biceps', 'cable', I],
  ['machine-curl', 'Сгибания в тренажёре на бицепс', 'biceps', 'machine', I],
  ['skull-crusher', 'Французский жим лёжа', 'triceps', 'barbell', I],
  ['db-overhead-ext', 'Разгибание гантели из-за головы', 'triceps', 'dumbbell', I],
  ['pushdown', 'Разгибание рук в блоке (прямая рукоять)', 'triceps', 'cable', I],
  ['pushdown-rope', 'Разгибание рук в блоке с канатом', 'triceps', 'cable', I],
  ['cable-overhead-ext', 'Разгибание из-за головы в блоке', 'triceps', 'cable', I],
  ['bench-dips', 'Обратные отжимания от скамьи', 'triceps', 'bodyweight', C],
  ['machine-dips', 'Отжимания в тренажёре (дипс-машина)', 'triceps', 'machine', C, ['chest']],
  ['wrist-curl', 'Сгибания запястий со штангой', 'forearms', 'barbell', I],
  ['farmer-walk', 'Прогулка фермера', 'forearms', 'dumbbell', C, ['back', 'fullbody'], { timed: true }],

  // ===== Ноги =====
  ['leg-press', 'Жим ногами', 'quads', 'machine', C, ['glutes']],
  ['hack-squat', 'Гакк-приседания', 'quads', 'machine', C, ['glutes']],
  ['hammer-squat', 'Приседания в хаммере (V-squat)', 'quads', 'hammer', C, ['glutes']],
  ['smith-squat', 'Приседания в Смите', 'quads', 'smith', C, ['glutes']],
  ['goblet-squat', 'Гоблет-приседания', 'quads', 'dumbbell', C, ['glutes']],
  ['bulgarian', 'Болгарские выпады', 'quads', 'dumbbell', C, ['glutes']],
  ['lunges', 'Выпады с гантелями', 'quads', 'dumbbell', C, ['glutes']],
  ['step-up', 'Зашагивания на тумбу', 'quads', 'dumbbell', C, ['glutes']],
  ['leg-ext', 'Разгибание ног в тренажёре', 'quads', 'machine', I],
  ['leg-curl-lying', 'Сгибание ног лёжа', 'hamstrings', 'machine', I],
  ['leg-curl-seated', 'Сгибание ног сидя', 'hamstrings', 'machine', I],
  ['hip-thrust', 'Ягодичный мост со штангой', 'glutes', 'barbell', C, ['hamstrings']],
  ['glute-kickback', 'Отведение ноги назад в блоке', 'glutes', 'cable', I],
  ['hip-abduction', 'Разведение ног в тренажёре', 'glutes', 'machine', I],
  ['hip-adduction', 'Сведение ног в тренажёре', 'quads', 'machine', I],
  ['calf-standing', 'Подъём на носки стоя', 'calves', 'machine', I],
  ['calf-seated', 'Подъём на носки сидя', 'calves', 'machine', I],
  ['calf-leg-press', 'Подъём на носки в жиме ногами', 'calves', 'machine', I],

  // ===== Пресс и кор =====
  ['plank', 'Планка', 'abs', 'bodyweight', I, [], { timed: true }],
  ['crunch', 'Скручивания', 'abs', 'bodyweight', I],
  ['lying-leg-raise', 'Подъём ног лёжа', 'abs', 'bodyweight', I],
  ['side-plank', 'Боковая планка', 'abs', 'bodyweight', I, [], { timed: true }],
  ['hanging-leg-raise', 'Подъём ног в висе', 'abs', 'bodyweight', I],
  ['cable-crunch', 'Скручивания в блоке на коленях', 'abs', 'cable', I],
  ['ab-wheel', 'Ролик для пресса', 'abs', 'bodyweight', I],
  ['russian-twist', 'Русские скручивания', 'abs', 'bodyweight', I],
  ['pallof', 'Жим Паллофа', 'abs', 'cable', I],

  // ===== Функционал и кардио (фитнес) =====
  ['kb-swing', 'Махи гирей', 'fullbody', 'kettlebell', C, ['glutes', 'hamstrings']],
  ['burpee', 'Бёрпи', 'fullbody', 'bodyweight', C],
  ['band-pull-apart', 'Разведение резины перед собой', 'shoulders', 'band', I, ['back']],
  ['bodyweight-squat', 'Приседания без веса', 'quads', 'bodyweight', C, ['glutes']],
  ['treadmill', 'Беговая дорожка', 'fullbody', 'cardio', C, [], { timed: true }],
  ['bike', 'Велотренажёр', 'fullbody', 'cardio', C, [], { timed: true }],
  ['elliptical', 'Эллипс', 'fullbody', 'cardio', C, [], { timed: true }],
  ['rower', 'Гребной тренажёр', 'fullbody', 'cardio', C, ['back'], { timed: true }],
  ['jump-rope', 'Скакалка', 'fullbody', 'cardio', C, ['calves'], { timed: true }],
]

const base: Exercise[] = rows.map(([id, name, primary, equipment, mechanics, secondary, props]) => ({
  id, name, primary, equipment, mechanics, secondary, ...props
}))

/** Базовые + добавленные вместе с каталогом программ */
export const BASE_EXERCISES: Exercise[] = [...base, ...(extra as Exercise[])]
