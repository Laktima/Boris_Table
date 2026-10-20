import { useMemo, useState } from 'react'
import { REBAR_SORTAMENT, formatNum } from '../lib/materials'
import { DataTable, ResultRow } from '../components/DataTable'
import { Field, SheetShell } from './shared'

type BarRow = { d: number; n: number }

function areaOf(d: number, n: number) {
  const row = REBAR_SORTAMENT.find((r) => r.d === d)
  const a1 = row ? row.area : (Math.PI * d * d) / 400
  return a1 * n
}

function BarEditor({
  title,
  rows,
  onChange,
}: {
  title: string
  rows: BarRow[]
  onChange: (rows: BarRow[]) => void
}) {
  return (
    <div className="section" style={{ marginTop: 12 }}>
      <h3>{title}</h3>
      {rows.map((r, i) => (
        <div className="form-grid" key={i}>
          <Field label="Диаметр, мм">
            <select
              value={r.d}
              onChange={(e) => {
                const next = [...rows]
                next[i] = { ...r, d: +e.target.value }
                onChange(next)
              }}
            >
              {REBAR_SORTAMENT.map((s) => (
                <option key={s.d} value={s.d}>
                  {s.d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Количество, шт">
            <input
              type="number"
              value={r.n}
              onChange={(e) => {
                const next = [...rows]
                next[i] = { ...r, n: +e.target.value }
                onChange(next)
              }}
            />
          </Field>
          <Field label="Площадь, см²">
            <input readOnly value={formatNum(areaOf(r.d, r.n), 3)} />
          </Field>
        </div>
      ))}
    </div>
  )
}

export function RasxArmSheet() {
  const [top, setTop] = useState<BarRow[]>([
    { d: 18, n: 2 },
    { d: 12, n: 3 },
    { d: 10, n: 0 },
    { d: 10, n: 0 },
    { d: 10, n: 0 },
  ])
  const [bot, setBot] = useState<BarRow[]>([
    { d: 18, n: 5 },
    { d: 12, n: 3 },
    { d: 10, n: 0 },
    { d: 10, n: 0 },
    { d: 10, n: 0 },
  ])
  const [distPct, setDistPct] = useState(0.3)
  // W6 in excel seems to be a separate "area top for distribution" input - using top total * something
  // From formulas: W6=1.6 (manual?), W7=0.3, W8=W6*W7, W9=W6-W8, W10=2.4 manual bottom?, W11=W8+W10
  const [AsDistBase, setAsDistBase] = useState(1.6)
  const [AsBotManual, setAsBotManual] = useState(2.4)

  const calc = useMemo(() => {
    const AsTop = top.reduce((s, r) => s + areaOf(r.d, r.n), 0)
    const AsBot = bot.reduce((s, r) => s + areaOf(r.d, r.n), 0)
    const distArea = AsTop * distPct
    const topAfter = AsTop - distArea
    const botWithDist = AsBot + distArea
    // alternate block from W columns
    const w8 = AsDistBase * distPct
    const w9 = AsDistBase - w8
    const w11 = w8 + AsBotManual
    return { AsTop, AsBot, distArea, topAfter, botWithDist, w8, w9, w11 }
  }, [top, bot, distPct, AsDistBase, AsBotManual])

  // split helper: match area with two diameters
  const [targetAs, setTargetAs] = useState(15.71)
  const [d1, setD1] = useState(16)
  const [d2, setD2] = useState(12)

  const split = useMemo(() => {
    const a1 = areaOf(d1, 1)
    const a2 = areaOf(d2, 1)
    // try n1,n2 to approximate target
    let best = { n1: 0, n2: 0, as: 0, err: Infinity }
    for (let n1 = 0; n1 <= 20; n1++) {
      for (let n2 = 0; n2 <= 20; n2++) {
        const as = a1 * n1 + a2 * n2
        const err = Math.abs(as - targetAs)
        if (err < best.err) best = { n1, n2, as, err }
      }
    }
    return best
  }, [targetAs, d1, d2])

  return (
    <SheetShell
      title="Расх_арм"
      subtitle="Расход арматуры: площади верх/низ, распределение, подбор стержней"
    >
      <BarEditor title="Верхняя арматура" rows={top} onChange={setTop} />
      <BarEditor title="Нижняя арматура" rows={bot} onChange={setBot} />

      <div className="form-grid">
        <Field label="Процент распределения">
          <input
            type="number"
            step="0.05"
            value={distPct}
            onChange={(e) => setDistPct(+e.target.value)}
          />
        </Field>
      </div>
      <div className="results">
        <ResultRow label="Σ верхней, см²" value={formatNum(calc.AsTop, 3)} />
        <ResultRow label="Σ нижней, см²" value={formatNum(calc.AsBot, 3)} />
        <ResultRow label="Распределённая" value={formatNum(calc.distArea, 3)} />
        <ResultRow label="Верх за вычетом" value={formatNum(calc.topAfter, 3)} />
        <ResultRow label="Низ с учётом распределения" value={formatNum(calc.botWithDist, 3)} primary />
      </div>

      <div className="section">
        <h3>Блок распределения (как W6…W11)</h3>
        <div className="form-grid">
          <Field label="Площадь верхней (база), см²">
            <input type="number" step="0.01" value={AsDistBase} onChange={(e) => setAsDistBase(+e.target.value)} />
          </Field>
          <Field label="Площадь нижней (база), см²">
            <input type="number" step="0.01" value={AsBotManual} onChange={(e) => setAsBotManual(+e.target.value)} />
          </Field>
        </div>
        <div className="results">
          <ResultRow label="Распределённая" value={formatNum(calc.w8, 3)} />
          <ResultRow label="За вычетом (верх)" value={formatNum(calc.w9, 3)} />
          <ResultRow label="Низ с распределением" value={formatNum(calc.w11, 3)} primary />
        </div>
      </div>

      <div className="section">
        <h3>Разбивка на 2 диаметра</h3>
        <div className="form-grid">
          <Field label="Требуемая площадь, см²">
            <input type="number" step="0.01" value={targetAs} onChange={(e) => setTargetAs(+e.target.value)} />
          </Field>
          <Field label="Ø1">
            <select value={d1} onChange={(e) => setD1(+e.target.value)}>
              {REBAR_SORTAMENT.map((s) => (
                <option key={s.d} value={s.d}>
                  {s.d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ø2">
            <select value={d2} onChange={(e) => setD2(+e.target.value)}>
              {REBAR_SORTAMENT.map((s) => (
                <option key={s.d} value={s.d}>
                  {s.d}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="results">
          <ResultRow
            label="Подбор"
            value={`${split.n1}∅${d1} + ${split.n2}∅${d2} = ${formatNum(split.as, 3)} см²`}
            primary
          />
        </div>
      </div>

      <div className="section">
        <h3>Сортамент</h3>
        <DataTable
          rows={[
            ['d, мм', 'As 1 шт, см²', 'Вес, кг/м'],
            ...REBAR_SORTAMENT.map((r) => [r.d, r.area, r.weight]),
          ]}
        />
      </div>
    </SheetShell>
  )
}
