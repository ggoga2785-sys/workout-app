import { PLATE_COLOR, platesPerSide } from '../lib/plates'

const H: Record<number, number> = { 25: 80, 20: 80, 15: 72, 10: 62, 5: 48, 2.5: 40, 1.25: 34 }

/** Рисунок одной стороны грифа с блинами по стандарту IPF */
export function PlateView({ total, bar = 20 }: { total: number; bar?: number }) {
  const { plates, rest } = platesPerSide(total, bar)
  return (
    <div>
      <div className="plates" aria-label="Раскладка блинов">
        <div className="bar-end" />
        <div className="collar" />
        {plates.map((p, i) => (
          <div key={i} className={'plate' + (p === 5 || p === 15 ? ' light' : '')} style={{ height: H[p], background: PLATE_COLOR[p], width: p >= 10 ? 17 : 12 }}>{p}</div>
        ))}
        <div className="collar" />
      </div>
      <p className="muted small">
        {total <= bar ? `Пустой гриф ${bar} кг.` : `На каждую сторону: ${plates.join(' + ') || '—'} кг`}
        {rest > 0 ? ` · не хватает ${rest} кг до точного веса` : ''}
      </p>
    </div>
  )
}
