import { useMemo, useState } from 'react'
import { formatNum, matchApprox } from '../lib/materials'
import { ResultRow } from '../components/DataTable'
import { Field, SheetShell } from './shared'

/** Таблица 11.2 СП 20.13330.2016 */
const ZE = [5, 10, 20, 40, 60, 80, 100, 150, 200, 250, 300]
const KA = [0.75, 1.0, 1.25, 1.5, 1.7, 1.85, 2.0, 2.25, 2.45, 2.65, 2.75]
const KB = [0.5, 0.65, 0.85, 1.1, 1.3, 1.45, 1.6, 1.9, 2.1, 2.3, 2.5]
const KC = [0.4, 0.4, 0.55, 0.8, 1.0, 1.15, 1.25, 1.55, 1.8, 2.0, 2.2]

function kze(ze: number, kArr: number[]): number {
  const idx = matchApprox(ze, ZE)
  const i2 = Math.min(idx + 1, ZE.length - 1)
  const z1 = ZE[idx]
  const z2 = ZE[i2]
  const k1 = kArr[idx]
  const k2 = kArr[i2]
  if (z2 === z1) return k1
  return k1 + ((ze - z1) * (k2 - k1)) / (z2 - z1)
}

export function KoefKzeSheet() {
  const [zeA, setZeA] = useState(27.517)
  const [zeB, setZeB] = useState(5)
  const [zeC, setZeC] = useState(5)

  const ka = useMemo(() => kze(zeA, KA), [zeA])
  const kb = useMemo(() => kze(zeB, KB), [zeB])
  const kc = useMemo(() => kze(zeC, KC), [zeC])

  return (
    <SheetShell
      title="Коэф. Kze"
      subtitle="Коэффициент изменения ветрового давления по высоте — табл. 11.2 СП 20.13330.2016"
    >
      <div className="section" style={{ marginTop: 0 }}>
        <h3>Тип местности А</h3>
        <div className="form-grid">
          <Field label="Расчётная высота Ze, м">
            <input type="number" step="0.001" value={zeA} onChange={(e) => setZeA(+e.target.value)} />
          </Field>
        </div>
        <div className="results">
          <ResultRow label="k (тип А)" value={formatNum(ka, 6)} primary />
        </div>
      </div>
      <div className="section">
        <h3>Тип местности В</h3>
        <div className="form-grid">
          <Field label="Ze, м">
            <input type="number" step="0.001" value={zeB} onChange={(e) => setZeB(+e.target.value)} />
          </Field>
        </div>
        <div className="results">
          <ResultRow label="k (тип В)" value={formatNum(kb, 6)} primary />
        </div>
      </div>
      <div className="section">
        <h3>Тип местности С</h3>
        <div className="form-grid">
          <Field label="Ze, м">
            <input type="number" step="0.001" value={zeC} onChange={(e) => setZeC(+e.target.value)} />
          </Field>
        </div>
        <div className="results">
          <ResultRow label="k (тип С)" value={formatNum(kc, 6)} primary />
        </div>
      </div>
      <div className="section">
        <h3>Таблица 11.2</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ze, м</th>
                <th>А</th>
                <th>В</th>
                <th>С</th>
              </tr>
            </thead>
            <tbody>
              {ZE.map((z, i) => (
                <tr key={z}>
                  <td>{z}</td>
                  <td>{KA[i]}</td>
                  <td>{KB[i]}</td>
                  <td>{KC[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SheetShell>
  )
}
