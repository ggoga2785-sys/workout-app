import { useEffect, useState } from 'react'
import type { CatalogProgram, Exercise, MainLift, Program } from '../types'
import { roundTo, uid } from './util'

export interface Catalog {
  fidelityLegend: Record<string, string>
  reference: Record<string, unknown>
  programs: CatalogProgram[]
}

let cache: Catalog | undefined

/** Каталог тяжёлый (~600 КБ), поэтому грузится отдельным чанком при первом открытии */
export function loadCatalog(): Promise<Catalog> {
  if (cache) return Promise.resolve(cache)
  return import('../data/programs.json').then(m => (cache = m.default as unknown as Catalog))
}

export function useCatalog() {
  const [c, setC] = useState<Catalog | undefined>(cache)
  useEffect(() => { if (!c) loadCatalog().then(setC) }, [c])
  return c
}

const liftOf = (exMap: Map<string, Exercise>, exerciseId: string, percentOf?: MainLift) =>
  percentOf ?? exMap.get(exerciseId)?.lift

/** Движения, для которых нужен 1ПМ (есть подходы в % от максимума) */
export function requiredLifts(cp: CatalogProgram, exMap: Map<string, Exercise>): MainLift[] {
  const set = new Set<MainLift>()
  for (const w of cp.weeks) for (const d of w.days) for (const e of d.exercises)
    for (const s of e.sets) if (s.percent) { const l = liftOf(exMap, e.exerciseId, s.percentOf); if (l) set.add(l) }
  return (['squat', 'bench', 'deadlift'] as MainLift[]).filter(l => set.has(l))
}

/** Превращает программу каталога в программу пользователя с весами от его 1ПМ */
export function instantiate(
  cp: CatalogProgram, orm: Partial<Record<MainLift, number>>, rounding: number, exMap: Map<string, Exercise>,
): Program {
  const tm = cp.trainingMaxFactor ?? 1
  const weeks = cp.weeks.map(w => ({
    ...w,
    days: w.days.map(d => ({
      ...d,
      exercises: d.exercises.map(e => ({
        ...e,
        sets: e.sets.map(s => {
          if (!s.percent) return { ...s }
          const lift = liftOf(exMap, e.exerciseId, s.percentOf)
          const max = lift ? orm[lift] : undefined
          return { ...s, weight: max ? roundTo(max * tm * s.percent, rounding) : undefined }
        }),
      })),
    })),
  }))
  return {
    id: uid(),
    name: cp.name,
    createdAt: new Date().toISOString(),
    settings: {
      discipline: cp.discipline, level: cp.level, daysPerWeek: cp.daysPerWeek, weeks: cp.durationWeeks,
      bodybuildingGoal: cp.bodybuildingGoal, plFocus: cp.plFocus, plPhase: cp.plPhase, plMethod: cp.plMethod,
    },
    oneRepMax: { ...orm },
    weeks,
    description: cp.description,
    meta: {
      catalogId: cp.id, author: cp.author, levelNote: cp.levelNote, progression: cp.progression,
      peaking: cp.peaking, howToUse: cp.howToUse, variability: cp.variability,
      fidelity: cp.fidelity, fidelityNote: cp.fidelityNote, sources: cp.sources ?? [],
      trainingMaxFactor: cp.trainingMaxFactor,
    },
  }
}
