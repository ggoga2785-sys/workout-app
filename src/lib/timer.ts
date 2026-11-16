import { create } from 'zustand'

/** Таймер отдыха — общий для всего приложения, переживает переходы между экранами */
interface TimerState {
  endAt?: number
  total: number
  start: (sec: number) => void
  add: (sec: number) => void
  stop: () => void
}

let ctx: AudioContext | undefined
let fired: number | undefined

/** Разблокировать звук в iOS — вызывать из обработчика нажатия */
export function unlockAudio() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = ctx ?? new AC()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch { /* звук недоступен */ }
}

function gong() {
  try {
    if (!ctx) return
    const t = ctx.currentTime
    ;[0, 0.35, 0.7].forEach((d, i) => {
      const o = ctx!.createOscillator(), g = ctx!.createGain()
      o.type = 'triangle'; o.frequency.value = i === 2 ? 990 : 660
      g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.35, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.3)
      o.connect(g).connect(ctx!.destination); o.start(t + d); o.stop(t + d + 0.32)
    })
  } catch { /* ignore */ }
  try { navigator.vibrate?.([200, 100, 200]) } catch { /* ignore */ }
}

export const useTimer = create<TimerState>((set, get) => ({
  total: 0,
  start: sec => set({ endAt: Date.now() + sec * 1000, total: sec }),
  add: sec => { const e = get().endAt; if (e) set({ endAt: e + sec * 1000, total: get().total + sec }) },
  stop: () => set({ endAt: undefined }),
}))

/** Проверка окончания: вызывается тиком из компонента таймера */
export function checkTimerEnd(sound: boolean) {
  const { endAt } = useTimer.getState()
  if (endAt && Date.now() >= endAt && fired !== endAt) {
    fired = endAt
    if (sound) gong()
    return true
  }
  return false
}
