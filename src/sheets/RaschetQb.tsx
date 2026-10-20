import { useMemo, useState } from 'react'
import { CONCRETE_RB, REBAR_RSW, rebarAreaMm2, formatNum } from '../lib/materials'
import { ResultRow } from '../components/DataTable'
import { Field, SheetShell } from './shared'

export function RaschetQbSheet() {
  const [b, setB] = useState(1000)
  const [h, setH] = useState(300)
  const [a, setA] = useState(36)
  const [beton, setBeton] = useState('B25')
  const [armClass, setArmClass] = useState('A500')
  const [SwX, setSwX] = useState(285)
  const [SwY, setSwY] = useState(285)
  const [dBar, setDBar] = useState(6)

  const r = useMemo(() => {
    const mat = CONCRETE_RB[beton]
    const Rb = mat.Rb
    const Rbt = mat.Rbt
    const Rsw = REBAR_RSW[armClass]
    const h0 = h - a
    const nX = 1000 / SwX
    const nY = 1000 / SwY
    const Asw1 = rebarAreaMm2(dBar) // mm² one bar
    const AswX = Asw1 * nX
    const AswY = Asw1 * nY
    const AswXY = AswX * nY // G11 = G9*G7
    const qw = (Rsw * AswXY) / SwX // G12
    const Qb = 0.25 * Rbt * b // G13 — simplified from sheet
    const QswX = (0.75 * qw * h0) / 10000
    const QswY = (0.75 * qw * 2 * h0) / 10000
    const Qsw = (qw * h0) / 10000
    const QbAlt = (0.5 * Rbt * h0 * b) / 9810

    return { h0, nX, nY, Asw1, AswX, AswY, AswXY, qw, Qb, QswX, QswY, Qsw, QbAlt, Rb, Rbt, Rsw }
  }, [b, h, a, beton, armClass, SwX, SwY, dBar])

  return (
    <SheetShell title="Расчет Qb" subtitle="Поперечная сила бетона и арматуры (логика листа Excel)">
      <div className="form-grid">
        <Field label="b, мм">
          <input type="number" value={b} onChange={(e) => setB(+e.target.value)} />
        </Field>
        <Field label="h, мм">
          <input type="number" value={h} onChange={(e) => setH(+e.target.value)} />
        </Field>
        <Field label="a, мм">
          <input type="number" value={a} onChange={(e) => setA(+e.target.value)} />
        </Field>
        <Field label="Бетон">
          <select value={beton} onChange={(e) => setBeton(e.target.value)}>
            {Object.keys(CONCRETE_RB).map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label="Класс поперечной арматуры">
          <select value={armClass} onChange={(e) => setArmClass(e.target.value)}>
            {Object.keys(REBAR_RSW).map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label="Диаметр стержня, мм">
          <input type="number" value={dBar} onChange={(e) => setDBar(+e.target.value)} />
        </Field>
        <Field label="Sw (x), мм">
          <input type="number" value={SwX} onChange={(e) => setSwX(+e.target.value)} />
        </Field>
        <Field label="Sw (y), мм">
          <input type="number" value={SwY} onChange={(e) => setSwY(+e.target.value)} />
        </Field>
      </div>
      <div className="results">
        <ResultRow label="h0, мм" value={formatNum(r.h0, 1)} />
        <ResultRow label="Rb / Rbt, МПа" value={`${r.Rb} / ${r.Rbt}`} />
        <ResultRow label="Rsw, МПа" value={r.Rsw} />
        <ResultRow label="n (x) / n (y)" value={`${formatNum(r.nX, 3)} / ${formatNum(r.nY, 3)}`} />
        <ResultRow label="Asw стержня, мм²" value={formatNum(r.Asw1, 2)} />
        <ResultRow label="Asw (x общ), мм²" value={formatNum(r.AswX, 2)} />
        <ResultRow label="qw" value={formatNum(r.qw, 3)} />
        <ResultRow label="0,25·Rbt·b" value={formatNum(r.Qb, 3)} />
        <ResultRow label="Qsw (x)" value={formatNum(r.QswX, 4)} />
        <ResultRow label="Qsw (y)" value={formatNum(r.QswY, 4)} />
        <ResultRow label="Qsw" value={formatNum(r.Qsw, 4)} primary />
        <ResultRow label="Qb (0,5·Rbt·h0·b/9810)" value={formatNum(r.QbAlt, 4)} />
      </div>
    </SheetShell>
  )
}
