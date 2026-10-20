import { useMemo, useState } from 'react'
import anker from '../data/anker-nakhl.json'
import { CONCRETE_RB, rebarAreaCm2, formatNum } from '../lib/materials'
import { DataTable, ResultRow } from '../components/DataTable'
import { Field, SheetShell } from './shared'

const RS_MPA: Record<string, number> = {
  А240: 210,
  А400: 350,
  А500: 435,
  А600: 520,
  А800: 695,
  А1000: 870,
}

const KGCM2 = 10.194 // МПа → кг/см²

export function AnkerSheet() {
  const [armClass, setArmClass] = useState('А500')
  const [d, setD] = useState(8)
  const [beton, setBeton] = useState('B30')
  const [eta1, setEta1] = useState(2.5)
  const [eta2, setEta2] = useState(1)
  const [alpha1, setAlpha1] = useState(1)
  const [alpha2, setAlpha2] = useState(1.2)
  const [AsCal, setAsCal] = useState(3.14)
  const [AsEf, setAsEf] = useState(3.14)

  const r = useMemo(() => {
    const Rs = (RS_MPA[armClass] ?? 435) * KGCM2
    const Rbt = (CONCRETE_RB[beton]?.Rbt ?? 1.15) * KGCM2
    const As = rebarAreaCm2(d)
    const us = (Math.PI * d) / 10
    const Rbond = eta1 * eta2 * Rbt
    const l0an = ((Rs * As) / (Rbond * us)) * 10
    const usage = AsCal / AsEf
    const lan = alpha1 * l0an * usage
    const lan15d = 15 * d
    const lan200 = 200
    const lan03 = 0.3 * l0an
    const ankerFinal = Math.max(lan, lan15d, lan200, lan03)

    const l1 = alpha2 * l0an * usage
    const l04 = 0.4 * alpha2 * l0an
    const l20d = 20 * d
    const l250 = 250
    const nakhlFinal = Math.max(l1, l04, l20d, l250)

    return {
      Rs,
      Rbt,
      As,
      us,
      Rbond,
      l0an,
      usage,
      lan,
      ankerFinal,
      l1,
      nakhlFinal,
    }
  }, [armClass, d, beton, eta1, eta2, alpha1, alpha2, AsCal, AsEf])

  return (
    <SheetShell
      title="Анкер | Нахл"
      subtitle="Длина анкеровки и нахлестки арматуры (формулы листа Excel)"
    >
      <div className="form-grid">
        <Field label="Класс арматуры">
          <select value={armClass} onChange={(e) => setArmClass(e.target.value)}>
            {Object.keys(RS_MPA).map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label="Диаметр, мм">
          <input type="number" value={d} onChange={(e) => setD(+e.target.value)} />
        </Field>
        <Field label="Класс бетона">
          <select value={beton} onChange={(e) => setBeton(e.target.value)}>
            {Object.keys(CONCRETE_RB).map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label="η1">
          <input type="number" step="0.1" value={eta1} onChange={(e) => setEta1(+e.target.value)} />
        </Field>
        <Field label="η2">
          <input type="number" step="0.1" value={eta2} onChange={(e) => setEta2(+e.target.value)} />
        </Field>
        <Field label="α1 (анкеровка)">
          <input type="number" step="0.1" value={alpha1} onChange={(e) => setAlpha1(+e.target.value)} />
        </Field>
        <Field label="α2 (нахлестка)">
          <input type="number" step="0.1" value={alpha2} onChange={(e) => setAlpha2(+e.target.value)} />
        </Field>
        <Field label="As,cal, см²">
          <input type="number" step="0.01" value={AsCal} onChange={(e) => setAsCal(+e.target.value)} />
        </Field>
        <Field label="As,ef, см²">
          <input type="number" step="0.01" value={AsEf} onChange={(e) => setAsEf(+e.target.value)} />
        </Field>
      </div>
      <div className="results">
        <ResultRow label="l0,an" value={`${formatNum(r.l0an, 1)} мм`} />
        <ResultRow label="Rbond" value={`${formatNum(r.Rbond, 2)} кг/см²`} />
        <ResultRow label="Rs" value={`${formatNum(r.Rs, 2)} кг/см²`} />
        <ResultRow label="Использование As,cal/As,ef" value={formatNum(r.usage, 3)} />
        <ResultRow label="Итоговая анкеровка" value={`${formatNum(r.ankerFinal, 1)} мм`} primary />
        <ResultRow label="Итоговая нахлестка" value={`${formatNum(r.nakhlFinal, 1)} мм`} primary />
      </div>
      <div className="section">
        <h3>Справочные таблицы листа</h3>
        <DataTable rows={(anker.aoa as unknown[][]).slice(62, 120)} maxCols={14} />
      </div>
    </SheetShell>
  )
}
