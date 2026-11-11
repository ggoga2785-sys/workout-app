export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export const roundTo = (value: number, step: number) => Math.round(value / step) * step

export const todayISO = () => new Date().toISOString().slice(0, 10)

export const weeksUntil = (dateISO: string) => {
  const ms = new Date(dateISO + 'T00:00:00').getTime() - Date.now()
  return Math.ceil(ms / (7 * 24 * 3600 * 1000))
}

/** Оценка 1ПМ по формуле Эпли — для подсказок в дневнике */
export const estimate1RM = (weight: number, reps: number) =>
  reps <= 1 ? weight : Math.round(weight * (1 + reps / 30))

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })

/** Оценка 1ПМ по рабочему весу 5×5 («Антимакроберт»): вес × 1,2 */
export const estimate1RMFrom5x5 = (weight5x5: number) => Math.round(weight5x5 * 1.2)
