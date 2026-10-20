import { useMemo, useState } from 'react'
import pct from '../data/pct-arm.json'
import { rebarAreaMm2, formatNum } from '../lib/materials'
import { DataTable, ResultRow } from '../components/DataTable'
import { Field, SheetShell } from './shared'

/** Минимальный % армирования по п.10.3.6 СП 63 — логика листа */
function muWalls(lo_i: number): number {
  // simplified breakpoints from sheet logic around lo/i
  if (lo_i <= 17) return 0.1
  if (lo_i >= 87) return 0.25
  return 0.1 + ((lo_i - 17) * (0.25 - 0.1)) / (87 - 17)
}

function muColumns(lo_h: number): number {
  if (lo_h <= 5) return 0.1
  if (lo_h >= 25) return 0.25
  return 0.1 + ((lo_h - 5) * (0.25 - 0.1)) / (25 - 5)
}

export function PctArmSheet() {
  const [mode, setMode] = useState<'walls' | 'slabs' | 'columns' | 'area'>('walls')

  // walls
  const [Hw, setHw] = useState(300)
  const [bw, setBw] = useState(100)
  const [hw, setHwThick] = useState(30)
  const [aw, setAw] = useState(5)

  // slabs
  const [bs, setBs] = useState(100)
  const [hs, setHs] = useState(120)
  const [as1, setAs1] = useState(5)
  const [as2, setAs2] = useState(5)

  // columns
  const [Hc, setHc] = useState(300)
  const [bc, setBc] = useState(100)
  const [hc, setHcThick] = useState(20)
  const [ac, setAc] = useState(5)

  // area calc
  const [secH, setSecH] = useState(1300)
  const [secB, setSecB] = useState(700)
  const [secA, setSecA] = useState(70)
  const [bars, setBars] = useState([
    { d: 40, n: 48 },
    { d: 40, n: 8 },
    { d: 0, n: 0 },
    { d: 0, n: 0 },
    { d: 0, n: 0 },
  ])

  // area table by diameter/spacing
  const [dBar, setDBar] = useState(16)
  const spacings = [125, 200, 250, 300] // → n per meter: 8, 5, 4, 3.33

  const walls = useMemo(() => {
    const lo = Hw * 0.8
    const ho = hw - aw
    const i = ho * 0.289
    const lo_i = lo / i
    const lo_h = lo / hw
    const mu = muWalls(lo_i)
    return { lo, ho, i, lo_i, lo_h, mu }
  }, [Hw, hw, aw])

  const slabs = useMemo(() => {
    const hoT = hs - as1
    const hoC = hs - as2
    return { hoT, hoC, mu: 0.05 } // изгибаемые — мин. 0.05% типично в листе
  }, [hs, as1, as2])

  const columns = useMemo(() => {
    const lo = Hc * 0.8
    const ho = hc - ac
    const lo_h = lo / hc
    const mu = muColumns(lo_h)
    return { lo, ho, lo_h, mu }
  }, [Hc, hc, ac])

  const area = useMemo(() => {
    const h01 = secB - secA
    const h02 = secH - secA
    const As = bars.reduce((s, b) => s + (b.d > 0 && b.n > 0 ? rebarAreaMm2(b.d) * b.n : 0), 0)
    const Ab = secB * secH - As // approx Ab from sheet AD13
    const mus = (As / (secB * secH)) * 100
    return { h01, h02, As, Ab, mus }
  }, [secH, secB, secA, bars])

  const areaByStep = useMemo(() => {
    const ns = [8, 5, 4, 3.3333]
    return spacings.map((s, i) => ({
      step: s,
      n: ns[i],
      S: (dBar * dBar * 3.1416) / 4 * (ns[i] / 100), // см² на метр — как в Excel
    }))
  }, [dBar])

  return (
    <SheetShell
      title="% арм"
      subtitle="Минимальный процент армирования по п.10.3.6 СП 63.13330-2018 и расчёт площади"
    >
      <div className="pill-row">
        {(
          [
            ['walls', 'Стены'],
            ['slabs', 'Плиты'],
            ['columns', 'Колонны'],
            ['area', 'Расчёт площади'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`pill ${mode === id ? 'active' : ''}`}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'walls' && (
        <>
          <div className="form-grid">
            <Field label="H, см">
              <input type="number" value={Hw} onChange={(e) => setHw(+e.target.value)} />
            </Field>
            <Field label="b, см">
              <input type="number" value={bw} onChange={(e) => setBw(+e.target.value)} />
            </Field>
            <Field label="h, см">
              <input type="number" value={hw} onChange={(e) => setHwThick(+e.target.value)} />
            </Field>
            <Field label="аз.с., см">
              <input type="number" value={aw} onChange={(e) => setAw(+e.target.value)} />
            </Field>
          </div>
          <div className="results">
            <ResultRow label="lo = 0,8H" value={`${formatNum(walls.lo, 1)} см`} />
            <ResultRow label="ho" value={`${formatNum(walls.ho, 1)} см`} />
            <ResultRow label="i = 0,289·ho" value={formatNum(walls.i, 3)} />
            <ResultRow label="lo/i" value={formatNum(walls.lo_i, 3)} />
            <ResultRow label="lo/h" value={formatNum(walls.lo_h, 3)} />
            <ResultRow label="μs,min %" value={formatNum(walls.mu, 3)} primary />
          </div>
        </>
      )}

      {mode === 'slabs' && (
        <>
          <div className="form-grid">
            <Field label="b, см">
              <input type="number" value={bs} onChange={(e) => setBs(+e.target.value)} />
            </Field>
            <Field label="h, см">
              <input type="number" value={hs} onChange={(e) => setHs(+e.target.value)} />
            </Field>
            <Field label="аз.с. растянутой, см">
              <input type="number" value={as1} onChange={(e) => setAs1(+e.target.value)} />
            </Field>
            <Field label="аз.с. сжатой, см">
              <input type="number" value={as2} onChange={(e) => setAs2(+e.target.value)} />
            </Field>
          </div>
          <div className="results">
            <ResultRow label="ho растянутой" value={`${formatNum(slabs.hoT, 1)} см`} />
            <ResultRow label="ho сжатой" value={`${formatNum(slabs.hoC, 1)} см`} />
            <ResultRow label="μs,min % (изгиб.)" value={formatNum(slabs.mu, 3)} primary />
          </div>
        </>
      )}

      {mode === 'columns' && (
        <>
          <div className="form-grid">
            <Field label="H, см">
              <input type="number" value={Hc} onChange={(e) => setHc(+e.target.value)} />
            </Field>
            <Field label="b, см">
              <input type="number" value={bc} onChange={(e) => setBc(+e.target.value)} />
            </Field>
            <Field label="h, см">
              <input type="number" value={hc} onChange={(e) => setHcThick(+e.target.value)} />
            </Field>
            <Field label="аз.с., см">
              <input type="number" value={ac} onChange={(e) => setAc(+e.target.value)} />
            </Field>
          </div>
          <div className="results">
            <ResultRow label="lo = 0,8H" value={`${formatNum(columns.lo, 1)} см`} />
            <ResultRow label="ho" value={`${formatNum(columns.ho, 1)} см`} />
            <ResultRow label="lo/h" value={formatNum(columns.lo_h, 3)} />
            <ResultRow label="μs,min %" value={formatNum(columns.mu, 3)} primary />
          </div>
        </>
      )}

      {mode === 'area' && (
        <>
          <div className="form-grid">
            <Field label="h, мм">
              <input type="number" value={secH} onChange={(e) => setSecH(+e.target.value)} />
            </Field>
            <Field label="b, мм">
              <input type="number" value={secB} onChange={(e) => setSecB(+e.target.value)} />
            </Field>
            <Field label="a, мм">
              <input type="number" value={secA} onChange={(e) => setSecA(+e.target.value)} />
            </Field>
          </div>
          {bars.map((b, i) => (
            <div className="form-grid" key={i}>
              <Field label={`ds${i + 1}, мм`}>
                <input
                  type="number"
                  value={b.d}
                  onChange={(e) => {
                    const next = [...bars]
                    next[i] = { ...b, d: +e.target.value }
                    setBars(next)
                  }}
                />
              </Field>
              <Field label={`n${i + 1}, шт`}>
                <input
                  type="number"
                  value={b.n}
                  onChange={(e) => {
                    const next = [...bars]
                    next[i] = { ...b, n: +e.target.value }
                    setBars(next)
                  }}
                />
              </Field>
            </div>
          ))}
          <div className="results">
            <ResultRow label="h01 (Y), мм" value={formatNum(area.h01, 1)} />
            <ResultRow label="h02 (Z), мм" value={formatNum(area.h02, 1)} />
            <ResultRow label="As, мм²" value={formatNum(area.As, 1)} />
            <ResultRow label="μs %" value={formatNum(area.mus, 3)} primary />
          </div>

          <div className="section">
            <h3>Площадь арматуры на 1 м (по диаметру и шагу)</h3>
            <div className="form-grid">
              <Field label="Диаметр d, мм">
                <input type="number" value={dBar} onChange={(e) => setDBar(+e.target.value)} />
              </Field>
            </div>
            <DataTable
              searchable={false}
              rows={[
                ['Шаг, мм', 'Стержней на м', 'S, см²/м'],
                ...areaByStep.map((r) => [r.step, formatNum(r.n, 2), formatNum(r.S, 3)]),
              ]}
            />
          </div>
        </>
      )}

      <div className="section">
        <h3>Данные листа (фрагмент шкалы)</h3>
        <DataTable rows={(pct.aoa as unknown[][]).slice(24, 70)} maxCols={16} />
      </div>
    </SheetShell>
  )
}
