import { useMemo, useState } from 'react'
import { ceilingMath, formatNum, matchApprox } from '../lib/materials'
import { ResultRow } from '../components/DataTable'
import { Field, SheetShell } from './shared'

/** Таблица Д.1 СП 20.13330 — пролёт → L/f */
const TABLE_LE6 = [
  { L: 1, ratio: 120 },
  { L: 3, ratio: 150 },
  { L: 6, ratio: 200 },
  { L: 12, ratio: 250 },
  { L: 24, ratio: 300 },
]
const TABLE_GT6 = [
  { L: 1, ratio: 120 },
  { L: 3, ratio: 150 },
  { L: 6, ratio: 200 },
  { L: 24, ratio: 250 },
  { L: 36, ratio: 300 },
]

export function ProgibSheet() {
  const [H, setH] = useState(8.1)
  const [Lfact, setLfact] = useState(3.2)
  const [fFact, setFFact] = useState(1.67)

  const result = useMemo(() => {
    const table = H > 6 ? TABLE_GT6 : TABLE_LE6
    const Ls = table.map((t) => t.L)
    const idx = matchApprox(Lfact, Ls)
    const L1 = table[idx].L
    const ratio1 = table[idx].ratio
    const idx2 = Math.min(idx + 1, table.length - 1)
    const L2 = table[idx2].L
    const ratio2 = table[idx2].ratio

    // linear interpolation of ratio for Lfact between L1 and L2
    const q5 = (Lfact - L1) * (ratio2 - ratio1)
    const q6 = L2 === L1 ? 0 : q5 / (L2 - L1)
    const ratioInterp = ratio1 + q6
    const ratioCeil = ceilingMath(ratioInterp, 1)
    const fLim = ceilingMath((Lfact * 1000) / ratioCeil, 0.1)
    const kPct = ceilingMath((fFact * 100) / fLim, 0.1)
    const K = kPct * 0.01

    const text = `Максимальный прогиб плиты в пролете ${Lfact}м составил ${fFact}мм. Предельно допустимый прогиб, согласно приложение Д СП 20.13330.2016, fu = L/${ratioCeil} = ${fLim}мм`
    return { L1, L2, ratio1, ratio2, ratioCeil, fLim, kPct, K, text }
  }, [H, Lfact, fFact])

  return (
    <SheetShell
      title="Прогиб"
      subtitle="Расчёт допустимого прогиба по приложению Д СП 20.13330.2016"
    >
      <div className="form-grid">
        <Field label="Высота помещения H, м">
          <input type="number" step="0.1" value={H} onChange={(e) => setH(+e.target.value)} />
        </Field>
        <Field label="Фактический пролёт L, м">
          <input type="number" step="0.1" value={Lfact} onChange={(e) => setLfact(+e.target.value)} />
        </Field>
        <Field label="Фактический прогиб, мм">
          <input type="number" step="0.01" value={fFact} onChange={(e) => setFFact(+e.target.value)} />
        </Field>
      </div>
      <div className="results">
        <ResultRow label="Пролёт L1 по табл. Д.1" value={`${result.L1} м`} />
        <ResultRow label="Пролёт L2 по табл. Д.1" value={`${result.L2} м`} />
        <ResultRow label="L/f (округл.)" value={result.ratioCeil} />
        <ResultRow label="Предельный прогиб fu" value={`${formatNum(result.fLim, 1)} мм`} primary />
        <ResultRow label="Коэффициент использования" value={`K = ${formatNum(result.K, 3)} (${formatNum(result.kPct, 1)}%)`} />
      </div>
      <p className="note">{result.text}</p>
    </SheetShell>
  )
}
