/**
 * Плакаты «Зал славы» в духе старых афиш качалок.
 * Фигуры — условные силуэты-пиктограммы (не портреты), нарисованы с нуля.
 * Подписи: имя, прозвище/факт и только настоящие известные цитаты; остальное — лозунги самого приложения.
 */
const BONE = 'var(--bone)'
const RED = 'var(--red)'
const BRASS = 'var(--brass)'

export type Pose = 'biceps' | 'lat' | 'overhead' | 'squat' | 'deadlift' | 'bench'
type P = [number, number]

function Limb({ pts, w }: { pts: P[]; w: number }) {
  return <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke={BONE} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
}
const Plate = ({ x, y, r }: { x: number; y: number; r: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill={RED} />
    <circle cx={x} cy={y} r={r * 0.72} fill="none" stroke={BONE} strokeWidth="2" opacity=".35" />
    <circle cx={x} cy={y} r={4} fill={BONE} opacity=".8" />
  </g>
)
const FrontPlates = ({ x1, x2, y }: { x1: number; x2: number; y: number }) => (
  <g>
    <rect x={x1 - 6} y={y - 2.5} width={x2 - x1 + 12} height="5" rx="2" fill={BRASS} />
    {[x1, x2].map((x, i) => <g key={i}>
      <rect x={x - 7} y={y - 26} width="14" height="52" rx="3" fill={RED} />
      <rect x={x + (i ? 8 : -17)} y={y - 18} width="9" height="36" rx="2" fill={RED} opacity=".85" />
    </g>)}
  </g>
)

/** Силуэт в позе: передний бицепс, широчайшие, жим над головой, присед, тяга, жим лёжа */
export function Figure({ pose, className }: { pose: Pose; className?: string }) {
  const front = (sh: [P, P], arms: [P[], P[]], wide = false) => (
    <g>
      <polygon points={`${sh[0].join(',')} ${sh[1].join(',')} 113,138 87,138`} fill={BONE} />
      {wide && <polygon points="66,80 134,80 118,128 82,128" fill={BONE} />}
      <circle cx="100" cy="54" r="14" fill={BONE} />
      <rect x="93" y="62" width="14" height="14" fill={BONE} />
      <Limb pts={arms[0]} w={17} /><Limb pts={arms[1]} w={17} />
      <Limb pts={[[91, 136], [84, 182], [80, 222]]} w={20} />
      <Limb pts={[[109, 136], [116, 182], [120, 222]]} w={20} />
      <rect x="66" y="219" width="22" height="7" rx="3" fill={BONE} /><rect x="112" y="219" width="22" height="7" rx="3" fill={BONE} />
    </g>
  )
  let body
  switch (pose) {
    case 'biceps':
      body = front([[72, 76], [128, 76]], [[[74, 78], [44, 84], [50, 46]], [[126, 78], [156, 84], [150, 46]]])
      break
    case 'lat':
      body = front([[64, 78], [136, 78]], [[[66, 82], [54, 112], [86, 130]], [[134, 82], [146, 112], [114, 130]]], true)
      break
    case 'overhead':
      body = <g>
        <FrontPlates x1={26} x2={174} y={24} />
        {front([[74, 76], [126, 76]], [[[76, 78], [60, 52], [64, 26]], [[124, 78], [140, 52], [136, 26]]])}
      </g>
      break
    case 'squat':
      body = <g>
        <Limb pts={[[78, 140], [100, 90]]} w={34} />
        <Plate x={90} y={88} r={30} />
        <circle cx="124" cy="70" r="14" fill={BONE} />
        <Limb pts={[[100, 92], [118, 108], [100, 88]]} w={14} />
        <Limb pts={[[78, 140], [126, 150]]} w={24} />
        <Limb pts={[[126, 150], [112, 220]]} w={18} />
        <rect x="104" y="217" width="30" height="8" rx="3" fill={BONE} />
      </g>
      break
    case 'deadlift':
      body = <g>
        <Limb pts={[[66, 118], [116, 112]]} w={32} />
        <circle cx="140" cy="104" r="14" fill={BONE} />
        <Limb pts={[[66, 118], [102, 162]]} w={24} />
        <Limb pts={[[102, 162], [94, 220]]} w={18} />
        <rect x="86" y="217" width="30" height="8" rx="3" fill={BONE} />
        <Limb pts={[[114, 114], [118, 192]]} w={14} />
        <Plate x={118} y={194} r={30} />
      </g>
      break
    case 'bench':
      body = <g>
        <rect x="40" y="168" width="118" height="10" rx="3" fill={BRASS} />
        <rect x="52" y="178" width="7" height="46" fill={BRASS} /><rect x="140" y="178" width="7" height="46" fill={BRASS} />
        <Limb pts={[[70, 158], [132, 156]]} w={30} />
        <circle cx="156" cy="150" r="14" fill={BONE} />
        <Limb pts={[[70, 160], [46, 186], [44, 220]]} w={18} />
        <rect x="34" y="217" width="26" height="8" rx="3" fill={BONE} />
        <Limb pts={[[128, 152], [128, 98]]} w={14} />
        <Plate x={128} y={96} r={30} />
      </g>
      break
  }
  return (
    <svg viewBox="0 0 200 240" className={className} aria-hidden="true">
      <SunRays />
      {body}
    </svg>
  )
}

function SunRays() {
  const n = 24, out = []
  for (let i = 0; i < n; i++) {
    const a1 = (i / n) * Math.PI * 2, a2 = ((i + 0.5) / n) * Math.PI * 2
    out.push(<path key={i} d={`M100,110 L${100 + 160 * Math.cos(a1)},${110 + 160 * Math.sin(a1)} L${100 + 160 * Math.cos(a2)},${110 + 160 * Math.sin(a2)} Z`} />)
  }
  return <g fill={BRASS} opacity=".13">{out}</g>
}

export interface Legend { name: string; tag: string; pose: Pose; quote?: string; slogan: string }

/** Факты и цитаты — только общеизвестные; лозунги в slogan — голос приложения, не цитаты */
export const LEGENDS: Legend[] = [
  { name: 'Арнольд Шварценеггер', tag: '7 × Мистер Олимпия', pose: 'biceps',
    quote: 'Мышцы растут на последних трёх-четырёх повторениях. Эта боль отделяет чемпиона от остальных.', slogan: 'Последние повторы — твои. Дожимай.' },
  { name: 'Ронни Коулмен', tag: '8 × Мистер Олимпия', pose: 'squat',
    quote: 'Yeah buddy! Light weight, baby!', slogan: 'Лёгкий вес, детка. Ебашь.' },
  { name: 'Ронни Коулмен', tag: '8 × Мистер Олимпия', pose: 'deadlift',
    quote: 'Все хотят быть бодибилдерами, но никто не хочет поднимать тяжеленные веса.', slogan: 'Тяжело? Значит, правильно.' },
  { name: 'Том Платц', tag: '«Quadfather» — ноги, которые до сих пор обсуждают', pose: 'squat',
    slogan: 'Нет ног — нет уважения. Приседай, сука.' },
  { name: 'Кевин Леврон', tag: '«Maryland Muscle Machine»', pose: 'lat',
    slogan: 'Шире спину. Выше голову. Ебашь.' },
  { name: 'Рич Пиана', tag: 'Легенда старой школы бодибилдинга', pose: 'biceps',
    slogan: 'Хватит пиздеть. Иди качайся.' },
  { name: 'Кирилл Сарычев', tag: '335 кг в жиме лёжа без экипировки', pose: 'bench',
    slogan: 'Жми, блядь, как будто это рекорд.' },
  { name: 'Джулиус Мэддокс', tag: '355 кг в жиме лёжа без экипировки', pose: 'bench',
    slogan: 'Лавка ждёт. Хватит сидеть в телефоне.' },
  { name: 'Эдди Холл', tag: 'Первым в истории потянул 500 кг', pose: 'deadlift',
    slogan: 'Отрывай от пола, как будто тебя бесит этот вес.' },
  { name: 'Старая школа', tag: 'Клуб «Железо»', pose: 'overhead',
    slogan: 'Над головой и на замок. Без соплей.' },
]

export const HARSH = [
  'Отдых кончился. Ебашь.',
  'Хватит сидеть. Пора ебашить.',
  'Штанга сама себя не поднимет, блядь.',
  'Встал с лавки — и к железу.',
  'Отговорки не поднимают вес.',
  'Ещё подход. Похуй, что тяжело.',
  'Мышцы не растут от нытья.',
  'Ты пришёл не отдыхать. Работай.',
  'Жми, сука, как в последний раз.',
  'Боль временна. Слабость — навсегда.',
  'Делай, блядь, или вали домой.',
  'Телефон на пол. Руки на гриф.',
  'Сел — встал. Вся философия.',
  'Железо не врёт. И ты не ври себе.',
]
export const CLEAN = [
  'Отдых окончен. К штанге!',
  'Пора работать.',
  'Ещё подход. Всегда ещё один.',
  'Отговорки не поднимают вес.',
  'Тяжело — значит работает.',
  'Боль временна. Слабость — навсегда.',
  'Руки на гриф — и вперёд.',
]

const dayIdx = (n: number, shift = 0) => (Math.floor(Date.now() / 86400000) + shift) % n
export const legendOfDay = (shift = 0) => LEGENDS[dayIdx(LEGENDS.length, shift)]
export const phrase = (harsh: boolean) => { const l = harsh ? HARSH : CLEAN; return l[Math.floor(Math.random() * l.length)] }
const clean = (s: string) => s.replace(/,? ?блядь,?/g, '').replace(/,? ?сука,?/g, '').replace(/Ебашь/g, 'Работай').replace(/ебашить/g, 'работать')
  .replace(/Хватит пиздеть/g, 'Хватит болтать').replace(/Похуй/g, 'Неважно').replace(/  +/g, ' ')

/** Плакат легенды. harsh=false — без мата */
export function LegendPoster({ l, harsh = true, compact = false }: { l: Legend; harsh?: boolean; compact?: boolean }) {
  const t = (s: string) => (harsh ? s : clean(s))
  return (
    <div className={'legend' + (compact ? ' compact' : '')}>
      <div className="legend-top">ЗАЛ СЛАВЫ · КЛУБ «ЖЕЛЕЗО»</div>
      <Figure pose={l.pose} className="legend-fig" />
      <div className="legend-body">
        <div className="legend-name">{l.name}</div>
        <div className="legend-tag">{l.tag}</div>
        {l.quote && !compact && <blockquote>«{t(l.quote)}»<cite>— {l.name}</cite></blockquote>}
        <div className="legend-slogan">{t(l.slogan)}</div>
      </div>
    </div>
  )
}
