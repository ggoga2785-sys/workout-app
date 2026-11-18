import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { workoutFromDay } from '../lib/startDay'
import type { Program } from '../types'

/** Следующий по плану день: от курсора, пропуская пустые дни (например, день соревнований) */
export function nextPlanDay(p: Program, cursor: { week: number; day: number }) {
  for (let w = cursor.week; w < p.weeks.length; w++) {
    const days = p.weeks[w].days
    for (let d = w === cursor.week ? cursor.day : 0; d < days.length; d++) {
      if (days[d].exercises.length) return { week: w, day: d }
    }
  }
  return undefined
}

/** Большая кнопка «Продолжить свой план» — сразу начинает следующую тренировку программы */
export default function ContinuePlan() {
  const { programs, activeProgramId, cursor, workouts, startWorkout, setCursor } = useStore()
  const p = programs.find(x => x.id === activeProgramId)
  if (!p) return (
    <div className="card">
      <p className="muted">Нет активной программы.</p>
      <Link className="btn primary wide" to="/programs">Выбрать программу</Link>
    </div>
  )
  const next = nextPlanDay(p, cursor)
  const lastW = p.weeks.length - 1
  const finished = !next || workouts.some(w => w.programId === p.id && w.week === lastW && w.day === p.weeks[lastW].days.length - 1 && cursor.week === lastW && cursor.day === 0 && lastW > 0)
  if (finished || !next) return (
    <div className="card accent">
      <div className="eyebrow">{p.name}</div>
      <h2>План пройден до конца 💪</h2>
      <p className="muted">Выбери новую программу или начни эту заново.</p>
      <div className="row">
        <Link className="btn primary" to="/programs">Программы</Link>
        <button className="btn" onClick={() => setCursor(0, 0)}>Начать заново</button>
      </div>
    </div>
  )
  const day = p.weeks[next.week].days[next.day]
  const n = p.weeks[next.week].days.length
  const skip = () => {
    const after = next.day + 1 < n ? { week: next.week, day: next.day + 1 } : { week: Math.min(next.week + 1, lastW), day: 0 }
    setCursor(after.week, after.day)
  }
  return (
    <div className="continue">
      <button className="continue-btn" onClick={() => startWorkout(workoutFromDay(p, next.week, next.day))}>
        <span className="continue-eyebrow">Продолжить свой план</span>
        <b>{day.title}</b>
        <span className="continue-sub">Неделя {next.week + 1} из {p.weeks.length} · тренировка {next.day + 1} из {n} · {day.exercises.length} упр.</span>
        <span className="continue-go">Начать ▶</span>
      </button>
      <button className="chip" onClick={skip}>Пропустить эту тренировку</button>
    </div>
  )
}
