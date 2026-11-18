import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmButton from '../components/ConfirmButton'
import { exerciseMap, emptyLogged, useExercises, useStore } from '../store'
import ExercisePicker from '../components/ExercisePicker'
import { shortPlan } from '../components/SetLine'
import RestTimer from '../components/RestTimer'
import { PlateView } from '../components/Plates'
import { estimate1RM, formatDate } from '../lib/util'
import { doneSets, lastPerformance, newRecords, tonnage } from '../lib/stats'
import { unlockAudio, useTimer } from '../lib/timer'
import { Strongman, Crest } from '../art/Illustrations'
import { LegendPoster, legendOfDay } from '../art/Legends'
import { setBadge } from '../lib/notify'
import type { LoggedSet, Workout } from '../types'

const mins = (a: string, b?: string) => Math.max(1, Math.round(((b ? new Date(b).getTime() : Date.now()) - new Date(a).getTime()) / 60000))

function Summary({ w, all, onClose, harsh }: { w: Workout; all: Workout[]; onClose: () => void; harsh: boolean }) {
  const exMap = exerciseMap(useExercises())
  const prs = useMemo(() => newRecords(all, w), [all, w])
  return (
    <div className="card accent">
      <Strongman className="summary-art" label="ГОТОВО" />
      <h2 style={{ textAlign: 'center' }}>Тренировка завершена</h2>
      <div className="stats">
        <div className="stat"><b>{mins(w.startedAt, w.finishedAt)}</b><span>минут</span></div>
        <div className="stat"><b>{doneSets(w)}</b><span>подходов</span></div>
        <div className="stat"><b>{(tonnage(w) / 1000).toFixed(1)}</b><span>тонн</span></div>
      </div>
      {prs.length > 0 && (
        <div>
          <h3>Новые рекорды</h3>
          {prs.map(p => (
            <div key={p.exerciseId} className="pr-row"><span>{exMap.get(p.exerciseId)?.name}</span><b>≈{p.e1rm} кг{p.prev ? ` (+${p.e1rm - p.prev})` : ''}</b></div>
          ))}
        </div>
      )}
      <LegendPoster l={legendOfDay(3)} harsh={harsh} compact />
      <button className="btn primary wide" onClick={onClose}>Отлично</button>
    </div>
  )
}

