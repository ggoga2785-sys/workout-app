import { useMemo } from 'react'
import type { Level } from '../types'
import { useCatalog } from '../lib/catalog'
import { benchChoices } from '../lib/benchAddon'

export interface BenchAddonState { on: boolean; choice?: string; rm?: number }

/** Переключатель «Жим лёжа по циклу» с выбором жимовой программы и 1ПМ */
export default function BenchAddon({ value, onChange, upperDays, level }:
  { value: BenchAddonState; onChange: (v: BenchAddonState) => void; upperDays: number; level: Level }) {
  const cat = useCatalog()
  const choices = useMemo(() => (cat ? benchChoices(cat, upperDays, level) : []), [cat, upperDays, level])
  const current = value.choice ?? choices[0]?.id
  return (
    <div className="card">
      <label className="toggle">
        <input id="bench-addon" type="checkbox" checked={value.on} onChange={e => onChange({ ...value, on: e.target.checked })} />
        <b>Жим лёжа по циклу</b>
      </label>
      <p className="muted small">В дни верха первым идёт жим лёжа по жимовой программе из базы пауэрлифтинга, веса от твоего 1ПМ. Остальная работа не меняется.</p>
      {value.on && (
        <>
          <div className="mini">
            <span>1ПМ в жиме лёжа, кг</span>
            <input id="bench-addon-rm" className="input" type="number" inputMode="decimal" value={value.rm ?? ''}
              onChange={e => onChange({ ...value, rm: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
          <div className="list">
            {choices.map(c => (
              <button key={c.id} className={'pick' + (current === c.id ? ' on' : '')} onClick={() => onChange({ ...value, choice: c.id })}>
                <b>{c.name}{c.recommended && <span className="badge">рекомендую</span>}</b>
                <span>{c.weeks ? `${c.weeks} нед., ${c.days} жим. дня в неделю` : 'подстраивается под длину программы'}{c.days !== upperDays && c.weeks ? ` — у тебя ${upperDays} дня верха, лишнее сольётся` : ''}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
