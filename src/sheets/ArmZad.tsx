import { useMemo, useState } from 'react'
import armZad from '../data/arm-zad.json'
import { formatNum } from '../lib/materials'
import { DataTable, ResultRow } from '../components/DataTable'
import { Field, SheetShell } from './shared'

const SCHEMES_250 = [
  { name: 'Не требуется (d10s250)', S: 3.14 },
  { name: 'd10s250', S: 3.14 },
  { name: 'd12s250', S: 4.52 },
  { name: 'd16s250', S: 8.04 },
  { name: 'd16s125', S: 16.08 },
  { name: 'd20s125', S: 25.13 },
  { name: 'd25s125', S: 39.27 },
  { name: 'd28s125', S: 49.26 },
  { name: 'd32s125', S: 64.34 },
  { name: 'd36s125', S: 81.43 },
]

const SCHEMES_200 = [
  { name: 'Не требуется (d10s200)', S: 3.93 },
  { name: 'd10s200', S: 3.93 },
  { name: 'd12s200', S: 5.655 },
  { name: 'd16s200', S: 10.05 },
  { name: 'd16s100', S: 20.11 },
  { name: 'd20s100', S: 31.42 },
  { name: 'd25s100', S: 49.09 },
  { name: 'd28s100', S: 61.58 },
  { name: 'd32s100', S: 80.42 },
  { name: 'd36s100', S: 101.79 },
]

export function ArmZadSheet() {
  const [thickness, setThickness] = useState(180)
  const [baseStep, setBaseStep] = useState<250 | 200>(250)
  const [schemeIdx, setSchemeIdx] = useState(3)

  const schemes = baseStep === 250 ? SCHEMES_250 : SCHEMES_200
  const scheme = schemes[Math.min(schemeIdx, schemes.length - 1)]

  const pct = useMemo(() => {
    // Excel: S / (thickness_cm * 100) * 100 = S / thickness_cm
    // For 180mm: S/(18*100)*100 = S/18
    const tCm = thickness / 10
    return scheme.S / tCm
  }, [scheme, thickness])

  return (
    <SheetShell
      title="Арм.зад."
      subtitle="Задание на армирование стен/пилонов: % армирования = Sарм / (t·100)·100"
    >
      <div className="form-grid">
        <Field label="Толщина стены, мм">
          <input type="number" value={thickness} onChange={(e) => setThickness(+e.target.value)} />
        </Field>
        <Field label="Базовый шаг фона">
          <select value={baseStep} onChange={(e) => setBaseStep(+e.target.value as 250 | 200)}>
            <option value={250}>Шаг 250</option>
            <option value={200}>Шаг 200</option>
          </select>
        </Field>
        <Field label="Схема армирования">
          <select value={schemeIdx} onChange={(e) => setSchemeIdx(+e.target.value)}>
            {schemes.map((s, i) => (
              <option key={s.name} value={i}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="results">
        <ResultRow label="Sарм, см²/м" value={formatNum(scheme.S, 2)} />
        <ResultRow label="% армирования" value={formatNum(pct, 3)} primary />
      </div>
      <div className="section">
        <h3>Справочник схем</h3>
        <DataTable
          searchable={false}
          rows={[
            ['Схема', 'Sарм см²/м', `% при ${thickness} мм`],
            ...schemes.map((s) => [s.name, s.S, formatNum(s.S / (thickness / 10), 3)]),
          ]}
        />
      </div>
      <div className="section">
        <h3>Полный лист (конструктивные указания)</h3>
        <DataTable rows={(armZad.aoa as unknown[][]).slice(0, 45)} maxCols={12} />
      </div>
    </SheetShell>
  )
}
