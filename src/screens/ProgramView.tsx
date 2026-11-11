import ConfirmButton from '../components/ConfirmButton'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { exerciseMap, useExercises, useStore } from '../store'
import { groupSets } from '../components/SetLine'
import { workoutFromDay } from '../lib/startDay'

export default function ProgramView() {
  const { id } = useParams()
  const nav = useNavigate()
  const { programs, activeProgramId, cursor, setActiveProgram, setCursor, startWorkout, current } = useStore()
  const exMap = exerciseMap(useExercises())
  const p = programs.find(x => x.id === id)
  const [open, setOpen] = useState(p && p.id === activeProgramId ? cursor.week : 0)
  if (!p) return <div className="screen"><p>Программа не найдена.</p></div>

  const start = (w: number, d: number) => {
    if (p.id !== activeProgramId) setActiveProgram(p.id)
    setCursor(w, d)
    startWorkout(workoutFromDay(p, w, d))
    nav('/workout')
  }

  return (
    <div className="screen">
      <h1>{p.name}</h1>
      <p className="muted">{p.description}</p>
      {p.meta && <p className="muted small">{p.meta.author}{p.meta.howToUse ? ` · ${p.meta.howToUse}` : ''}</p>}
      {p.meta?.progression && <p className="muted small">Прогрессия: {p.meta.progression}</p>}
      {p.draft && <p className="note">Черновой шаблон: структура и проценты временные, методики будут добавлены позже.</p>}
      {p.id !== activeProgramId && <button className="btn" onClick={() => setActiveProgram(p.id)}>Сделать активной</button>}
      <div className="list">
        {p.weeks.map(w => (
          <div key={w.index} className="card">
            <button className="week-head" onClick={() => setOpen(open === w.index ? -1 : w.index)}>
              <b>Неделя {w.index + 1}</b><span className="muted">{w.block}</span>
            </button>
            {open === w.index && w.days.map((d, di) => (
              <div key={di} className="day">
                <div className="head-row">
                  <h3>{d.title}</h3>
                  {d.exercises.length > 0 && (current
                    ? <ConfirmButton className="btn small" ask="Заменить текущую?" onConfirm={() => start(w.index, di)}>Начать</ConfirmButton>
                    : <button className="btn small" onClick={() => start(w.index, di)}>Начать</button>)}
                </div>
                {!d.exercises.length && <p className="muted">День выступления. Удачи на помосте!</p>}
                <ul className="plan">
                  {d.exercises.map((e, i) => (
                    <li key={i}>
                      <b>{exMap.get(e.exerciseId)?.name ?? e.exerciseId}</b>
                      <span>{groupSets(e.sets).join(', ')}{e.note ? ` (${e.note})` : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
