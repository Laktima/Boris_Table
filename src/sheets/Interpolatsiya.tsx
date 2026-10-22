import { useMemo, useState, type ChangeEvent } from 'react'
import { formatNum } from '../lib/materials'
import { tryAppendToFormula } from '../lib/formulaPick'
import { persistKey, usePersistedState } from '../lib/persist'

/**
 * Линейная интерполяция (как на sopromat.xyz):
 * f(x) = f1 + (x - x1) * (f2 - f1) / (x2 - x1)
 */
function lerp(t: number, t1: number, v1: number, t2: number, v2: number) {
  if (t2 === t1) return v1
  return v1 + ((t - t1) * (v2 - v1)) / (t2 - t1)
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  }
}

function NumInput({
  value,
  onChange,
  className,
  step = 'any',
}: {
  value: number
  onChange: (n: number) => void
  className?: string
  step?: string
}) {
  // Локальный текст при вводе: пустое поле не превращается в 0 (иначе «010»).
  const [text, setText] = useState<string | null>(null)
  const shown = text ?? (Number.isFinite(value) ? String(value) : '')

  return (
    <input
      type="number"
      step={step}
      className={className}
      value={shown}
      onFocus={() => setText(Number.isFinite(value) ? String(value) : '')}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value
        setText(raw)
        if (raw === '') return
        const n = Number(raw)
        if (Number.isFinite(n)) onChange(n)
      }}
      onBlur={() => {
        if (text === null) return
        const n = text === '' ? 0 : Number(text)
        onChange(Number.isFinite(n) ? n : 0)
        setText(null)
      }}
    />
  )
}

