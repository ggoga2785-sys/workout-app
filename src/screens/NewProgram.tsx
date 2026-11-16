import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { BodybuildingGoal, Discipline, Level, MainLift, PowerliftingPhase, ProgramSettings } from '../types'
import { BB_GOAL_LABELS, DISCIPLINE_LABELS, LEVEL_LABELS, LIFT_LABELS, PL_PHASE_LABELS } from '../data/labels'
import { generateProgram, programWeeks } from '../lib/generator'
import { requiredLifts, useCatalog } from '../lib/catalog'
import { buildPlan, planOptions, type PlanOption } from '../lib/planner'
import { exerciseMap, useExercises, useStore } from '../store'
import { formatDate } from '../lib/util'
import BenchAddon, { type BenchAddonState } from '../components/BenchAddon'
import { addBenchCycle, benchChoices, upperDayIdx } from '../lib/benchAddon'
import { DEFAULT_PRIORITY, FREQ_OPTIONS, LIFTS, PRESETS, activeLifts, dayName, focusFrom } from '../lib/priorities'
import { PRIORITY_HINTS, PRIORITY_LABELS } from '../data/labels'
import type { LiftPriorities, LiftPriority } from '../types'

/** Полоса фаз плана: ширина пропорциональна числу недель */
function PhaseBar({ opt }: { opt: PlanOption }) {
  return (
    <div className="phasebar">
      {opt.phases.map((ph, i) => (
        <div key={i} className={'phase p' + i} style={{ flex: ph.weeks }}>
          <b>{ph.title}</b><span>{ph.weeks} нед.</span>
        </div>
      ))}
    </div>
  )
}

function OptionCard({ opt, on, onPick }: { opt: PlanOption; on: boolean; onPick: () => void }) {
  return (
    <button className={'pick' + (on ? ' on' : '')} onClick={onPick}>
      <b>{opt.name}{opt.recommended && <span className="badge">рекомендую</span>}</b>
      <PhaseBar opt={opt} />
      {opt.phases.length > 1 && (
        <span>{opt.phases.map(ph => `${ph.title}: ${ph.src.kind === 'catalog' ? ph.src.program.name : 'своя периодизация'}${ph.note ? ` (${ph.note})` : ''}`).join(' → ')}</span>
      )}
      {opt.pros.map((x, i) => <span key={'p' + i} className="pro">+ {x}</span>)}
      {opt.cons.map((x, i) => <span key={'c' + i} className="con">− {x}</span>)}
    </button>
  )
}

function Choice<T extends string | number>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="chips">
      {options.map(([v, l]) => (
        <button key={String(v)} className={'chip' + (v === value ? ' on' : '')} onClick={() => onChange(v)}>{l}</button>
      ))}
    </div>
  )
}

const entries = <K extends string>(o: Record<K, string>) => Object.entries(o) as [K, string][]

const DISCIPLINE_HINT: Record<Discipline, string> = {
  bodybuilding: 'Мышечная масса, рекомпозиция или сушка.',
  fitness: 'Здоровье и тонус без цели «накачаться».',
  powerlifting: 'Присед, жим, тяга: межсезонье или подводка к старту по 1ПМ.',
}

