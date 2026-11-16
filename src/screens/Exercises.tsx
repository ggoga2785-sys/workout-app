import { useState } from 'react'
import { useExercises, useStore } from '../store'
import { ExerciseRow, useExerciseFilter } from '../components/ExercisePicker'
import type { Equipment, Mechanics, MuscleGroup } from '../types'
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '../data/labels'

export default function Exercises() {
  const list = useExercises()
  const add = useStore(s => s.addCustomExercise)
  const { filtered, controls } = useExerciseFilter(list)
  const [form, setForm] = useState<{ name: string; primary: MuscleGroup; equipment: Equipment; mechanics: Mechanics } | null>(null)

  return (
    <div className="screen">
      <div className="head-row">
        <h1>Упражнения</h1>
        <button className="btn" onClick={() => setForm({ name: '', primary: 'chest', equipment: 'machine', mechanics: 'compound' })}>+ Своё</button>
      </div>
      {form && (
        <div className="card">
          <input className="input" placeholder="Название" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <div className="row">
            <select className="input" value={form.primary} onChange={e => setForm({ ...form, primary: e.target.value as MuscleGroup })}>
              {Object.entries(MUSCLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="input" value={form.equipment} onChange={e => setForm({ ...form, equipment: e.target.value as Equipment })}>
              {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select className="input" value={form.mechanics} onChange={e => setForm({ ...form, mechanics: e.target.value as Mechanics })}>
              <option value="compound">Базовое</option><option value="isolation">Изолирующее</option>
            </select>
          </div>
          <div className="row">
            <button className="btn ghost" onClick={() => setForm(null)}>Отмена</button>
            <button className="btn primary" disabled={!form.name.trim()} onClick={() => { add({ ...form, name: form.name.trim() }); setForm(null) }}>Сохранить</button>
          </div>
        </div>
      )}
      {controls}
      <p className="muted small">Найдено: {filtered.length}</p>
      <div className="list">{filtered.map(e => <ExerciseRow key={e.id} e={e} />)}</div>
    </div>
  )
}
