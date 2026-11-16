import { useState } from 'react'
import { useStore } from '../store'
import { LEGENDS, LegendPoster, phrase } from '../art/Legends'

export default function Legends() {
  const harsh = useStore(s => s.profile.harsh ?? true)
  const [line, setLine] = useState(() => phrase(harsh))
  return (
    <div className="screen">
      <div className="eyebrow">Клуб «Железо»</div>
      <h1>Зал славы</h1>
      <button className="shout" onClick={() => setLine(phrase(harsh))}>{line}<span>нажми — ещё</span></button>
      <div className="legend-list">
        {LEGENDS.map((l, i) => <LegendPoster key={i} l={l} harsh={harsh} />)}
      </div>
      <p className="muted small" style={{ textAlign: 'center' }}>Силуэты условные, нарисованы для приложения. Цитаты — только известные высказывания самих спортсменов, остальные фразы — лозунги клуба.</p>
    </div>
  )
}
