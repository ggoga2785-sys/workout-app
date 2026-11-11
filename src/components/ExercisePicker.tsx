import { useMemo, useState } from 'react'
import type { Equipment, Exercise, MuscleGroup } from '../types'
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '../data/labels'

interface Props {
  list: Exercise[]
  onPick?: (e: Exercise) => void
  onClose?: () => void
}

export function useExerciseFilter(list: Exercise[]) {
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState<MuscleGroup | ''>('')
  const [equip, setEquip] = useState<Equipment | ''>('')
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return list.filter(e =>
      (!needle || e.name.toLowerCase().includes(needle)) &&
      (!muscle || e.primary === muscle || e.secondary?.includes(muscle)) &&
      (!equip || e.equipment === equip))
  }, [list, q, muscle, equip])
  const controls = (
    <div className="filters">
      <input className="input" placeholder="Поиск упражнения…" value={q} onChange={e => setQ(e.target.value)} />
      <div className="row">
        <select className="input" value={muscle} onChange={e => setMuscle(e.target.value as MuscleGroup | '')}>
          <option value="">Все мышцы</option>
          {Object.entries(MUSCLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="input" value={equip} onChange={e => setEquip(e.target.value as Equipment | '')}>
          <option value="">Всё оборудование</option>
          {Object.entries(EQUIPMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
    </div>
  )
  return { filtered, controls }
}

export function ExerciseRow({ e, onClick }: { e: Exercise; onClick?: () => void }) {
  return (
    <button className="list-item" onClick={onClick} disabled={!onClick}>
      <div className="li-title">{e.name}{e.competition && <span className="badge">соревн.</span>}{e.custom && <span className="badge muted">своё</span>}</div>
      <div className="li-sub">{MUSCLE_LABELS[e.primary]} · {EQUIPMENT_LABELS[e.equipment]}{e.mechanics === 'compound' ? ' · базовое' : ''}</div>
    </button>
  )
}

export default function ExercisePicker({ list, onPick, onClose }: Props) {
  const { filtered, controls } = useExerciseFilter(list)
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Добавить упражнение</h2>
          <button className="btn ghost" onClick={onClose}>Закрыть</button>
        </div>
        {controls}
        <div className="list scroll">
          {filtered.map(e => <ExerciseRow key={e.id} e={e} onClick={() => onPick?.(e)} />)}
          {!filtered.length && <p className="muted">Ничего не найдено</p>}
        </div>
      </div>
    </div>
  )
}
