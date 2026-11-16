import { useState } from 'react'
import { useStore } from '../store'
import { badgeSupported, newTopic, testPush } from '../lib/notify'
import { phrase } from '../art/Legends'

/** Настройки: мат, уведомления об отдыхе через ntfy, значок на иконке */
export default function NotifySettings() {
  const { profile, setProfile } = useStore()
  const [msg, setMsg] = useState('')
  const topic = profile.ntfyTopic
  const enable = (on: boolean) => setProfile({ notify: on, ntfyTopic: profile.ntfyTopic ?? newTopic() })
  const copy = () => { if (topic) navigator.clipboard?.writeText(topic).then(() => setMsg('Канал скопирован'), () => setMsg('Не получилось скопировать — выдели вручную')) }
  const test = () => { if (topic) testPush(topic, phrase(profile.harsh ?? true)).then(ok => setMsg(ok ? 'Отправлено — проверь телефон' : 'Сервис не ответил'), () => setMsg('Нет связи с ntfy.sh')) }
  const askBadge = async () => {
    if (!('Notification' in window)) return setMsg('Значок работает только в приложении, добавленном на экран «Домой»')
    const r = await Notification.requestPermission()
    setMsg(r === 'granted' ? 'Готово: на иконке будет число сделанных подходов' : 'Разрешение не выдано')
  }
  return (
    <div className="card">
      <h2>Настрой и уведомления</h2>
      <label className="toggle"><input type="checkbox" checked={profile.harsh ?? true} onChange={e => setProfile({ harsh: e.target.checked })} />Жёсткие фразы с матом</label>
      <label className="toggle"><input type="checkbox" checked={!!profile.notify} onChange={e => enable(e.target.checked)} />Пуш, когда отдых кончился (даже если телефон заблокирован)</label>
      {profile.notify && topic && (
        <ol className="steps">
          <li>Поставь бесплатное приложение <b>ntfy</b> из App Store и разреши ему уведомления.</li>
          <li>В ntfy нажми <b>+</b> и введи свой канал: <code className="topic" onClick={copy}>{topic}</code> <button className="chip" onClick={copy}>Копировать</button></li>
          <li>Нажми <button className="chip" onClick={test}>Проверить</button> — должно прийти уведомление.</li>
        </ol>
      )}
      {profile.notify && <p className="muted small">Сверни приложение во время отдыха — к концу отдыха придёт пуш с названием следующего упражнения. Канал личный, никому его не показывай.</p>}
      {badgeSupported() && <button className="btn" onClick={askBadge}>Число подходов на иконке</button>}
      {msg && <p className="muted small">{msg}</p>}
    </div>
  )
}
