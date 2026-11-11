/**
 * Подбор программы пауэрлифтинга по входным данным:
 * режим (межсезонье / подготовка к дате), что тренируем, уровень, тренировок в неделю.
 * Для подготовки считает недели до старта и собирает план из фаз:
 * база (межсезонная программа, при необходимости повторяется) → соревновательная программа,
 * которая заканчивается неделей старта. Рекомендуется вариант с лучшей оценкой,
 * остальные показываются как альтернативы — пользователь может выбрать любой.
 */
import type { CatalogProgram, Exercise, Level, MainLift, Program, ProgramPhase, ProgramSettings, ProgramWeek } from '../types'
import type { Catalog } from './catalog'
import { instantiate } from './catalog'
import { generateProgram, programWeeks } from './generator'
import { LEVEL_LABELS, PL_METHOD_LABELS } from '../data/labels'
import { applyPriorities, describePriorities } from './priorities'

type PhaseSrc = { kind: 'catalog'; program: CatalogProgram } | { kind: 'generic'; phase: 'offseason' | 'prep' }

interface PhasePlan { title: string; weeks: number; src: PhaseSrc; note?: string }

export interface PlanOption {
  key: string
  name: string
  method: string
  phases: PhasePlan[]
  totalWeeks: number
  score: number
  pros: string[]
  cons: string[]
  recommended?: boolean
}

const LEVEL_N: Record<Level, number> = { beginner: 0, intermediate: 1, advanced: 2 }

function fitScore(p: { daysPerWeek: number; level: Level }, s: ProgramSettings, pros: string[], cons: string[]) {
  let score = 0
  const dd = p.daysPerWeek - s.daysPerWeek
  if (dd === 0) pros.push(`${p.daysPerWeek} трен. в неделю, как ты хочешь`)
  else { score += Math.abs(dd) * 2; cons.push(`${p.daysPerWeek} трен. в неделю (ты выбрал ${s.daysPerWeek})`) }
  const ld = LEVEL_N[p.level] - LEVEL_N[s.level]
  if (ld === 0) pros.push(`уровень: ${LEVEL_LABELS[p.level].toLowerCase()}`)
  else if (ld > 0) { score += ld * 2; cons.push(`рассчитана на уровень «${LEVEL_LABELS[p.level].toLowerCase()}»`) }
  else { score += 0.5; cons.push(`рассчитана на уровень «${LEVEL_LABELS[p.level].toLowerCase()}», может быть легковата`) }
  return score
}

const pl = (c: Catalog) => c.programs.filter(p => p.discipline === 'powerlifting')
const focusOk = (p: CatalogProgram, s: ProgramSettings) => (p.plFocus ?? 'total') === (s.plFocus ?? 'total')

/** Лучшая межсезонная программа для базы перед соревновательной частью */
function pickBase(c: Catalog, s: ProgramSettings, method?: string): CatalogProgram | undefined {
  const cands = pl(c).filter(p => p.plPhase === 'offseason' && (focusOk(p, s) || p.plFocus === 'total'))
  const rank = (p: CatalogProgram) =>
    (p.plMethod === method ? 0 : 3) + (focusOk(p, s) ? 0 : 2) +
    Math.abs(p.daysPerWeek - s.daysPerWeek) * 2 + Math.abs(LEVEL_N[p.level] - LEVEL_N[s.level]) * 2
  return cands.sort((a, b) => rank(a) - rank(b))[0]
}

