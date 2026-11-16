import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import Home from './screens/Home'
import Programs from './screens/Programs'
import ProgramView from './screens/ProgramView'
import NewProgram from './screens/NewProgram'
import Catalog from './screens/Catalog'
import CatalogDetail from './screens/CatalogDetail'
import Exercises from './screens/Exercises'
import WorkoutScreen from './screens/WorkoutScreen'
import ProfileScreen from './screens/ProfileScreen'
import Progress from './screens/Progress'
import Tools from './screens/Tools'
import More from './screens/More'
import { useStore } from './store'
import { IconBarbell, IconChart, IconHome, IconMore, IconPlan } from './art/Icons'

const tabs = [
  { to: '/', label: 'Главная', Icon: IconHome },
  { to: '/programs', label: 'Программы', Icon: IconPlan },
  { to: '/workout', label: 'Тренировка', Icon: IconBarbell },
  { to: '/progress', label: 'Прогресс', Icon: IconChart },
  { to: '/more', label: 'Ещё', Icon: IconMore },
]

export default function App() {
  const live = useStore(s => !!s.current)
  return (
    <div className="app">
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/programs/new" element={<NewProgram />} />
          <Route path="/programs/:id" element={<ProgramView />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/catalog/:id" element={<CatalogDetail />} />
          <Route path="/workout" element={<WorkoutScreen />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/more" element={<More />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <nav className="tabbar">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}>
            <span className={'tab-icon' + (to === '/workout' && live ? ' live' : '')}><Icon /></span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
