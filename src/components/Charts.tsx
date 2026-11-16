/** Лёгкие SVG-графики без библиотек: линия с областью и столбики */
interface Pt { label: string; v: number }

const W = 320, H = 150, PL = 34, PR = 14, PT = 10, PB = 22

function niceRange(vals: number[]) {
  let lo = Math.min(...vals), hi = Math.max(...vals)
  if (lo === hi) { lo -= 5; hi += 5 }
  const pad = (hi - lo) * 0.12
  return [Math.max(0, Math.floor((lo - pad) / 5) * 5), Math.ceil((hi + pad) / 5) * 5]
}

export function LineChart({ points, unit = 'кг' }: { points: Pt[]; unit?: string }) {
  if (points.length < 2) return <div className="empty">{points.length ? `Пока одна точка: ${points[0].v} ${unit}. После следующей тренировки появится график.` : 'Нет данных. Отметь выполненные подходы — и здесь появится график.'}</div>
  const [lo, hi] = niceRange(points.map(p => p.v))
  const x = (i: number) => PL + (i * (W - PL - PR)) / (points.length - 1)
  const y = (v: number) => PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB)
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')
  const ticks = [lo, (lo + hi) / 2, hi]
  const every = Math.ceil(points.length / 5)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="График">
      {ticks.map(t => <g key={t}><line className="grid" x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} /><text x={PL - 5} y={y(t) + 3} textAnchor="end">{Math.round(t)}</text></g>)}
      <path className="area" d={`${d} L${x(points.length - 1)},${H - PB} L${x(0)},${H - PB} Z`} />
      <path className="line" d={d} />
      {points.map((p, i) => <circle key={i} className="dot" cx={x(i)} cy={y(p.v)} r={i === points.length - 1 ? 4 : 2.2} />)}
      {points.map((p, i) => (i % every === 0 || i === points.length - 1) && <text key={'l' + i} x={x(i)} y={H - 6} textAnchor={i === points.length - 1 ? 'end' : i === 0 ? 'start' : 'middle'}>{p.label}</text>)}
    </svg>
  )
}

export function BarChart({ points, format = (v: number) => String(Math.round(v)) }: { points: Pt[]; format?: (v: number) => string }) {
  const max = Math.max(1, ...points.map(p => p.v))
  const bw = (W - PL - PR) / points.length
  const y = (v: number) => PT + (1 - v / max) * (H - PT - PB)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Столбчатый график">
      {[0, max / 2, max].map(t => <g key={t}><line className="grid" x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} /><text x={PL - 5} y={y(t) + 3} textAnchor="end">{format(t)}</text></g>)}
      {points.map((p, i) => (
        <g key={i}>
          <rect className={'bar' + (i === points.length - 1 ? '' : ' dim')} x={PL + i * bw + bw * 0.18} y={y(p.v)} width={bw * 0.64} height={Math.max(0, H - PB - y(p.v))} rx="1.5" />
          {(i % 2 === points.length % 2 || i === points.length - 1) && <text x={PL + i * bw + bw / 2} y={H - 6} textAnchor="middle">{p.label}</text>}
        </g>
      ))}
    </svg>
  )
}
