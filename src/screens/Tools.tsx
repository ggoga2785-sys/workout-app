import { useState } from 'react'
import { useStore } from '../store'
import { PlateView } from '../components/Plates'
import { RPE_TABLE } from '../lib/plates'
import { roundTo } from '../lib/util'
import { LIFT_LABELS } from '../data/labels'
import type { MainLift } from '../types'
import { Kettlebell } from '../art/Illustrations'

const RPES = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6]

export default function Tools() {
  const { profile, setProfile } = useStore()
  const bar = profile.barWeight ?? 20
  const step = profile.rounding || 2.5
  const [plateW, setPlateW] = useState('100')
  const [w, setW] = useState('100')
  const [r, setR] = useState('5')
  const [lift, setLift] = useState<MainLift | ''>('bench')
  const [manual, setManual] = useState('')

  const e1 = (() => {
    const W = Number(w), R = Number(r)
    if (!W || !R) return 0
    if (R === 1) return W
    return Math.round((W * (1 + R / 30) + W * (36 / (37 - Math.min(R, 36)))) / 2) // среднее Эпли и Бжицки
  })()
  const base = lift ? profile.oneRepMax[lift] : Number(manual)

  return (
    <div className="screen">
      <div className="head-row">
        <div><div className="eyebrow">Под рукой в зале</div><h1>Инструменты</h1></div>
        <Kettlebell className="tools-kb" mark="2 ПУДА" />
      </div>

      <div className="card">
        <h2>Сколько вешать</h2>
        <div className="row">
          <div className="mini"><span>Вес на штанге, кг</span><input id="plate-w" className="input" type="number" inputMode="decimal" value={plateW} onChange={e => setPlateW(e.target.value)} /></div>
          <div className="mini"><span>Гриф</span>
            <select id="bar-w" className="input" value={bar} onChange={e => setProfile({ barWeight: Number(e.target.value) })}>
              {[20, 15, 10, 7].map(b => <option key={b} value={b}>{b} кг</option>)}
            </select>
          </div>
        </div>
        <PlateView total={Number(plateW) || 0} bar={bar} />
      </div>

      <div className="card">
        <h2>Калькулятор 1ПМ</h2>
        <div className="row">
          <div className="mini"><span>Вес, кг</span><input id="rm-w" className="input" type="number" inputMode="decimal" value={w} onChange={e => setW(e.target.value)} /></div>
          <div className="mini"><span>Повторов</span><input id="rm-r" className="input" type="number" inputMode="numeric" value={r} onChange={e => setR(e.target.value)} /></div>
        </div>
        {e1 > 0 && (
          <>
            <p>Оценка 1ПМ: <b style={{ fontFamily: 'var(--display)', fontSize: 22 }}>{e1} кг</b> <span className="muted small">(среднее формул Эпли и Бжицки; точнее всего до 10 повторов)</span></p>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>%</th>{[100, 95, 90, 85, 80, 75, 70, 65, 60].map(p => <th key={p}>{p}</th>)}</tr></thead>
                <tbody><tr><td>кг</td>{[100, 95, 90, 85, 80, 75, 70, 65, 60].map(p => <td key={p}>{roundTo(e1 * p / 100, step)}</td>)}</tr></tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h2>Таблица RPE</h2>
        <p className="muted small">RPE 10 — отказ, 9 — остался 1 повтор в запасе, 8 — 2 повтора, 7 — 3. В клетке вес от 1ПМ.</p>
        <div className="chips">
          {(['squat', 'bench', 'deadlift'] as MainLift[]).map(l => <button key={l} className={'chip' + (lift === l ? ' on' : '')} onClick={() => setLift(l)}>{LIFT_LABELS[l]}{profile.oneRepMax[l] ? ` · ${profile.oneRepMax[l]}` : ''}</button>)}
          <button className={'chip' + (lift === '' ? ' on' : '')} onClick={() => setLift('')}>Свой 1ПМ</button>
        </div>
        {lift === '' && <input id="rpe-manual" className="input" type="number" inputMode="decimal" placeholder="1ПМ, кг" value={manual} onChange={e => setManual(e.target.value)} />}
        {lift && !base && <p className="muted small">1ПМ для этого движения не задан в профиле — показываю проценты.</p>}
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>RPE \ повт.</th>{Array.from({ length: 10 }, (_, i) => <th key={i}>{i + 1}</th>)}</tr></thead>
            <tbody>
              {RPES.map(rpe => (
                <tr key={rpe}><td><b>{rpe}</b></td>{RPE_TABLE[rpe].map((p, i) => <td key={i}>{base ? roundTo(base * p, step) : Math.round(p * 100) + '%'}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
