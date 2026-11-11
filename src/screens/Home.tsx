import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { workoutFromDay } from '../lib/startDay'
import { formatDate, weeksUntil } from '../lib/util'
import { groupSets } from '../components/SetLine'
import { useExercises, exerciseMap } from '../store'

export default function Home() {
  const nav = useNavigate()
  const { programs, activeProgramId, cursor, workouts, current, startWorkout } = useStore()
  const exMap = exerciseMap(useExercises())
  const prog = programs.find(p => p.id === activeProgramId)
  const day = prog?.weeks[cursor.week]?.days[cursor.day]
  const comp = prog?.settings.competitionDate

  return (
    <div className="screen">
      <h1>Железо</h1>
      {current && (
        <Link to="/workout" className="card accent">
          <div className="li-title">Идёт тренировка</div>
          <div className="li-sub">{current.title} — вернуться</div>
        </Link>
      )}

      {!prog ? (
        <div className="card">
          <h2>Нет активной программы</h2>
          <p className="muted">Выбери готовую программу (Шейко, Верхошанский, Смолов, 5/3/1, сплит Арнольда и другие) или собери свою в конструкторе.</p>
          <div className="row"><Link className="btn primary" to="/catalog">Готовые программы</Link><Link className="btn" to="/programs/new">Конструктор</Link></div>
        </div>
      ) : (
        <div className="card">
          <div className="li-sub">{prog.name}</div>
          <h2>Неделя {cursor.week + 1} из {prog.weeks.length} · {prog.weeks[cursor.week]?.block}</h2>
          {comp && <p className="muted">До соревнований: {Math.max(0, weeksUntil(comp))} нед. ({formatDate(comp)})</p>}
          {day && (
            <>
              <h3>Следующая: {day.title}</h3>
              <ul className="plan">
                {day.exercises.map((e, i) => (
                  <li key={i}><b>{exMap.get(e.exerciseId)?.name ?? e.exerciseId}</b><span>{groupSets(e.sets).join(', ')}</span></li>
                ))}
              </ul>
              {!current && day.exercises.length > 0 && (
                <button className="btn primary" onClick={() => { startWorkout(workoutFromDay(prog, cursor.week, cursor.day)); nav('/workout') }}>
                  Начать тренировку
                </button>
              )}
            </>
          )}
          <Link className="btn ghost" to={`/programs/${prog.id}`}>Вся программа</Link>
        </div>
      )}

      <h2>Последние тренировки</h2>
      {!workouts.length && <p className="muted">Пока пусто.</p>}
      <div className="list">
        {workouts.slice(0, 5).map(w => (
          <div key={w.id} className="list-item static">
            <div className="li-title">{w.title}</div>
            <div className="li-sub">{formatDate(w.startedAt)} · {w.exercises.length} упр. · {w.exercises.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0)} подх.</div>
          </div>
        ))}
      </div>
    </div>
  )
}