export default function NewProgram() {
  const nav = useNavigate()
  const loc = useLocation()
  const from = loc.state as { settings?: ProgramSettings; replaceId?: string } | null
  const { profile, setProfile, addProgram, removeProgram } = useStore()
  const exMap = exerciseMap(useExercises())
  const catalog = useCatalog()
  const [s, setS] = useState<ProgramSettings>(from?.settings ?? {
    discipline: 'powerlifting', level: 'intermediate', daysPerWeek: 3, weeks: 8,
    bodybuildingGoal: 'mass', plFocus: 'total', plPhase: 'offseason', plMethod: 'generic',
  })
  const [orm, setOrm] = useState<Partial<Record<MainLift, number>>>(profile.oneRepMax)
  const [picked, setPicked] = useState<string>()
  const [showAll, setShowAll] = useState(false)
  const [bench, setBench] = useState<BenchAddonState>({ on: false, rm: profile.oneRepMax.bench })
  const up = (p: Partial<ProgramSettings>) => { setS(prev => ({ ...prev, ...p })); setPicked(undefined) }
  const pl = s.discipline === 'powerlifting'
  const prio: LiftPriorities = s.plPriority ?? DEFAULT_PRIORITY
  const setPrio = (p: LiftPriorities) => up({ plPriority: p, plFocus: focusFrom(p) })
  const freq = s.plFrequency ?? {}
  const pins = s.plDays ?? {}
  const togglePin = (l: MainLift, i: number) => {
    const cur = pins[l] ?? []
    const next = cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i].sort()
    up({ plPriority: prio, plFocus: focusFrom(prio), plDays: { ...pins, [l]: next.length ? next : undefined } })
  }
  const setFreq = (l: MainLift, v: number) => up({ plPriority: prio, plFocus: focusFrom(prio), plFrequency: { ...freq, [l]: v || undefined } })
  const noLifts = pl && activeLifts(prio).length === 0
  const prepNoDate = pl && s.plPhase === 'prep' && !s.competitionDate
  const tooSoon = pl && s.plPhase === 'prep' && !!s.competitionDate && programWeeks(s) < 2

  const options = useMemo(() => (pl && catalog && !prepNoDate ? planOptions(catalog, s) : []), [pl, catalog, s, prepNoDate])
  const chosen = options.find(o => o.key === picked) ?? options[0]
  const needLifts: MainLift[] = useMemo(() => {
    if (!pl) return []
    const active = activeLifts(prio)
    const set = new Set<MainLift>(active)
    chosen?.phases.forEach(ph => ph.src.kind === 'catalog' && requiredLifts(ph.src.program, exMap).forEach(l => set.add(l)))
    return LIFTS.filter(l => set.has(l) && active.includes(l))
  }, [pl, prio, chosen, exMap])
  const missing = needLifts.filter(l => !orm[l])
  const bb = s.discipline === 'bodybuilding'
  const nUpper = useMemo(() => (bb ? upperDayIdx(generateProgram({ ...s, weeks: 1 }, {}).weeks[0], exMap).length : 0), [bb, s, exMap])
  const benchMissing = bb && bench.on && !bench.rm

  const create = () => {
    setProfile({ oneRepMax: { ...profile.oneRepMax, ...orm } })
    let p = pl && chosen ? buildPlan(chosen, s, orm, profile.rounding, exMap) : generateProgram(s, orm, profile.rounding)
    if (bb && bench.on && bench.rm && catalog) {
      p = addBenchCycle(p, catalog, bench.choice ?? benchChoices(catalog, nUpper, s.level)[0].id, bench.rm, profile.rounding, exMap)
      setProfile({ oneRepMax: { ...profile.oneRepMax, ...orm, bench: bench.rm } })
    }
    addProgram(p)
    if (from?.replaceId) removeProgram(from.replaceId)
    nav(`/programs/${p.id}`)
  }

  return (
    <div className="screen">
      <h1>{from?.replaceId ? 'Подобрать заново' : 'Новая программа'}</h1>

      <section className="field">
        <label>Направление</label>
        <div className="cards3">
          {entries(DISCIPLINE_LABELS).map(([k, l]) => (
            <button key={k} className={'pick' + (s.discipline === k ? ' on' : '')} onClick={() => up({ discipline: k })}>
              <b>{l}</b><span>{DISCIPLINE_HINT[k]}</span>
            </button>
          ))}
        </div>
      </section>

      {s.discipline === 'bodybuilding' && (
        <section className="field">
          <label>Цель</label>
          <Choice<BodybuildingGoal> value={s.bodybuildingGoal!} options={entries(BB_GOAL_LABELS)} onChange={v => up({ bodybuildingGoal: v })} />
        </section>
      )}
      {s.discipline === 'bodybuilding' && s.daysPerWeek === 3 && (
        <section className="field">
          <label>Схема на 3 дня</label>
          <Choice<'fullbody' | 'upperlower'> value={s.split ?? 'fullbody'} options={[['fullbody', 'Всё тело'], ['upperlower', 'Верх / низ']]} onChange={v => up({ split: v })} />
          {s.split === 'upperlower' && <p className="muted">Каждую неделю: пн — верх, ср — низ + руки, пт — верх. Упор на грудь и руки: ~18 подходов на грудь, ~14 на бицепс, ~12 на трицепс в неделю.</p>}
        </section>
      )}

      {pl && (
        <>
          <section className="field">
            <label>Что тренируем</label>
            <div className="chips">
              {PRESETS.map(pr => (
                <button key={pr.label} className={'chip' + (LIFTS.every(l => pr.p[l] === prio[l]) ? ' on' : '')} onClick={() => up({ plPriority: pr.p, plFocus: focusFrom(pr.p), plFrequency: pr.f, plDays: s.daysPerWeek === 3 ? pr.days : undefined })}>{pr.label}</button>
              ))}
            </div>
            <div className="prio">
              {LIFTS.map(l => (
                <div key={l} className="prio-row">
                  <b>{LIFT_LABELS[l]}</b>
                  <div className="seg">
                    {(['main', 'high', 'low', 'off'] as LiftPriority[]).map(v => (
                      <button key={v} className={'seg-btn' + (prio[l] === v ? ' on ' + v : '')} onClick={() => setPrio({ ...prio, [l]: v })}>{PRIORITY_LABELS[v]}</button>
                    ))}
                  </div>
                  {prio[l] !== 'off' && (
                    <div className="freq">
                      <span>Дни:</span>
                      {Array.from({ length: s.daysPerWeek }, (_, i) => (
                        <button key={i} className={'chip small' + (pins[l]?.includes(i) ? ' on' : '')} onClick={() => togglePin(l, i)}>{dayName(i, s.daysPerWeek)}</button>
                      ))}
                      {!pins[l]?.length && <span>любые</span>}
                    </div>
                  )}
                  {prio[l] !== 'off' && !pins[l]?.length && (
                    <div className="freq">
                      <span>Раз в неделю:</span>
                      {FREQ_OPTIONS.map(([v, t]) => (
                        <button key={v} className={'chip small' + ((freq[l] ?? 0) === v ? ' on' : '')} onClick={() => setFreq(l, v)}>{t}</button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="muted small">«Главное» — движение, к которому готовишься; под него подбирается программа. {LIFTS.map(l => `${LIFT_LABELS[l]}: ${PRIORITY_HINTS[prio[l]]}`).join('; ')}.</p>
          </section>
          <section className="field">
            <label>Период</label>
            <Choice<PowerliftingPhase> value={s.plPhase!} options={entries(PL_PHASE_LABELS)} onChange={v => up({ plPhase: v })} />
          </section>
          {s.plPhase === 'prep' && (
            <section className="field">
              <label>Дата соревнований</label>
              <input className="input" type="date" value={s.competitionDate ?? ''} onChange={e => up({ competitionDate: e.target.value || undefined })} />
              {s.competitionDate && (tooSoon
                ? <p className="muted">До старта меньше 2 недель: подготовку уже не построить, лучше выбрать межсезонье.</p>
                : <p className="muted">До старта {programWeeks(s)} нед. ({formatDate(s.competitionDate)}). План закончится неделей соревнований.</p>)}
            </section>
          )}
          <section className="field">
            <label>Разовый максимум (1ПМ), кг</label>
            <div className="row">
              {needLifts.map(l => (
                <div key={l} className="mini">
                  <span>{LIFT_LABELS[l]}</span>
                  <input className="input" type="number" inputMode="decimal" value={orm[l] ?? ''} onChange={e => setOrm(o => ({ ...o, [l]: e.target.value ? Number(e.target.value) : undefined }))} />
                </div>
              ))}
            </div>
            <p className="muted">Не знаешь 1ПМ? Возьми рабочий вес 5×5 и умножь на 1,2.</p>
          </section>
        </>
      )}

      <section className="field">
        <label>Уровень</label>
        <Choice<Level> value={s.level} options={entries(LEVEL_LABELS)} onChange={v => up({ level: v })} />
      </section>
      <section className="field">
        <label>Тренировок в неделю</label>
        <Choice<number> value={s.daysPerWeek} options={[[2, '2'], [3, '3'], [4, '4'], [5, '5']]} onChange={v => up({ daysPerWeek: v, plDays: undefined })} />
      </section>
      {!(pl && s.plPhase === 'prep') && (
        <section className="field">
          <label>Длительность, недель</label>
          <Choice<number> value={s.weeks} options={[[4, '4'], [8, '8'], [12, '12'], [16, '16']]} onChange={v => up({ weeks: v })} />
        </section>
      )}

      {pl && !prepNoDate && !tooSoon && !noLifts && (
        <section className="field">
          <label>Подобранный план</label>
          {!catalog && <p className="muted">Подбираю…</p>}
          {chosen && <OptionCard opt={chosen} on onPick={() => {}} />}
          {options.length > 1 && (
            <button className="btn ghost" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Скрыть другие варианты' : `Выбрать другую программу (${options.length - 1})`}
            </button>
          )}
          {showAll && options.filter(o => o !== chosen).map(o => (
            <OptionCard key={o.key} opt={o} on={false} onPick={() => { setPicked(o.key); setShowAll(false) }} />
          ))}
        </section>
      )}

      {bb && nUpper > 0 && <BenchAddon value={bench} onChange={setBench} upperDays={nUpper} level={s.level} />}

      <button className="btn primary wide" disabled={missing.length > 0 || prepNoDate || tooSoon || noLifts || benchMissing} onClick={create}>
        {benchMissing ? 'Введи 1ПМ в жиме' : noLifts ? 'Выбери хотя бы одно движение' : prepNoDate ? 'Укажи дату соревнований' : missing.length ? `Введи 1ПМ: ${missing.map(l => LIFT_LABELS[l].toLowerCase()).join(', ')}` : 'Составить программу'}
      </button>
    </div>
  )
}
