import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import Home from './screens/Home'
import Programs from './screens/Programs'
import ProgramView from './screens/ProgramView'
import NewProgram from './screens/NewProgram'
import WorkoutScreen from './screens/WorkoutScreen'
import Exercises from './screens/Exercises'
import ProfileScreen from './screens/ProfileScreen'
import { useStore } from './store'

const tabs = [
  { to: '/', label: 'Главная', icon: '⌂' },
  { to: '/programs', label: 'Программы', icon: '☰' },
  { to: '/workout', label: 'Тренировка', icon: '●' },
  { to: '/exercises', label: 'Упражнения', icon: '◆' },
  { to: '/profile', label: 'Профиль', icon: '◉' },
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
          <Route path="/workout" element={<WorkoutScreen />} />
          <Route path="/exercises" element={<Exercises />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <nav className="tabbar">
        {tabs.map(t => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'} className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}>
            <span className={'tab-icon' + (t.to === '/workout' && live ? ' live' : '')}>{t.icon}</span>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
