import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { MainLift } from '../types'
import { instantiate, requiredLifts, useCatalog } from '../lib/catalog'
import { exerciseMap, useExercises, useStore } from '../store'
import { FIDELITY_LABELS, LEVEL_LABELS, LIFT_LABELS } from '../data/labels'
import { groupSets } from '../components/SetLine'

export default function CatalogDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const cat = useCatalog()
  const exMap = exerciseMap(useExercises())
  const { profile, setProfile, addProgram } = useStore()
  const [orm, setOrm] = useState<Partial<Record<MainLift, number>>>(profile.oneRepMax)
  const [showWeek, setShowWeek] = useState(false)
  if (!cat) return <div className="screen"><p className="muted">Загружаю…</p></div>
  const cp = cat.programs.find(p => p.id === id)
  if (!cp) return <div className="screen"><p>Программа не найдена.</p></div>

  const lifts = requiredLifts(cp, exMap)
  const missing = lifts.filter(l => !orm[l])
  const start = () => {
    setProfile({ oneRepMax: { ...profile.oneRepMax, ...orm } })
    const p = instantiate(cp, orm, profile.rounding, exMap)
    addProgram(p)
    nav(`/programs/${p.id}`)
  }
  const w0 = cp.weeks[0]

  return (
    <div className="screen">
      <h1>{cp.name}</h1>
      <p className="muted">{cp.author} · {cp.durationWeeks} нед. · {cp.daysPerWeek} трен./нед. · {cp.levelNote ?? LEVEL_LABELS[cp.level]}</p>
      <p>{cp.description}</p>
      <span className="badge muted">{FIDELITY_LABELS[cp.fidelity]}</span>
      {cp.fidelityNote && <p className="muted small">{cp.fidelityNote}</p>}
      {cp.howToUse && <div className="card"><h3>Как выполнять</h3><p>{cp.howToUse}</p></div>}
      {cp.progression && <div className="card"><h3>Прогрессия</h3><p>{cp.progression}</p></div>}
      {cp.peaking && <div className="card"><h3>Подводка</h3><p>{cp.peaking}</p></div>}

      <div className="card">
        <button className="week-head" onClick={() => setShowWeek(!showWeek)}>
          <b>Неделя 1 · {w0.block}</b><span className="muted">{showWeek ? 'скрыть' : 'показать'}</span>
        </button>
        {showWeek && w0.days.map((d, i) => (
          <div key={i} className="day">
            <h3>{d.title}</h3>
            <ul className="plan">
              {d.exercises.map((e, j) => (
                <li key={j}><b>{exMap.get(e.exerciseId)?.name ?? e.exerciseId}</b><span>{groupSets(e.sets).join(', ')}</span></li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {lifts.length > 0 && (
        <div className="card">
          <h3>Твой 1ПМ, кг{cp.trainingMaxFactor ? ` (проценты берутся от ${Math.round(cp.trainingMaxFactor * 100)}% — тренировочный максимум)` : ''}</h3>
          <div className="row">
            {lifts.map(l => (
              <div key={l} className="mini">
                <span>{LIFT_LABELS[l]}</span>
                <input className="input" type="number" inputMode="decimal" value={orm[l] ?? ''}
                  onChange={e => setOrm(o => ({ ...o, [l]: e.target.value ? Number(e.target.value) : undefined }))} />
              </div>
            ))}
          </div>
          <p className="muted small">Не знаешь 1ПМ? Возьми рабочий вес 5×5 и умножь на 1,2.</p>
        </div>
      )}

      {cp.sources?.length > 0 && (
        <div className="card">
          <h3>Источники</h3>
          <ul className="plan">{cp.sources.map((s, i) => <li key={i}><a href={s.url} target="_blank" rel="noreferrer" className="link">{s.title}</a></li>)}</ul>
        </div>
      )}

      <button className="btn primary wide" disabled={missing.length > 0} onClick={start}>
        {missing.length ? 'Введи 1ПМ' : 'Начать эту программу'}
      </button>
    </div>
  )
}
