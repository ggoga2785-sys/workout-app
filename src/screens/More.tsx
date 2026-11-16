import { Link } from 'react-router-dom'
import { IconCalc, IconList, IconUser, IconChart } from '../art/Icons'
import { Crest } from '../art/Illustrations'

const tiles = [
  { to: '/legends', title: 'Зал славы', sub: 'Плакаты легенд и жёсткие лозунги', Icon: IconChart },
  { to: '/exercises', title: 'Упражнения', sub: 'База на 130 упражнений и свои', Icon: IconList },
  { to: '/tools', title: 'Инструменты', sub: 'Блины, 1ПМ, проценты, RPE', Icon: IconCalc },
  { to: '/profile', title: 'Профиль', sub: '1ПМ, вес, настройки, копия данных', Icon: IconUser },
]

export default function More() {
  return (
    <div className="screen">
      <h1>Ещё</h1>
      <div className="more-grid">
        {tiles.map(({ to, title, sub, Icon }) => (
          <Link key={to} to={to} className="more-tile"><Icon /><b>{title}</b><span>{sub}</span></Link>
        ))}
      </div>
      <Crest className="crest" />
      <p className="muted small" style={{ textAlign: 'center' }}>Все данные хранятся только на этом устройстве.</p>
    </div>
  )
}
