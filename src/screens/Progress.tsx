import { useMemo, useState } from 'react'
import { exerciseMap, useExercises, useStore } from '../store'
import { LineChart, BarChart } from '../components/Charts'
import { e1rmHistory, records, weekStreak, weeklyTonnage, exName } from '../lib/stats'
import { formatDate, todayISO } from '../lib/util'
import ConfirmButton from '../components/ConfirmButton'

const short = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' })
const MAIN = [['squat', 'Присед'], ['bench', 'Жим'], ['deadlift', 'Тяга']] as const

export default function Progress() {
  const { workouts, bodyweight, addBodyweight, removeBodyweight, profile } = useStore()
  const exMap = exerciseMap(useExercises())
  const [ex, setEx] = useState<string>('bench')
  const [bw, setBw] = useState('')

  const finished = workouts.filter(w => w.finishedAt)
  const month = finished.filter(w => Date.now() - new Date(w.startedAt).getTime() < 30 * 864e5).length
  const recs = useMemo(() => records(workouts), [workouts])
  const hist = useMemo(() => e1rmHistory(workouts, ex), [workouts, ex])
  const tonn = useMemo(() => weeklyTonnage(workouts, 12), [workouts])
  const others = [...recs.keys()].filter(id => !MAIN.some(([m]) => m === id))
  const best = recs.get(ex)
  const first = hist[0]?.v
  const orm = profile.oneRepMax[ex as 'squat' | 'bench' | 'deadlift']

  const sortedRecs = [...recs.values()].sort((a, b) => {
    const ra = MAIN.findIndex(([m]) => m === a.exerciseId), rb = MAIN.findIndex(([m]) => m === b.exerciseId)
    return (ra < 0 ? 9 : ra) - (rb < 0 ? 9 : rb) || b.e1rm - a.e1rm
  })

  return (
    <div className="screen">
      <div className="eyebrow">Журнал атлета</div>
      <h1>Прогресс</h1>
      <div className="stats">
        <div className="stat"><b>{finished.length}</b><span>тренировок</span></div>
        <div className="stat"><b>{month}</b><span>за 30 дней</span></div>
        <div className="stat"><b>{weekStreak(workouts)}</b><span>недель подряд</span></div>
      </div>

      <h2>Сила: оценка 1ПМ</h2>
      <div className="chips">
        {MAIN.map(([id, l]) => <button key={id} className={'chip' + (ex === id ? ' on' : '')} onClick={() => setEx(id)}>{l}</button>)}
        {others.length > 0 && (
          <select className="input" style={{ width: 'auto', minHeight: 36 }} value={MAIN.some(([m]) => m === ex) ? '' : ex} onChange={e => e.target.value && setEx(e.target.value)}>
            <option value="">Другое…</option>
            {others.map(id => <option key={id} value={id}>{exName(exMap, id)}</option>)}
          </select>
        )}
      </div>
      <div className="card">
        <div className="head-row">
          <h3>{exName(exMap, ex)}</h3>
          {best && <span className="badge brass">рекорд ≈{best.e1rm} кг</span>}
        </div>
        <LineChart points={hist.map(p => ({ label: short(p.date), v: p.v }))} />
        {best && <p className="muted small">Лучший подход: {best.weight} кг × {best.reps} ({formatDate(best.date)}){first && hist.length > 1 ? ` · с начала ${best.e1rm - first >= 0 ? '+' : ''}${best.e1rm - first} кг` : ''}{orm ? ` · 1ПМ в профиле: ${orm} кг` : ''}</p>}
      </div>

      <h2>Тоннаж по неделям</h2>
      <div className="card">
        <BarChart points={tonn.map(t => ({ label: short(t.key), v: t.v / 1000 }))} format={v => (v ? v.toFixed(v < 10 ? 1 : 0) + 'т' : '0')} />
        <p className="muted small">Эта неделя: {(tonn[tonn.length - 1].v / 1000).toFixed(1)} т за {tonn[tonn.length - 1].count} трен.</p>
      </div>

      <h2>Рекорды</h2>
      {sortedRecs.length === 0 && <div className="empty">Рекорды появятся после первых тренировок.</div>}
      <div className="list">
        {sortedRecs.slice(0, 12).map(r => (
          <div key={r.exerciseId} className="list-item">
            <div className="head-row"><span className="li-title">{exName(exMap, r.exerciseId)}</span><b className="num-font" style={{ whiteSpace: 'nowrap' }}>≈{r.e1rm} кг</b></div>
            <div className="li-sub">{r.weight} кг × {r.reps} · {formatDate(r.date)}</div>
          </div>
        ))}
      </div>

      <h2>Вес тела</h2>
      <div className="card">
        <div className="row">
          <input id="bw-input" className="input" type="number" inputMode="decimal" placeholder="Вес сегодня, кг" value={bw} onChange={e => setBw(e.target.value)} />
          <button className="btn primary" disabled={!Number(bw)} onClick={() => { addBodyweight(Number(bw), todayISO()); setBw('') }}>Записать</button>
        </div>
        <LineChart points={bodyweight.map(b => ({ label: short(b.date), v: b.kg }))} />
        {bodyweight.slice(-5).reverse().map(b => (
          <div key={b.date} className="head-row small"><span>{formatDate(b.date)}</span><span className="row"><b>{b.kg} кг</b><ConfirmButton className="btn ghost small" ask="Удалить?" onConfirm={() => removeBodyweight(b.date)}>✕</ConfirmButton></span></div>
        ))}
      </div>
    </div>
  )
}
