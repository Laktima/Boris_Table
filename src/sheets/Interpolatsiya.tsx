import { useMemo, useState } from 'react'
import { formatNum } from '../lib/materials'
import { ResultRow } from '../components/DataTable'
import { Field, SheetShell } from './shared'

function lerp(x: number, x1: number, y1: number, x2: number, y2: number) {
  if (x2 === x1) return y1
  return y1 + ((x - x1) * (y2 - y1)) / (x2 - x1)
}

export function InterpolatsiyaSheet() {
  // Double interpolation defaults from Excel
  const [x1, setX1] = useState(3)
  const [x, setX] = useState(3.7)
  const [x2, setX2] = useState(4)
  const [y11, setY11] = useState(0.4)
  const [y12, setY12] = useState(0.6)
  const [y21, setY21] = useState(0.7)
  const [y22, setY22] = useState(0.9)
  const [z1, setZ1] = useState(1)
  const [z, setZ] = useState(12)
  const [z2, setZ2] = useState(15)

  // Simple interpolation
  const [sx1, setSx1] = useState(12)
  const [sx, setSx] = useState(14)
  const [sx2, setSx2] = useState(24)
  const [sy1, setSy1] = useState(250)
  const [sy2, setSy2] = useState(300)

  const dbl = useMemo(() => {
    const midLow = lerp(x, x1, y11, x2, y21)
    const midHigh = lerp(x, x1, y12, x2, y22)
    const result = lerp(z, z1, midLow, z2, midHigh)
    return { midLow, midHigh, result }
  }, [x, x1, x2, y11, y12, y21, y22, z, z1, z2])

  const simple = useMemo(() => lerp(sx, sx1, sy1, sx2, sy2), [sx, sx1, sx2, sy1, sy2])

  return (
    <SheetShell title="Интерполяция" subtitle="Линейная и двойная интерполяция (логика листа Excel)">
      <div className="section" style={{ marginTop: 0 }}>
        <h3>Двойная интерполяция</h3>
        <div className="form-grid">
          <Field label="B1 (x₁)">
            <input type="number" value={x1} onChange={(e) => setX1(+e.target.value)} />
          </Field>
          <Field label="Промежуточное x">
            <input type="number" value={x} onChange={(e) => setX(+e.target.value)} />
          </Field>
          <Field label="B2 (x₂)">
            <input type="number" value={x2} onChange={(e) => setX2(+e.target.value)} />
          </Field>
          <Field label="y(x₁,z₁)">
            <input type="number" value={y11} onChange={(e) => setY11(+e.target.value)} />
          </Field>
          <Field label="y(x₁,z₂)">
            <input type="number" value={y12} onChange={(e) => setY12(+e.target.value)} />
          </Field>
          <Field label="y(x₂,z₁)">
            <input type="number" value={y21} onChange={(e) => setY21(+e.target.value)} />
          </Field>
          <Field label="y(x₂,z₂)">
            <input type="number" value={y22} onChange={(e) => setY22(+e.target.value)} />
          </Field>
          <Field label="z₁">
            <input type="number" value={z1} onChange={(e) => setZ1(+e.target.value)} />
          </Field>
          <Field label="z">
            <input type="number" value={z} onChange={(e) => setZ(+e.target.value)} />
          </Field>
          <Field label="z₂">
            <input type="number" value={z2} onChange={(e) => setZ2(+e.target.value)} />
          </Field>
        </div>
        <div className="results">
          <ResultRow label="Промежуточное (низ)" value={formatNum(dbl.midLow, 6)} />
          <ResultRow label="Промежуточное (верх)" value={formatNum(dbl.midHigh, 6)} />
          <ResultRow label="Результат" value={formatNum(dbl.result, 6)} primary />
        </div>
      </div>

      <div className="section">
        <h3>Одинарная интерполяция</h3>
        <div className="form-grid">
          <Field label="x₁">
            <input type="number" value={sx1} onChange={(e) => setSx1(+e.target.value)} />
          </Field>
          <Field label="x">
            <input type="number" value={sx} onChange={(e) => setSx(+e.target.value)} />
          </Field>
          <Field label="x₂">
            <input type="number" value={sx2} onChange={(e) => setSx2(+e.target.value)} />
          </Field>
          <Field label="y₁">
            <input type="number" value={sy1} onChange={(e) => setSy1(+e.target.value)} />
          </Field>
          <Field label="y₂">
            <input type="number" value={sy2} onChange={(e) => setSy2(+e.target.value)} />
          </Field>
        </div>
        <div className="results">
          <ResultRow label="y(x)" value={formatNum(simple, 6)} primary />
        </div>
      </div>
    </SheetShell>
  )
}
