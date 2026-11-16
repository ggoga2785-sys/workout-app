import { useEffect, useState } from 'react'
import { checkTimerEnd, unlockAudio, useTimer } from '../lib/timer'
import { useStore } from '../store'
import { phrase } from '../art/Legends'

export default function RestTimer() {
  const { endAt, total, start, add, stop } = useTimer()
  const sound = useStore(s => s.profile.timerSound ?? true)
  const harsh = useStore(s => s.profile.harsh ?? true)
  const label = useTimer(s => s.label)
  const [line, setLine] = useState(() => phrase(harsh))
  useEffect(() => setLine(phrase(harsh)), [endAt, harsh])
  const [now, setNow] = useState(Date.now())
  const [ended, setEnded] = useState(false)
  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now())
      if (checkTimerEnd(sound)) { setEnded(true); setTimeout(() => setEnded(false), 4000) }
    }, 250)
    return () => clearInterval(t)
  }, [sound])
  const left = endAt ? Math.max(0, Math.ceil((endAt - now) / 1000)) : 0
  const running = left > 0
  return (
    <div className={'timer' + (running ? ' running' : '') + (ended ? ' ended' : '')}>
      <span className="big">{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>
      {running ? (
        <>
          <button className="chip" onClick={() => add(30)}>+30 с</button>
          <button className="chip" onClick={() => add(-15)}>−15 с</button>
          <button className="chip" onClick={stop}>Стоп</button>
        </>
      ) : (
        <>
          <span className="muted small">{ended ? line : 'Отдых:'}</span>
          {[60, 120, 180, 300].map(s => <button key={s} className="chip" onClick={() => { unlockAudio(); start(s) }}>{s / 60} мин</button>)}
        </>
      )}
      {running && <div className="timer-next"><b>{line}</b>{label && <span>Дальше: {label}</span>}</div>}
      {running && <div className="bar"><i style={{ width: `${(left / Math.max(1, total)) * 100}%` }} /></div>}
    </div>
  )
}