export function InterpolatsiyaSheet() {
  // Двойная: X — сверху, Y — слева (как sopromat)
  // Excel defaults: X=1/12/15, Y=3/3.7/4, углы 0.4/0.6/0.7/0.9
  const [x1, setX1] = usePersistedState(persistKey('interp', 'x1'), 1)
  const [x, setX] = usePersistedState(persistKey('interp', 'x'), 12)
  const [x2, setX2] = usePersistedState(persistKey('interp', 'x2'), 15)
  const [y1, setY1] = usePersistedState(persistKey('interp', 'y1'), 3)
  const [y, setY] = usePersistedState(persistKey('interp', 'y'), 3.7)
  const [y2, setY2] = usePersistedState(persistKey('interp', 'y2'), 4)
  const [f11, setF11] = usePersistedState(persistKey('interp', 'f11'), 0.4) // f(x1,y1)
  const [f21, setF21] = usePersistedState(persistKey('interp', 'f21'), 0.6) // f(x2,y1)
  const [f12, setF12] = usePersistedState(persistKey('interp', 'f12'), 0.7) // f(x1,y2)
  const [f22, setF22] = usePersistedState(persistKey('interp', 'f22'), 0.9) // f(x2,y2)

  // Одинарная
  const [sx1, setSx1] = usePersistedState(persistKey('interp', 'sx1'), 12)
  const [sx2, setSx2] = usePersistedState(persistKey('interp', 'sx2'), 24)
  const [sx, setSx] = usePersistedState(persistKey('interp', 'sx'), 14)
  const [sf1, setSf1] = usePersistedState(persistKey('interp', 'sf1'), 250)
  const [sf2, setSf2] = usePersistedState(persistKey('interp', 'sf2'), 300)

  const [copied, setCopied] = useState<string | null>(null)

  const dbl = useMemo(() => {
    // 1) по X при y1 и y2
    const f_x_y1 = lerp(x, x1, f11, x2, f21)
    const f_x_y2 = lerp(x, x1, f12, x2, f22)
    // 2) по Y между ними
    const result = lerp(y, y1, f_x_y1, y2, f_x_y2)
    return { f_x_y1, f_x_y2, result }
  }, [x, x1, x2, y, y1, y2, f11, f21, f12, f22])

  const simple = useMemo(
    () => lerp(sx, sx1, sf1, sx2, sf2),
    [sx, sx1, sx2, sf1, sf2],
  )

  const dblText = formatNum(dbl.result, 3)
  const mid1Text = formatNum(dbl.f_x_y1, 3)
  const mid2Text = formatNum(dbl.f_x_y2, 3)
  const simpleText = formatNum(simple, 3)

  const onCopy = async (text: string) => {
    if (tryAppendToFormula(text)) return
    const ok = await copyText(text)
    if (!ok) return
    setCopied(text)
    window.setTimeout(() => setCopied((c) => (c === text ? null : c)), 1400)
  }

  return (
    <div className="sheet-panel interp-sheet">
      <section className="interp-block">
        <div className="interp-unit interp-unit-double">
          <h3 className="interp-heading">Двойная интерполяция</h3>
          <table className="interp-grid interp-grid-double">
            <tbody>
              {/*        x1     x      x2   */}
              <tr>
                <td className="interp-empty" />
                <td className="interp-axis">
                  <NumInput value={x1} onChange={setX1} className="interp-cell-input" />
                </td>
                <td className="interp-axis">
                  <NumInput value={x} onChange={setX} className="interp-cell-input" />
                </td>
                <td className="interp-axis">
                  <NumInput value={x2} onChange={setX2} className="interp-cell-input" />
                </td>
              </tr>
              {/* y1    f11   mid1   f21  */}
              <tr>
                <td className="interp-in">
                  <NumInput value={y1} onChange={setY1} className="interp-cell-input" />
                </td>
                <td className="interp-data">
                  <NumInput
                    value={f11}
                    onChange={setF11}
                    className="interp-cell-input"
                    step="0.1"
                  />
                </td>
                <td className="interp-mid">
                  <span className="interp-mid-val">{mid1Text}</span>
                </td>
                <td className="interp-data">
                  <NumInput
                    value={f21}
                    onChange={setF21}
                    className="interp-cell-input"
                    step="0.1"
                  />
                </td>
              </tr>
              {/* y     —    RES    —   */}
              <tr>
                <td className="interp-in">
                  <NumInput value={y} onChange={setY} className="interp-cell-input" />
                </td>
                <td className="interp-blank" />
                <td className="interp-out">
                  <button
                    type="button"
                    className={`interp-result-btn ${copied === dblText ? 'copied' : ''}`}
                    data-copy-value={dblText}
                    title="Клик — скопировать"
                    onClick={(e) => {
                      if (e.currentTarget.dataset.formulaPicked === '1') {
                        delete e.currentTarget.dataset.formulaPicked
                        return
                      }
                      void onCopy(dblText)
                    }}
                  >
                    {dblText}
                  </button>
                </td>
                <td className="interp-blank" />
              </tr>
              {/* y2    f12   mid2   f22  */}
              <tr>
                <td className="interp-in">
                  <NumInput value={y2} onChange={setY2} className="interp-cell-input" />
                </td>
                <td className="interp-data">
                  <NumInput
                    value={f12}
                    onChange={setF12}
                    className="interp-cell-input"
                    step="0.1"
                  />
                </td>
                <td className="interp-mid">
                  <span className="interp-mid-val">{mid2Text}</span>
                </td>
                <td className="interp-data">
                  <NumInput
                    value={f22}
                    onChange={setF22}
                    className="interp-cell-input"
                    step="0.1"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="interp-block">
        <div className="interp-unit interp-unit-single">
          <h3 className="interp-heading">Одинарная интерполяция</h3>
          <table className="interp-grid interp-grid-single">
            <tbody>
              <tr>
                <td className="interp-in">
                  <NumInput value={sx1} onChange={setSx1} className="interp-cell-input" />
                </td>
                <td className="interp-data">
                  <NumInput value={sf1} onChange={setSf1} className="interp-cell-input" />
                </td>
              </tr>
              <tr>
                <td className="interp-in">
                  <NumInput value={sx} onChange={setSx} className="interp-cell-input" />
                </td>
                <td className="interp-out">
                  <button
                    type="button"
                    className={`interp-result-btn ${copied === simpleText ? 'copied' : ''}`}
                    data-copy-value={simpleText}
                    title="Клик — скопировать"
                    onClick={(e) => {
                      if (e.currentTarget.dataset.formulaPicked === '1') {
                        delete e.currentTarget.dataset.formulaPicked
                        return
                      }
                      void onCopy(simpleText)
                    }}
                  >
                    {simpleText}
                  </button>
                </td>
              </tr>
              <tr>
                <td className="interp-in">
                  <NumInput value={sx2} onChange={setSx2} className="interp-cell-input" />
                </td>
                <td className="interp-data">
                  <NumInput value={sf2} onChange={setSf2} className="interp-cell-input" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {copied ? (
        <div className="interp-copy-bar">
          <span className="copy-toast">Скопировано: {copied}</span>
        </div>
      ) : null}
    </div>
  )
}