export function planOptions(c: Catalog, s: ProgramSettings): PlanOption[] {
  const out: PlanOption[] = []
  const prep = s.plPhase === 'prep'
  const W = programWeeks(s)

  if (prep) {
    for (const p of pl(c).filter(p => p.plPhase === 'prep' && focusOk(p, s))) {
      const pros: string[] = [], cons: string[] = []
      let score = fitScore(p, s, pros, cons)
      let mainWeeks = p.durationWeeks
      const phases: PhasePlan[] = []
      if (p.durationWeeks > W) {
        if (W < p.durationWeeks - 4 || W < 3) continue
        mainWeeks = W
        score += 3
        cons.push(`сокращена до ${W} нед. (полная — ${p.durationWeeks})`)
      }
      const gap = W - mainWeeks
      if (gap > 0) {
        const base = gap >= 3 ? pickBase(c, s, p.plMethod) : undefined
        phases.push(base
          ? { title: 'База', weeks: gap, src: { kind: 'catalog', program: base }, note: gap > base.durationWeeks ? 'повторяется по кругу с пересчётом 1ПМ' : undefined }
          : { title: 'База', weeks: gap, src: { kind: 'generic', phase: 'offseason' } })
        score += gap > 8 ? 1 : 0
        pros.push(`до старта ${W} нед.: ${gap} нед. базы, затем ${mainWeeks} нед. подготовки`)
      } else pros.push(`ровно ${W} нед. до старта`)
      phases.push({ title: 'Подготовка к старту', weeks: mainWeeks, src: { kind: 'catalog', program: p } })
      if (p.fidelity === 'source-exact') { score -= 0.5; pros.push('точно по первоисточнику') }
      out.push({ key: p.id, name: p.name, method: PL_METHOD_LABELS[p.plMethod ?? 'generic'], phases, totalWeeks: W, score, pros, cons })
    }
  } else {
    for (const p of pl(c).filter(p => p.plPhase === 'offseason' && (focusOk(p, s) || (s.plFocus === 'deadlift' && p.plFocus === 'total')))) {
      const pros: string[] = [], cons: string[] = []
      let score = fitScore(p, s, pros, cons)
      if (!focusOk(p, s)) { score += 1; cons.push('троеборная — тяга идёт вместе с приседом и жимом') }
      if (p.fidelity === 'source-exact') { score -= 0.5; pros.push('точно по первоисточнику') }
      pros.push(`${p.durationWeeks} нед., потом можно повторить`)
      out.push({ key: p.id, name: p.name, method: PL_METHOD_LABELS[p.plMethod ?? 'generic'], phases: [{ title: 'Межсезонье', weeks: p.durationWeeks, src: { kind: 'catalog', program: p } }], totalWeeks: p.durationWeeks, score, pros, cons })
    }
  }

  // Своя периодизация (тяжёлый/средний/лёгкий день) подстраивается под любое число недель и дней
  out.push({
    key: 'generic', name: 'Своя периодизация: тяжёлый / средний / лёгкий день', method: PL_METHOD_LABELS.generic,
    phases: [{ title: prep ? 'Накопление → интенсификация → пик → подводка' : 'Волны по 4 недели', weeks: W, src: { kind: 'generic', phase: prep ? 'prep' : 'offseason' } }],
    totalWeeks: W, score: 2.5,
    pros: [`ровно под ${s.daysPerWeek} трен. в неделю и ${W} нед.`],
    cons: ['шаблон приложения, а не авторская методика'],
  })

  if (s.plPriority) {
    const notes = describePriorities(s.plPriority)
    out.forEach(o => o.pros.push(...notes))
  }
  out.sort((a, b) => a.score - b.score)
  if (out.length) out[0].recommended = true
  return out
}

/** Берёт n недель из программы; если её не хватает — повторяет по кругу, если много — берёт последние */
function takeWeeks(weeks: ProgramWeek[], n: number, fromEnd: boolean): ProgramWeek[] {
  if (weeks.length >= n) return fromEnd ? weeks.slice(weeks.length - n) : weeks.slice(0, n)
  const res: ProgramWeek[] = []
  for (let i = 0; i < n; i++) {
    const w = weeks[i % weeks.length]
    const lap = Math.floor(i / weeks.length)
    res.push(lap ? { ...w, block: `${w.block} (круг ${lap + 1})` } : w)
  }
  return res
}

export function buildPlan(
  opt: PlanOption, s: ProgramSettings, orm: Partial<Record<MainLift, number>>, rounding: number, exMap: Map<string, Exercise>,
): Program {
  const weeks: ProgramWeek[] = []
  const phases: ProgramPhase[] = []
  opt.phases.forEach((ph, i) => {
    const last = i === opt.phases.length - 1
    let src: ProgramWeek[]
    let label: string
    let catalogId: string | undefined
    if (ph.src.kind === 'catalog') {
      src = instantiate(ph.src.program, orm, rounding, exMap).weeks
      label = ph.src.program.name
      catalogId = ph.src.program.id
    } else {
      const g = generateProgram({ ...s, plPhase: ph.src.phase, weeks: ph.weeks, competitionDate: ph.src.phase === 'prep' ? s.competitionDate : undefined }, orm, rounding)
      src = g.weeks
      label = PL_METHOD_LABELS.generic
    }
    const start = weeks.length
    // Соревновательная часть берётся с конца, чтобы пик пришёлся на неделю старта
    takeWeeks(src, ph.weeks, last && s.plPhase === 'prep').forEach(w => weeks.push({ ...w, index: weeks.length }))
    phases.push({ title: ph.title, startWeek: start, endWeek: weeks.length - 1, program: label, catalogId })
  })

  const shaped = s.plPriority
    ? applyPriorities(weeks, s.plPriority, orm, rounding, exMap, s.plPhase === 'prep')
    : weeks
  const main = opt.phases[opt.phases.length - 1].src
  const base = main.kind === 'catalog'
    ? instantiate(main.program, orm, rounding, exMap)
    : generateProgram(s, orm, rounding)
  return {
    ...base,
    name: opt.phases.length > 1 ? `Подготовка к старту: ${opt.method}` : opt.name,
    settings: { ...s, plMethod: main.kind === 'catalog' ? main.program.plMethod : 'generic', weeks: weeks.length },
    weeks: shaped,
    phases,
    draft: main.kind === 'generic',
    description: base.description,
  }
}
