import { useMemo, useState } from 'react'
import qbSection from '../assets/qb-section.png'
import { CONCRETE_RB, REBAR_RSW, rebarAreaMm2, formatNum } from '../lib/materials'
import { tryAppendToFormula } from '../lib/formulaPick'
import { persistKey, usePersistedState } from '../lib/persist'
import { Field } from './shared'

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

export function RaschetQbSheet() {
  const [b, setB] = usePersistedState(persistKey('qb', 'b'), 1000)
  const [h, setH] = usePersistedState(persistKey('qb', 'h'), 300)
  const [a, setA] = usePersistedState(persistKey('qb', 'a'), 36)
  const [beton, setBeton] = usePersistedState(persistKey('qb', 'beton'), 'B25')
  const [armClass, setArmClass] = usePersistedState(persistKey('qb', 'armClass'), 'A500')
  const [SwX, setSwX] = usePersistedState(persistKey('qb', 'SwX'), 285)
  const [SwY, setSwY] = usePersistedState(persistKey('qb', 'SwY'), 285)
  const [dBar, setDBar] = usePersistedState(persistKey('qb', 'dBar'), 6)
  const [copied, setCopied] = useState<string | null>(null)

  const r = useMemo(() => {
    const mat = CONCRETE_RB[beton]
    const Rb = mat.Rb
    const Rbt = mat.Rbt
    const Rsw = REBAR_RSW[armClass]
    const h0 = h - a
    const nX = 1000 / SwX
    const nY = 1000 / SwY
    const Asw1 = rebarAreaMm2(dBar)
    const AswX = Asw1 * nX
    const AswY = Asw1 * nY
    const AswXY = AswX * nY
    const qw = (Rsw * AswXY) / SwX
    const qwMin = 0.25 * Rbt * b
    const Qsw1 = (0.75 * qw * h0) / 10000
    const Qsw2 = (0.75 * qw * 2 * h0) / 10000
    const Qsw3 = (qw * h0) / 10000
    const Qb1 = (0.5 * Rbt * h0 * b) / 9810

    return {
      h0,
      nX,
      nY,
      Asw1,
      AswX,
      AswY,
      AswXY,
      qw,
      qwMin,
      Qsw1,
      Qsw2,
      Qsw3,
      Qb1,
      Rb,
      Rbt,
      Rsw,
    }
  }, [b, h, a, beton, armClass, SwX, SwY, dBar])

  const results = [
    {
      key: 'Qsw1',
      hint: 'ф 8.58 · C = h₀',
      value: formatNum(r.Qsw1, 4),
      unit: 'тс',
      primary: false,
    },
    {
      key: 'Qsw2',
      hint: 'ф 8.58 · C = 2·h₀',
      value: formatNum(r.Qsw2, 4),
      unit: 'тс',
      primary: false,
    },
    {
      key: 'Qsw3',
      hint: 'ф 8.62 · без накл. сечений',
      value: formatNum(r.Qsw3, 4),
      unit: 'тс',
      primary: false,
    },
    {
      key: 'Qb1',
      hint: '0,5·Rbt·h₀·b / 9810',
      value: formatNum(r.Qb1, 4),
      unit: 'тс',
      primary: true,
    },
  ]

  const onCopy = async (text: string) => {
    if (tryAppendToFormula(text)) return
    const ok = await copyText(text)
    if (!ok) return
    setCopied(text)
    window.setTimeout(() => setCopied((c) => (c === text ? null : c)), 1400)
  }

  return (
    <div className="sheet-panel qb-sheet">
      <h2 className="qb-title">Расчет Qb</h2>

      <div className="qb-layout">
        <div className="qb-main">
          <div className="qb-card">
            <h3 className="qb-card-title">Сечение</h3>
            <div className="qb-fields">
              <Field label="b, мм">
                <input
                  className="qb-in"
                  type="number"
                  value={b}
                  onChange={(e) => setB(+e.target.value)}
                />
              </Field>
              <Field label="h, мм">
                <input
                  className="qb-in"
                  type="number"
                  value={h}
                  onChange={(e) => setH(+e.target.value)}
                />
              </Field>
              <Field label="a, мм">
                <input
                  className="qb-in"
                  type="number"
                  value={a}
                  onChange={(e) => setA(+e.target.value)}
                />
              </Field>
              <div className="qb-ro">
                <span className="qb-ro-label">h₀</span>
                <span className="qb-ro-val">
                  {formatNum(r.h0, 1)} <small>мм</small>
                </span>
              </div>
            </div>
          </div>

          <div className="qb-card">
            <h3 className="qb-card-title">Материалы</h3>
            <div className="qb-fields">
              <Field label="Бетон">
                <select
                  className="qb-sel"
                  value={beton}
                  onChange={(e) => setBeton(e.target.value)}
                >
                  {Object.keys(CONCRETE_RB).map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </Field>
              <div className="qb-ro">
                <span className="qb-ro-label">Rb</span>
                <span className="qb-ro-val">
                  {r.Rb} <small>МПа</small>
                </span>
              </div>
              <div className="qb-ro">
                <span className="qb-ro-label">Rbt</span>
                <span className="qb-ro-val">
                  {r.Rbt} <small>МПа</small>
                </span>
              </div>
              <Field label="Арматура">
                <select
                  className="qb-sel"
                  value={armClass}
                  onChange={(e) => setArmClass(e.target.value)}
                >
                  {Object.keys(REBAR_RSW).map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </Field>
              <div className="qb-ro">
                <span className="qb-ro-label">Rsw</span>
                <span className="qb-ro-val">
                  {r.Rsw} <small>МПа</small>
                </span>
              </div>
              <Field label="dsw, мм">
                <select
                  className="qb-sel"
                  value={dBar}
                  onChange={(e) => setDBar(+e.target.value)}
                >
                  {[6, 8, 10, 12, 14, 16].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="qb-card">
            <h3 className="qb-card-title">Поперечная арматура</h3>
            <div className="qb-fields">
              <Field label="Sw (x), мм">
                <input
                  className="qb-in"
                  type="number"
                  value={SwX}
                  onChange={(e) => setSwX(+e.target.value)}
                />
              </Field>
              <div className="qb-ro">
                <span className="qb-ro-label">n (x)</span>
                <span className="qb-ro-val">
                  {formatNum(r.nX, 3)} <small>шт</small>
                </span>
              </div>
              <Field label="Sw (y), мм">
                <input
                  className="qb-in"
                  type="number"
                  value={SwY}
                  onChange={(e) => setSwY(+e.target.value)}
                />
              </Field>
              <div className="qb-ro">
                <span className="qb-ro-label">n (y)</span>
                <span className="qb-ro-val">
                  {formatNum(r.nY, 3)} <small>шт</small>
                </span>
              </div>
            </div>
          </div>

          <div className="qb-card">
            <h3 className="qb-card-title">Площади и qsw</h3>
            <div className="qb-kv-list">
              <div className="qb-kv">
                <span>Asw стерж</span>
                <strong>
                  {formatNum(r.Asw1, 2)} <small>мм²</small>
                </strong>
              </div>
              <div className="qb-kv">
                <span>Asw x</span>
                <strong>
                  {formatNum(r.AswX, 1)} <small>мм²</small>
                </strong>
              </div>
              <div className="qb-kv">
                <span>Asw y</span>
                <strong>
                  {formatNum(r.AswY, 1)} <small>мм²</small>
                </strong>
              </div>
              <div className="qb-kv">
                <span>Asw общ</span>
                <strong>
                  {formatNum(r.AswXY, 1)} <small>мм²</small>
                </strong>
              </div>
              <div className="qb-kv">
                <span>qsw</span>
                <strong>{formatNum(r.qw, 1)}</strong>
              </div>
              <div className="qb-kv">
                <span>qsw min</span>
                <strong>{formatNum(r.qwMin, 1)}</strong>
              </div>
            </div>
          </div>
        </div>

        <aside className="qb-aside">
          <figure className="qb-figure">
            <img src={qbSection} alt="Схема сечения: b, h, поперечная арматура Sw" />
          </figure>

          <div className="qb-results">
            <h3 className="qb-card-title">Несущая способность</h3>
            {results.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`qb-result-btn${item.primary ? ' primary' : ''}${
                  copied === item.value ? ' copied' : ''
                }`}
                data-copy-value={item.value}
                title="Клик — скопировать"
                onClick={(e) => {
                  if (e.currentTarget.dataset.formulaPicked === '1') {
                    delete e.currentTarget.dataset.formulaPicked
                    return
                  }
                  void onCopy(item.value)
                }}
              >
                <span className="qb-result-meta">
                  <strong>{item.key}</strong>
                  <small>{item.hint}</small>
                </span>
                <span className="qb-result-num">
                  {item.value} <small>{item.unit}</small>
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      {copied ? (
        <div className="qb-copy-bar">
          <span className="copy-toast">Скопировано: {copied}</span>
        </div>
      ) : null}
    </div>
  )
}
