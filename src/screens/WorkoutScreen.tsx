import { useEffect, useState } from 'react'
import { exerciseMap, emptyLogged, useExercises, useStore } from '../store'
import ExercisePicker from '../components/ExercisePicker'
import { plannedLabel } from '../components/SetLine'
import { estimate1RM, formatDate } from '../lib/util'
import type { LoggedSet } from '../types'

function RestTimer() {
  const [left, setLeft] = useState(0)
  useEffect(() => {
    if (left <= 0) return
    const t = setTimeout(() => setLeft(l => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left])
  return (
    <div className="timer">
      <span>Отдых: <b>{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</b></span>
      {[60, 120, 180, 300].map(s => <button key={s} className="chip" onClick={() => setLeft(s)}>{s / 60} мин</button>)}
      {left > 0 && <button className="chip" onClick={() => setLeft(0)}>×</button>}
    </div>
  )
}

export default function WorkoutScreen() {
  const { current, startWorkout, updateCurrent, finishWorkout, cancelWorkout, workouts, deleteWorkout } = useStore()
  const list = useExercises()
  const exMap = exerciseMap(list)
  const [picking, setPicking] = useState(false)

  if (!current) {
    return (
      <div className="screen">
        <h1>Тренировка</h1>
        <div className="card">
          <p className="muted">Начни тренировку из программы на главной или запиши свободную.</p>
          <button className="btn primary" onClick={() => startWorkout({ title: 'Свободная тренировка', exercises: [] })}>Свободная тренировка</button>
        </div>
        <h2>История</h2>
        {!workouts.length && <p className="muted">Пока пусто.</p>}
        <div className="list">
          {workouts.map(w => (
            <details key={w.id} className="card">
              <summary><b>{w.title}</b> <span className="muted">· {formatDate(w.startedAt)}</span></summary>
              <ul className="plan">
                {w.exercises.map((e, i) => (
                  <li key={i}><b>{exMap.get(e.exerciseId)?.name}</b>
                    <span>{e.sets.filter(s => s.done).map(s => `${s.weight}×${s.reps}`).join(', ') || '—'}</span></li>
                ))}
              </ul>
              <button className="btn ghost danger small" onClick={() => confirm('Удалить запись?') && deleteWorkout(w.id)}>Удалить</button>
            </details>
          ))}
        </div>
      </div>
    )
  }

  const setField = (ei: number, si: number, patch: Partial<LoggedSet>) =>
    updateCurrent(w => ({
      ...w,
      exercises: w.exercises.map((e, i) => i !== ei ? e : { ...e, sets: e.sets.map((s, j) => j !== si ? s : { ...s, ...patch }) }),
    }))
  const addSet = (ei: number) => updateCurrent(w => ({
    ...w,
    exercises: w.exercises.map((e, i) => {
      if (i !== ei) return e
      const last = e.sets[e.sets.length - 1]
      return { ...e, sets: [...e.sets, { weight: last?.weight ?? 0, reps: last?.reps ?? 0, done: false }] }
    }),
  }))
  const removeSet = (ei: number, si: number) => updateCurrent(w => ({
    ...w, exercises: w.exercises.map((e, i) => i !== ei ? e : { ...e, sets: e.sets.filter((_, j) => j !== si) }),
  }))
  const removeExercise = (ei: number) => updateCurrent(w => ({ ...w, exercises: w.exercises.filter((_, i) => i !== ei) }))

  const doneSets = current.exercises.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0)
  const tonnage = current.exercises.reduce((n, e) => n + e.sets.filter(s => s.done).reduce((m, s) => m + s.weight * s.reps, 0), 0)

  return (
    <div className="screen">
      <h1>{current.title}</h1>
      <p className="muted">Выполнено подходов: {doneSets} · тоннаж {Math.round(tonnage)} кг</p>
      <RestTimer />
      {current.exercises.map((e, ei) => {
        const ex = exMap.get(e.exerciseId)
        const best = Math.max(0, ...e.sets.filter(s => s.done && s.weight > 0).map(s => estimate1RM(s.weight, s.reps)))
        return (
          <div key={ei} className="card">
            <div className="head-row">
              <h3>{ex?.name ?? e.exerciseId}</h3>
              <button className="btn ghost small" onClick={() => removeExercise(ei)}>✕</button>
            </div>
            <table className="sets">
              <thead><tr><th>#</th><th>План</th><th>{ex?.timed ? 'Вес' : 'Кг'}</th><th>{ex?.timed ? 'Время' : 'Повт.'}</th><th>✓</th><th></th></tr></thead>
              <tbody>
                {e.sets.map((s, si) => (
                  <tr key={si} className={s.done ? 'done' : ''}>
                    <td>{si + 1}</td>
                    <td className="muted small">{e.planned?.[si] ? plannedLabel(e.planned[si]) : ''}</td>
                    <td><input className="input num" type="number" inputMode="decimal" value={s.weight || ''} onChange={ev => setField(ei, si, { weight: Number(ev.target.value) })} /></td>
                    <td><input className="input num" type="number" inputMode="numeric" value={s.reps || ''} onChange={ev => setField(ei, si, { reps: Number(ev.target.value) })} /></td>
                    <td><input type="checkbox" className="check" checked={s.done} onChange={ev => setField(ei, si, { done: ev.target.checked })} /></td>
                    <td><button className="btn ghost small" onClick={() => removeSet(ei, si)}>−</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="head-row">
              <button className="btn small" onClick={() => addSet(ei)}>+ подход</button>
              {best > 0 && !ex?.timed && <span className="muted small">≈1ПМ {best} кг</span>}
            </div>
          </div>
        )
      })}
      <button className="btn wide" onClick={() => setPicking(true)}>+ Добавить упражнение</button>
      <div className="row">
        <button className="btn ghost danger" onClick={() => confirm('Отменить тренировку без сохранения?') && cancelWorkout()}>Отменить</button>
        <button className="btn primary" onClick={finishWorkout}>Завершить и сохранить</button>
      </div>
      {picking && (
        <ExercisePicker list={list} onClose={() => setPicking(false)} onPick={x => {
          updateCurrent(w => ({ ...w, exercises: [...w.exercises, emptyLogged(x.id)] }))
          setPicking(false)
        }} />
      )}
    </div>
  )
}
