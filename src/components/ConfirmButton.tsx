import { useEffect, useState, type ReactNode } from 'react'

/** Кнопка с подтверждением вторым нажатием (без системных диалогов — они не везде работают) */
export default function ConfirmButton({ onConfirm, children, ask = 'Точно?', className = 'btn ghost danger' }:
  { onConfirm: () => void; children: ReactNode; ask?: string; className?: string }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button className={className + (armed ? ' armed' : '')} onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}>
      {armed ? ask : children}
    </button>
  )
}
