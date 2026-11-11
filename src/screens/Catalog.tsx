import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Discipline } from '../types'
import { useCatalog } from '../lib/catalog'
import { DISCIPLINE_LABELS, LEVEL_LABELS, PL_FOCUS_LABELS, BB_GOAL_LABELS } from '../data/labels'

export default function Catalog() {
  const cat = useCatalog()
  const [disc, setDisc] = useState<Discipline>('powerlifting')
  const list = cat?.programs.filter(p => p.discipline === disc) ?? []
  return (
    <div className="screen">
      <div className="head-row">
        <h1>Готовые программы</h1>
        <Link className="btn ghost small" to="/programs/new">Конструктор</Link>
      </div>
      <div className="chips">
        {(Object.keys(DISCIPLINE_LABELS) as Discipline[]).map(d => (
          <button key={d} className={'chip' + (d === disc ? ' on' : '')} onClick={() => setDisc(d)}>{DISCIPLINE_LABELS[d]}</button>
        ))}
      </div>
      {!cat && <p className="muted">Загружаю…</p>}
      <div className="list">
        {list.map(p => (
          <Link key={p.id} to={`/catalog/${p.id}`} className="list-item">
            <div className="li-title">{p.name}</div>
            <div className="li-sub">
              {p.author} · {p.durationWeeks} нед. · {p.daysPerWeek} трен./нед. · {p.levelNote ?? LEVEL_LABELS[p.level]}
              {p.plFocus && ` · ${PL_FOCUS_LABELS[p.plFocus]}`}
              {p.bodybuildingGoal && ` · ${BB_GOAL_LABELS[p.bodybuildingGoal]}`}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
