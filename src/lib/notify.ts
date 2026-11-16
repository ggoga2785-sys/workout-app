/**
 * Уведомление «отдых окончен», когда приложение свёрнуто.
 * iOS останавливает JS свёрнутой веб-страницы, поэтому пуш отправляет внешний бесплатный сервис ntfy.sh
 * с отложенной доставкой: в момент сворачивания мы просим его прислать уведомление через N секунд.
 * На телефоне нужно приложение ntfy (App Store), подписанное на личный канал пользователя.
 */
const BASE = 'https://ntfy.sh'
const SEQ_KEY = 'zhelezo-push-seq'

export const newTopic = () => {
  const a = new Uint8Array(9); crypto.getRandomValues(a)
  return 'zhelezo-' + Array.from(a, b => (b % 36).toString(36)).join('')
}

function post(body: Record<string, unknown>) {
  // text/plain без заголовков — «простой» запрос, без CORS-предзапроса
  return fetch(BASE + '/', { method: 'POST', keepalive: true, body: JSON.stringify(body) })
}

/** Запланировать уведомление через delaySec секунд (ntfy принимает от 10 с) */
export function scheduleRestPush(topic: string, delaySec: number, title: string, message: string) {
  if (delaySec < 10) return
  const seq = 'r' + Date.now().toString(36)
  try { localStorage.setItem(SEQ_KEY, seq) } catch { /* ignore */ }
  post({ topic, title, message, tags: ['muscle'], priority: 4, delay: `${Math.round(delaySec)}s`, sequence_id: seq }).catch(() => {})
}

/** Отменить запланированное (если сервис это поддерживает; иначе уведомление просто придёт) */
export function cancelRestPush(topic: string) {
  let seq: string | null = null
  try { seq = localStorage.getItem(SEQ_KEY); localStorage.removeItem(SEQ_KEY) } catch { /* ignore */ }
  if (seq) fetch(`${BASE}/${topic}/${seq}`, { method: 'DELETE', keepalive: true }).catch(() => {})
}

export const hasPending = () => { try { return !!localStorage.getItem(SEQ_KEY) } catch { return false } }

export function testPush(topic: string, message: string) {
  return post({ topic, title: 'ЖЕЛЕЗО', message, tags: ['muscle'], priority: 4 }).then(r => r.ok)
}

/** Значок с числом на иконке приложения (iOS 16.4+, установленное на экран «Домой», нужно разрешение) */
export function setBadge(n: number) {
  const nav = navigator as Navigator & { setAppBadge?: (n?: number) => Promise<void>; clearAppBadge?: () => Promise<void> }
  try { if (n > 0) nav.setAppBadge?.(n)?.catch(() => {}); else nav.clearAppBadge?.()?.catch(() => {}) } catch { /* ignore */ }
}
export const badgeSupported = () => 'setAppBadge' in navigator
