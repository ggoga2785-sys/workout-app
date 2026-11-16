import { useRef, useState } from 'react'
import { useStore } from '../store'
import { LIFT_LABELS } from '../data/labels'
import type { MainLift } from '../types'
import NotifySettings from '../components/NotifySettings'

export default function ProfileScreen() {
  const s = useStore()
  const { profile, setProfile } = s
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const total = (['squat', 'bench', 'deadlift'] as MainLift[]).reduce((n, l) => n + (profile.oneRepMax[l] ?? 0), 0)

  const exportData = () => {
    const { profile, customExercises, programs, activeProgramId, cursor, workouts, bodyweight } = useStore.getState()
    const blob = new Blob([JSON.stringify({ profile, customExercises, programs, activeProgramId, cursor, workouts, bodyweight }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `zhelezo-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
  }
  const importData = async (f: File) => {
    try { s.importData(await f.text()); setMsg('Данные загружены') } catch { setMsg('Не удалось прочитать файл: нужен .json, сохранённый этим приложением') }
  }

  return (
    <div className="screen">
      <h1>Профиль</h1>
      <div className="card">
        <div className="field"><label>Имя</label>
          <input className="input" value={profile.name} onChange={e => setProfile({ name: e.target.value })} /></div>
        <div className="field"><label>Собственный вес, кг</label>
          <input className="input" type="number" inputMode="decimal" value={profile.bodyweight ?? ''} onChange={e => setProfile({ bodyweight: e.target.value ? Number(e.target.value) : undefined })} /></div>
        <div className="field"><label>Округление весов, кг</label>
          <select className="input" value={profile.rounding} onChange={e => setProfile({ rounding: Number(e.target.value) })}>
            {[1, 1.25, 2.5, 5].map(v => <option key={v} value={v}>{v}</option>)}
          </select></div>
      </div>
      <div className="card">
        <h2>Тренировка</h2>
        <label className="toggle"><input id="auto-rest" type="checkbox" checked={profile.autoRest ?? true} onChange={e => setProfile({ autoRest: e.target.checked })} />Запускать таймер отдыха после отмеченного подхода</label>
        <label className="toggle"><input id="timer-sound" type="checkbox" checked={profile.timerSound ?? true} onChange={e => setProfile({ timerSound: e.target.checked })} />Звук и вибрация в конце отдыха</label>
      </div>
      <NotifySettings />
      <div className="card">
        <h2>Разовые максимумы (1ПМ)</h2>
        <div className="row">
          {(Object.keys(LIFT_LABELS) as MainLift[]).map(l => (
            <div key={l} className="mini">
              <span>{LIFT_LABELS[l]}</span>
              <input className="input" type="number" inputMode="decimal" value={profile.oneRepMax[l] ?? ''}
                onChange={e => setProfile({ oneRepMax: { ...profile.oneRepMax, [l]: e.target.value ? Number(e.target.value) : undefined } })} />
            </div>
          ))}
        </div>
        {total > 0 && <p className="muted">Сумма троеборья: <b>{total} кг</b></p>}
      </div>
      <div className="card">
        <h2>Данные</h2>
        <p className="muted small">Всё хранится на этом устройстве. Сделай резервную копию, чтобы перенести на другой телефон.</p>
        <div className="row">
          <button className="btn" onClick={exportData}>Сохранить копию</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>Загрузить копию</button>
          {msg && <p className="muted small">{msg}</p>}
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={e => e.target.files?.[0] && importData(e.target.files[0])} />
        </div>
      </div>
    </div>
  )
}
