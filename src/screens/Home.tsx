import { Link, useNavigate } from 'react-router-dom'
import { useStore, useExercises, exerciseMap } from '../store'
import { workoutFromDay } from '../lib/startDay'
import { formatDate, weeksUntil } from '../lib/util'
import { groupSets } from '../components/SetLine'
import { Strongman, sloganOfDay } from '../art/Illustrations'
import { doneSets, tonnage, weekStreak, weeklyTonnage } from '../lib/stats'

const greeting = () => {
  const h = new Date().getHours()
  return h < 6 ? 'Ночная смена' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер'
}

export default function Home() {
  const nav = useNavigate()
  const { programs, activeProgramId, cursor, workouts, current, startWorkout, profile } = useStore()
  const exMap = exerciseMap(useExercises())
  const prog = programs.find(p => p.id === activeProgramId)
  const day = prog?.weeks[cursor.week]?.days[cursor.day]
  const comp = prog?.settings.competitionDate
  const week = weeklyTonnage(workouts, 1)[0]
  const progress = prog ? Math.round(((cursor.week * (prog.weeks[0]?.days.length || 1) + cursor.day) / Math.max(1, prog.weeks.reduce((n, w) => n + w.days.length, 0))) * 100) : 0

  return (
    <div className="screen">
      <div className="poster">
        <div>
          <div className="eyebrow">{greeting()}{profile.name ? `, ${profile.name}` : ''}</div>
          <div className="slogan">{sloganOfDay()}</div>
          <div className="who muted small">Клуб «Железо» · {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
        <Strongman className="art" />
      </div>

      <div className="stats">
        <div className="stat"><b>{week.count}</b><span>трен. на неделе</span></div>
        <div className="stat"><b>{(week.v / 1000).toFixed(1)}т</b><span>тоннаж недели</span></div>
        <div className="stat"><b>{weekStreak(workouts)}</b><span>недель подряд</span></div>
      </div>

      {current && (
        <Link to="/workout" className="card accent">
          <div className="eyebrow">Идёт тренировка</div>
          <div className="li-title">{current.title}</div>
          <div className="li-sub">Подходов сделано: {doneSets(current)} — вернуться</div>
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
          <div className="eyebrow">{prog.name}</div>
          <h2>Неделя {cursor.week + 1} из {prog.weeks.length} · {prog.weeks[cursor.week]?.block}</h2>
          <div className="timer" style={{ position: 'static', padding: 0, border: 0, background: 'none' }}><div className="bar"><i style={{ width: `${progress}%` }} /></div></div>
          {prog.phases?.map(ph => cursor.week >= ph.startWeek && cursor.week <= ph.endWeek && (
            <p key={ph.title} className="muted">Фаза: <b>{ph.title}</b> — {ph.program}</p>
          ))}
          {comp && <p className="muted">До соревнований: <b>{Math.max(0, weeksUntil(comp))} нед.</b> ({formatDate(comp)})</p>}
          {day && (
            <>
              <h3>Следующая: {day.title}</h3>
              <ul className="plan">
                {day.exercises.map((e, i) => (
                  <li key={i}><b>{exMap.get(e.exerciseId)?.name ?? e.exerciseId}</b><span>{groupSets(e.sets).join(', ')}</span></li>
                ))}
              </ul>
              {!current && day.exercises.length > 0 && (
                <button className="btn primary wide" onClick={() => { startWorkout(workoutFromDay(prog, cursor.week, cursor.day)); nav('/workout') }}>
                  Начать тренировку
                </button>
              )}
            </>
          )}
          <Link className="btn ghost wide" to={`/programs/${prog.id}`}>Вся программа</Link>
        </div>
      )}

      <h2>Последние тренировки</h2>
      {!workouts.length && <div className="empty">Пока пусто. Первая тренировка — самая важная.</div>}
      <div className="list">
        {workouts.slice(0, 4).map(w => (
          <Link key={w.id} to="/workout" className="list-item">
            <div className="li-title">{w.title}</div>
            <div className="li-sub">{formatDate(w.startedAt)} · {doneSets(w)} подх. · {(tonnage(w) / 1000).toFixed(1)} т</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
