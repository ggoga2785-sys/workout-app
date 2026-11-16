import ConfirmButton from '../components/ConfirmButton'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { formatDate } from '../lib/util'

export default function Programs() {
  const { programs, activeProgramId, setActiveProgram, removeProgram } = useStore()
  return (
    <div className="screen">
      <div className="head-row">
        <h1>Программы</h1>
        <div className="row"><Link className="btn primary" to="/catalog">Готовые</Link><Link className="btn" to="/programs/new">Конструктор</Link></div>
      </div>
      {!programs.length && <p className="muted">Программ ещё нет.</p>}
      <div className="list">
        {programs.map(p => (
          <div key={p.id} className={'card' + (p.id === activeProgramId ? ' accent' : '')}>
            <Link to={`/programs/${p.id}`}>
              <div className="li-title">{p.name}{p.draft && <span className="badge muted">черновой шаблон</span>}</div>
              <div className="li-sub">{p.weeks.length} нед. · {p.settings.daysPerWeek} трен./нед. · создана {formatDate(p.createdAt)}</div>
            </Link>
            <div className="row">
              {p.id !== activeProgramId && <button className="btn" onClick={() => setActiveProgram(p.id)}>Сделать активной</button>}
              <ConfirmButton ask="Удалить программу?" onConfirm={() => removeProgram(p.id)}>Удалить</ConfirmButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
