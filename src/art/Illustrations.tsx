/**
 * Собственные иллюстрации в стиле старых плакатов атлетических клубов (рубеж XIX–XX веков):
 * силач с шаровой штангой, гиря, герб клуба. Нарисованы с нуля, без чужих изображений.
 * Цвета берутся из CSS-переменных темы.
 */
const BONE = 'var(--bone)'
const RED = 'var(--red)'
const BRASS = 'var(--brass)'
const INK = 'var(--bg)'

function Rays({ cx, cy, r, n = 28 }: { cx: number; cy: number; r: number; n?: number }) {
  const rays = []
  for (let i = 0; i < n; i++) {
    const a1 = (i / n) * Math.PI * 2, a2 = ((i + 0.5) / n) * Math.PI * 2
    rays.push(<path key={i} d={`M${cx},${cy} L${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} L${cx + r * Math.cos(a2)},${cy + r * Math.sin(a2)} Z`} />)
  }
  return <g fill={BRASS} opacity="0.16">{rays}</g>
}

function Globe({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={BONE} />
      <circle cx={x} cy={y} r={r - 3.5} fill="none" stroke={INK} strokeWidth="1.2" opacity="0.5" />
      <path d={`M${x - r * 0.55},${y - r * 0.35} A${r * 0.7},${r * 0.7} 0 0 1 ${x + r * 0.1},${y - r * 0.62}`} stroke={INK} strokeWidth="2" fill="none" opacity="0.35" strokeLinecap="round" />
      <circle cx={x} cy={y} r="2.2" fill={INK} opacity="0.6" />
    </g>
  )
}

/** Силач с шаровой штангой над головой, на постаменте, с лентой */
export function Strongman({ label = 'ЖЕЛЕЗО', className }: { label?: string; className?: string }) {
  return (
    <svg viewBox="0 0 200 240" className={className} role="img" aria-label="Силач со штангой">
      <Rays cx={100} cy={100} r={120} />
      <circle cx="100" cy="100" r="74" fill="none" stroke={BRASS} strokeWidth="1.5" opacity="0.6" />
      <circle cx="100" cy="100" r="68" fill="none" stroke={BRASS} strokeWidth="0.8" opacity="0.4" strokeDasharray="2 3" />
      {/* штанга */}
      <rect x="40" y="38" width="120" height="4" rx="2" fill={BONE} />
      <Globe x={36} y={40} r={19} />
      <Globe x={164} y={40} r={19} />
      {/* руки */}
      <path d="M80,98 C72,84 66,66 66,46" stroke={BONE} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M120,98 C128,84 134,66 134,46" stroke={BONE} strokeWidth="12" strokeLinecap="round" fill="none" />
      <path d="M74,72 C70,66 70,58 72,54" stroke={INK} strokeWidth="1.4" fill="none" opacity="0.45" />
      <path d="M126,72 C130,66 130,58 128,54" stroke={INK} strokeWidth="1.4" fill="none" opacity="0.45" />
      {/* голова, причёска с пробором, усы */}
      <rect x="95" y="88" width="10" height="8" fill={BONE} />
      <ellipse cx="100" cy="78" rx="10.5" ry="12" fill={BONE} />
      <path d="M89.5,74 C90,64 110,62 110.5,74 C107,69 103,68 100,70 C97,68 93,69 89.5,74 Z" fill={INK} opacity="0.85" />
      <path d="M92,84 C95,82 98,83 100,84.5 C102,83 105,82 108,84 C110,86 112,84 113,82 C112,87 107,88 104,86.5 C102,86 101,86.5 100,87 C99,86.5 98,86 96,86.5 C93,88 88,87 87,82 C88,84 90,86 92,84 Z" fill={INK} />
      {/* торс */}
      <path d="M74,96 C82,92 118,92 126,96 C128,112 120,128 113,142 L87,142 C80,128 72,112 74,96 Z" fill={BONE} />
      <path d="M86,108 C92,113 98,112 100,108 C102,112 108,113 114,108" stroke={INK} strokeWidth="1.3" fill="none" opacity="0.45" />
      <path d="M100,114 L100,138 M93,122 L107,122 M94,130 L106,130" stroke={INK} strokeWidth="1" opacity="0.3" />
      {/* пояс и трико */}
      <rect x="85" y="140" width="30" height="7" fill={BRASS} />
      <rect x="97" y="140" width="6" height="7" fill={INK} opacity="0.4" />
      <path d="M85,147 L115,147 L118,164 L102,164 L100,158 L98,164 L82,164 Z" fill={RED} />
      {/* ноги */}
      <path d="M90,162 C88,178 86,192 84,206" stroke={BONE} strokeWidth="13" strokeLinecap="round" fill="none" />
      <path d="M110,162 C112,178 114,192 116,206" stroke={BONE} strokeWidth="13" strokeLinecap="round" fill="none" />
      <path d="M76,208 L92,208 M108,208 L124,208" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      {/* постамент и лента */}
      <rect x="58" y="210" width="84" height="8" fill={BRASS} opacity="0.85" />
      <path d="M30,222 L170,222 L162,232 L170,240 L30,240 L38,232 Z" fill={RED} />
      <text x="100" y="235.5" textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight="700" fontSize="12" letterSpacing="3" fill={BONE}>{label}</text>
    </svg>
  )
}