export default function WorkoutScreen() {
  const { current, startWorkout, updateCurrent, finishWorkout, cancelWorkout, workouts, deleteWorkout, lastSummaryId, clearSummary, profile } = useStore()
  const list = useExercises()
  const exMap = exerciseMap(list)
  const [picking, setPicking] = useState(false)
  const [plates, setPlates] = useState<number>()
  const startTimer = useTimer(s => s.start)
  const [, tick] = useState(0)
  useEffect(() => { const t = setInterval(() => tick(x => x + 1), 30000); return () => clearInterval(t) }, [])
  const doneNow = current ? doneSets(current) : 0
  useEffect(() => setBadge(doneNow), [doneNow])

  const summary = lastSummaryId ? workouts.find(w => w.id === lastSummaryId) : undefined

  if (!current) {
    return (
      <div className="screen">
        <div className="eyebrow">Дневник</div>
        <h1>Тренировка</h1>
        {summary && <Summary w={summary} all={workouts} onClose={clearSummary} harsh={profile.harsh ?? true} />}
        {!summary && (
          <div className="card">
            <p className="muted">Начни тренировку из программы на главной или запиши свободную.</p>
            <div className="row">
              <Link className="btn primary" to="/">К программе</Link>
              <button className="btn" onClick={() => startWorkout({ title: 'Свободная тренировка', exercises: [] })}>Свободная</button>
            </div>
          </div>
        )}
        <h2>История</h2>
        {!workouts.length && <div className="empty">Здесь будут все твои тренировки.</div>}
        <div className="list">
          {workouts.map(w => (
            <details key={w.id} className="card">
              <summary><b>{w.title}</b> <span className="muted small">· {formatDate(w.startedAt)} · {doneSets(w)} подх. · {(tonnage(w) / 1000).toFixed(1)} т</span></summary>
              <ul className="plan">
                {w.exercises.map((e, i) => (
                  <li key={i}><b>{exMap.get(e.exerciseId)?.name}</b>
                    <span>{e.sets.filter(s => s.done).map(s => `${s.weight}×${s.reps}`).join(', ') || '—'}</span></li>
                ))}
              </ul>
              <ConfirmButton className="btn ghost danger small" ask="Удалить запись?" onConfirm={() => deleteWorkout(w.id)}>Удалить</ConfirmButton>
            </details>
          ))}
        </div>
        {!workouts.length && <Crest className="crest" />}
      </div>
    )
  }

  const setField = (ei: number, si: number, patch: Partial<LoggedSet>) =>
    updateCurrent(w => ({
      ...w,
      exercises: w.exercises.map((e, i) => i !== ei ? e : { ...e, sets: e.sets.map((s, j) => j !== si ? s : { ...s, ...patch }) }),
    }))
  const nextLabel = (ei: number, si: number) => {
    const ex = current.exercises
    for (let i = ei; i < ex.length; i++) {
      const k = ex[i].sets.findIndex((s, j) => !s.done && !(i === ei && j === si))
      if (k >= 0) { const s = ex[i].sets[k]; return `${exMap.get(ex[i].exerciseId)?.name ?? ex[i].exerciseId} — подход ${k + 1} из ${ex[i].sets.length}${s.weight ? `, ${s.weight} кг × ${s.reps}` : ''}` }
    }
    return 'последний подход сделан — заканчивай тренировку'
  }
  const toggleDone = (ei: number, si: number, done: boolean) => {
    unlockAudio()
    setField(ei, si, { done })
    if (done && (profile.autoRest ?? true)) startTimer(current.exercises[ei].restSec ?? 120, nextLabel(ei, si))
  }
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
  /** Перенести вес и повторы из прошлого раза */
  const fillFromPrev = (ei: number, prev: LoggedSet[]) => updateCurrent(w => ({
    ...w,
    exercises: w.exercises.map((e, i) => i !== ei ? e : {
      ...e, sets: e.sets.map((s, j) => (s.done || s.weight ? s : { ...s, weight: prev[Math.min(j, prev.length - 1)].weight, reps: s.reps || prev[Math.min(j, prev.length - 1)].reps })),
    }),
  }))

  const total = current.exercises.reduce((n, e) => n + e.sets.length, 0)
  const done = doneSets(current)

  return (
    <div className="screen">
      <div className="eyebrow">Идёт тренировка · {mins(current.startedAt)} мин</div>
      <h1>{current.title}</h1>
      <p className="muted">Подходов: {done} из {total} · тоннаж {Math.round(tonnage(current))} кг</p>
      <RestTimer />
      {current.exercises.map((e, ei) => {
        const ex = exMap.get(e.exerciseId)
        const best = Math.max(0, ...e.sets.filter(s => s.done && s.weight > 0).map(s => estimate1RM(s.weight, s.reps)))
        const prev = lastPerformance(workouts, e.exerciseId, current.id)
        return (
          <div key={ei} className="card">
            <div className="head-row">
              <h3>{ex?.name ?? e.exerciseId}</h3>
              <ConfirmButton className="btn ghost small" ask="Убрать?" onConfirm={() => removeExercise(ei)}>✕</ConfirmButton>
            </div>
            {(e.note || ex) && <p className="muted small">{e.note}{e.note ? ' · ' : ''}<a className="link" href={`https://www.youtube.com/results?search_query=${encodeURIComponent((ex?.name ?? e.exerciseId) + ' техника')}`} target="_blank" rel="noreferrer">▶ видео техники</a></p>}
            {prev && (
              <div className="prev head-row">
                <span>Прошлый раз ({formatDate(prev.date)}): {prev.sets.map(s => `${s.weight}×${s.reps}`).join(', ')}</span>
                {e.sets.some(s => !s.weight && !s.done) && <button className="chip small" onClick={() => fillFromPrev(ei, prev.sets)}>Взять</button>}
              </div>
            )}
            <table className="sets">
              <thead><tr><th>#</th><th>План · блины</th><th>Кг</th><th>{ex?.timed ? 'Время' : 'Повт.'}</th><th>✓</th><th></th></tr></thead>
              <tbody>
                {e.sets.map((s, si) => (
                  <tr key={si} className={s.done ? 'done' : ''}>
                    <td>{si + 1}</td>
                    <td className="muted small plan-cell">
                      {e.planned?.[si] ? shortPlan(e.planned[si]) : ''}
                      {ex?.equipment === 'barbell' && s.weight > 0 && <button className="plate-btn" aria-label="Какие блины вешать" onClick={() => setPlates(s.weight)}>◉</button>}
                    </td>
                    <td><input className="input num" type="number" inputMode="decimal" value={s.weight || ''} onChange={ev => setField(ei, si, { weight: Number(ev.target.value) })} /></td>
                    <td><input className="input num" type="number" inputMode="numeric" value={s.reps || ''} onChange={ev => setField(ei, si, { reps: Number(ev.target.value) })} /></td>
                    <td><input type="checkbox" className="check" checked={s.done} onChange={ev => toggleDone(ei, si, ev.target.checked)} /></td>
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
        <ConfirmButton ask="Не сохранять?" onConfirm={cancelWorkout}>Отменить</ConfirmButton>
        <button className="btn primary" style={{ flex: 1 }} onClick={finishWorkout}>Завершить</button>
      </div>
      {picking && (
        <ExercisePicker list={list} onClose={() => setPicking(false)} onPick={x => {
          updateCurrent(w => ({ ...w, exercises: [...w.exercises, emptyLogged(x.id)] }))
          setPicking(false)
        }} />
      )}
      {plates !== undefined && (
        <div className="sheet-backdrop" onClick={() => setPlates(undefined)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-head"><h2>{plates} кг</h2><button className="btn ghost" onClick={() => setPlates(undefined)}>Закрыть</button></div>
            <PlateView total={plates} bar={profile.barWeight ?? 20} />
          </div>
        </div>
      )}
    </div>
  )
}
