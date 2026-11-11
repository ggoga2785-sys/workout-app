import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { BodybuildingGoal, Discipline, Level, MainLift, PowerliftingFocus, PowerliftingMethod, PowerliftingPhase, ProgramSettings } from '../types'
import { BB_GOAL_LABELS, DISCIPLINE_LABELS, LEVEL_LABELS, LIFT_LABELS, PL_FOCUS_LABELS, PL_METHOD_LABELS, PL_PHASE_LABELS } from '../data/labels'
import { generateProgram, programWeeks } from '../lib/generator'
import { useStore } from '../store'

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
  const { profile, setProfile, addProgram } = useStore()
  const [s, setS] = useState<ProgramSettings>({
    discipline: 'powerlifting', level: 'intermediate', daysPerWeek: 3, weeks: 8,
    bodybuildingGoal: 'mass', plFocus: 'total', plPhase: 'offseason', plMethod: 'generic',
  })
  const [orm, setOrm] = useState<Partial<Record<MainLift, number>>>(profile.oneRepMax)
  const up = (p: Partial<ProgramSettings>) => setS(prev => ({ ...prev, ...p }))
  const pl = s.discipline === 'powerlifting'
  const needLifts: MainLift[] = pl ? (s.plFocus === 'total' || !s.plFocus ? ['squat', 'bench', 'deadlift'] : [s.plFocus]) : []
  const missing = needLifts.filter(l => !orm[l])
  const prepNoDate = pl && s.plPhase === 'prep' && !s.competitionDate

  const create = () => {
    setProfile({ oneRepMax: { ...profile.oneRepMax, ...orm } })
    const p = generateProgram(s, orm, profile.rounding)
    addProgram(p)
    nav(`/programs/${p.id}`)
  }

  return (
    <div className="screen">
      <h1>Новая программа</h1>

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

      {pl && (
        <>
          <section className="field">
            <label>Что тренируем</label>
            <Choice<PowerliftingFocus> value={s.plFocus!} options={entries(PL_FOCUS_LABELS)} onChange={v => up({ plFocus: v, plMethod: v === 'bench' || v === 'total' ? s.plMethod : s.plMethod === 'verkhoshansky' ? 'generic' : s.plMethod })} />
          </section>
          <section className="field">
            <label>Период</label>
            <Choice<PowerliftingPhase> value={s.plPhase!} options={entries(PL_PHASE_LABELS)} onChange={v => up({ plPhase: v })} />
          </section>
          {s.plPhase === 'prep' && (
            <section className="field">
              <label>Дата соревнований</label>
              <input className="input" type="date" value={s.competitionDate ?? ''} onChange={e => up({ competitionDate: e.target.value || undefined })} />
              {s.competitionDate && <p className="muted">Программа на {programWeeks(s)} нед. с подводкой к этой дате.</p>}
            </section>
          )}
          <section className="field">
            <label>Методика</label>
            <Choice<PowerliftingMethod>
              value={s.plMethod!}
              options={entries(PL_METHOD_LABELS).filter(([k]) => k === 'generic' || k === 'sheiko' || (k === 'verkhoshansky' && s.plFocus === 'bench'))}
              onChange={v => up({ plMethod: v })} />
            {s.plMethod !== 'generic' && <p className="muted">Пока черновое приближение. Точные таблицы цикла будут добавлены по методике.</p>}
          </section>
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
        <Choice<number> value={s.daysPerWeek} options={[[2, '2'], [3, '3'], [4, '4'], [5, '5']]} onChange={v => up({ daysPerWeek: v })} />
      </section>
      {!(pl && s.plPhase === 'prep') && (
        <section className="field">
          <label>Длительность, недель</label>
          <Choice<number> value={s.weeks} options={[[4, '4'], [8, '8'], [12, '12'], [16, '16']]} onChange={v => up({ weeks: v })} />
        </section>
      )}

      <button className="btn primary wide" disabled={missing.length > 0 || prepNoDate} onClick={create}>
        {missing.length ? 'Введи 1ПМ' : prepNoDate ? 'Укажи дату соревнований' : 'Составить программу'}
      </button>
    </div>
  )
}