/** Гиря с весом в пудах */
export function Kettlebell({ className, mark = '2 ПУДА' }: { className?: string; mark?: string }) {
  return (
    <svg viewBox="0 0 120 130" className={className} role="img" aria-label="Гиря">
      <path d="M38,50 C34,26 44,10 60,10 C76,10 86,26 82,50" stroke={BONE} strokeWidth="9" fill="none" />
      <path d="M60,40 C28,40 14,62 14,84 C14,108 32,124 60,124 C88,124 106,108 106,84 C106,62 92,40 60,40 Z" fill={BONE} />
      <path d="M30,70 C36,58 46,52 56,50" stroke={INK} strokeWidth="2.5" fill="none" opacity="0.3" strokeLinecap="round" />
      <rect x="24" y="78" width="72" height="20" fill={RED} />
      <text x="60" y="93" textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight="700" fontSize="13" letterSpacing="1.5" fill={BONE}>{mark}</text>
      <rect x="40" y="118" width="40" height="6" fill={INK} opacity="0.25" />
    </svg>
  )
}

/** Герб клуба: штанга, лавры, лента */
export function Crest({ className, title = 'ЖЕЛЕЗО', motto = 'СИЛА · ВОЛЯ · ДИСЦИПЛИНА' }: { className?: string; title?: string; motto?: string }) {
  const leaves = (side: 1 | -1) => Array.from({ length: 7 }, (_, i) => {
    const t = i / 6, a = (-0.2 + t * 1.25) * Math.PI
    const x = 100 + side * 58 * Math.cos(a), y = 70 + 52 * Math.sin(a)
    const rot = (a * 180) / Math.PI + (side === 1 ? 90 : -90) + side * 30
    return <ellipse key={i} cx={x} cy={y} rx="4.5" ry="10" transform={`rotate(${side === 1 ? rot : 180 - rot} ${x} ${y})`} fill={BRASS} />
  })
  return (
    <svg viewBox="0 0 200 150" className={className} role="img" aria-label="Герб клуба">
      {leaves(1)}{leaves(-1)}
      <rect x="44" y="64" width="112" height="5" rx="2" fill={BONE} />
      {[[52, 22], [62, 30], [148, 22], [138, 30]].map(([x, h], i) => <rect key={i} x={x - 4} y={66.5 - h / 2} width="8" height={h} rx="2" fill={i % 2 ? RED : BONE} />)}
      <text x="100" y="52" textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight="700" fontSize="24" letterSpacing="5" fill={BONE}>{title}</text>
      <text x="100" y="92" textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight="500" fontSize="8" letterSpacing="2" fill={BRASS}>ОСН. 2026</text>
      <path d="M22,112 L178,112 L170,124 L178,136 L22,136 L30,124 Z" fill={RED} />
      <text x="100" y="128.5" textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight="600" fontSize="10" letterSpacing="2" fill={BONE}>{motto}</text>
    </svg>
  )
}

/** Мотивационные слоганы — свои формулировки, без чужих цитат */
export const SLOGANS = [
  'Железо не врёт.',
  'Штанга не знает, что у тебя был плохой день.',
  'Дисциплина сильнее мотивации.',
  'Ещё один повтор. Всегда ещё один.',
  'Сила приходит к тем, кто приходит в зал.',
  'Рекорд ставится на тренировке, а не в мечтах.',
  'Тяжело — значит работает.',
  'Пропущенная тренировка не вернётся.',
  'Мел на руках, план в голове.',
  'Сегодня ты сильнее, чем вчера.',
  'Старая школа: база, режим, терпение.',
  'Спокойно подойди и пожми.',
]

export const sloganOfDay = () => SLOGANS[Math.floor(Date.now() / 86400000) % SLOGANS.length]
