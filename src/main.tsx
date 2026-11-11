import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, MemoryRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './styles.css'

registerSW({ immediate: true })

// В превью по ссылке адресная строка недоступна — маршруты держим в памяти
const Router = import.meta.env.MODE === 'artifact' ? MemoryRouter : HashRouter

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* HashRouter — работает без сервера и внутри Capacitor/APK */}
    <Router>
      <App />
    </Router>
  </React.StrictMode>
)
