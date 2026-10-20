import { useMemo, useState } from 'react'
import eBetona from '../data/e-betona.json'
import { CONCRETE_RB, REBAR_SORTAMENT, formatNum } from '../lib/materials'
import { DataTable, ResultRow } from '../components/DataTable'
import { Field, SheetShell } from './shared'

const COEFS = { accel: 0.85, vert: 0.6, horiz1: 0.3, horiz2: 0.2 }

export function EBetonaSheet() {
  const [klass, setKlass] = useState('B25')
  const data = CONCRETE_RB[klass] ?? CONCRETE_RB.B25

  const moduli = useMemo(() => {
    const Eb = data.Eb
    const Eo = Eb * 101.9716 // МПа → т/м² roughly
    return {
      Eo: Eo,
      accel: Eo * COEFS.accel,
      vert: Eo * COEFS.vert,
      horiz1: Eo * COEFS.horiz1,
      horiz2: Eo * COEFS.horiz2,
      Rb: data.Rb,
      Rbt: data.Rbt,
      Eb,
    }
  }, [data])

  const concreteTable = Object.entries(CONCRETE_RB).map(([k, v]) => [
    k,
    v.Rb,
    v.Rbt,
    v.Eb,
    formatNum(v.Eb * COEFS.vert * 101.9716, 0),
    formatNum(v.Eb * COEFS.horiz1 * 101.9716, 0),
  ])

  return (
    <SheetShell
      title="Е бетона"
      subtitle="Модули упругости, Rb/Rbt и сортамент арматуры. Коэффициенты: 0,85 / 0,6 / 0,3 / 0,2."
    >
      <div className="form-grid">
        <Field label="Класс бетона">
          <select value={klass} onChange={(e) => setKlass(e.target.value)}>
            {Object.keys(CONCRETE_RB).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="results">
        <ResultRow label="Eb, МПа" value={moduli.Eb} primary />
        <ResultRow label="Rb, МПа" value={moduli.Rb} />
        <ResultRow label="Rbt, МПа" value={moduli.Rbt} />
        <ResultRow label="≈0,6 Eb (верт.), т/м²" value={formatNum(moduli.vert, 0)} />
        <ResultRow label="≈0,3 Eb (гориз.), т/м²" value={formatNum(moduli.horiz1, 0)} />
        <ResultRow label="≈0,2 Eb (гориз.), т/м²" value={formatNum(moduli.horiz2, 0)} />
        <ResultRow label="≈0,85 Eb, т/м²" value={formatNum(moduli.accel, 0)} />
      </div>

      <div className="section">
        <h3>Таблица бетонов (Rb, Rbt, Eb)</h3>
        <DataTable
          searchable={false}
          rows={[['Класс', 'Rb МПа', 'Rbt МПа', 'Eb МПа', '0,6Eb т/м²', '0,3Eb т/м²'], ...concreteTable]}
        />
      </div>

      <div className="section">
        <h3>Сортамент арматуры</h3>
        <DataTable
          searchable
          rows={[
            ['Диаметр мм', 'Площадь см²', 'Вес кг/м'],
            ...REBAR_SORTAMENT.map((r) => [r.d, r.area, r.weight]),
          ]}
        />
      </div>

      <div className="section">
        <h3>Исходный лист (фрагмент)</h3>
        <DataTable rows={(eBetona.aoa as unknown[][]).slice(0, 50)} maxCols={14} />
      </div>
    </SheetShell>
  )
}
