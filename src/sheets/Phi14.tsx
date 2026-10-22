import { useMemo } from 'react'
import { formatNum } from '../lib/materials'
import { persistKey, usePersistedState } from '../lib/persist'
import { ResultRow } from '../components/DataTable'
import { Field, SheetShell } from './shared'

export function Phi14Sheet() {
  const [qNorm, setQNorm] = usePersistedState(persistKey('phi14', 'qNorm'), 200)
  const [area, setArea] = usePersistedState(persistKey('phi14', 'area'), 36.1)
  const [floors, setFloors] = usePersistedState(persistKey('phi14', 'floors'), 4)
  const [roomType, setRoomType] = usePersistedState<1 | 2>(persistKey('phi14', 'roomType'), 2)

  const r = useMemo(() => {
    const A = area
    const n = floors
    // AE9 = IF(Q4>9, 0.4+0.6/SQRT(Q4/9), 1)  → φ1
    const phi1 = A > 9 ? 0.4 + 0.6 / Math.sqrt(A / 9) : 1
    // AE13 = IF(Q4>36, 0.5+0.5/SQRT(Q4/36), 1) → φ2 for halls
    const phi2 = A > 36 ? 0.5 + 0.5 / Math.sqrt(A / 36) : 1
    // AE17 = 0.4+(AE9-0.4)/SQRT(K5) → φ3
    const phi3 = 0.4 + (phi1 - 0.4) / Math.sqrt(n)
    // AE21 = 0.5+(AE13-0.5)/SQRT(K5) → φ4
    const phi4 = 0.5 + (phi2 - 0.5) / Math.sqrt(n)

    // X7: IF(AD5=1, IF(Q4>9, AE9, AE8), IF(Q4>36, AE13, AE8))  AE8=1
    // AD5=1 living, AD5=2 halls
    let oneFloor: number
    let labelOne: string
    if (roomType === 1) {
      oneFloor = A > 9 ? phi1 : 1
      labelOne = A > 9 ? 'φ1' : 'φ'
    } else {
      oneFloor = A > 36 ? phi2 : 1
      labelOne = A > 36 ? 'φ2' : 'φ'
    }

    // X8: IF(AD5=1, AE17, AE21)
    const multi = roomType === 1 ? phi3 : phi4
    const labelMulti = roomType === 1 ? 'φ3' : 'φ4'
    const qReduced = qNorm * multi

    return { phi1, phi2, phi3, phi4, oneFloor, labelOne, multi, labelMulti, qReduced }
  }, [qNorm, area, floors, roomType])

  return (
    <SheetShell
      title="ϕ1…ф4"
      subtitle="Снижение временных нагрузок от нескольких перекрытий (п. 6.7–6.8 СП 20.13330)"
    >
      <div className="form-grid">
        <Field label="Нормативная временная нагрузка, кгс/м²">
          <input type="number" value={qNorm} onChange={(e) => setQNorm(+e.target.value)} />
        </Field>
        <Field label="Грузовая площадь A, м²">
          <input type="number" step="0.1" value={area} onChange={(e) => setArea(+e.target.value)} />
        </Field>
        <Field label="Количество перекрытий">
          <input type="number" value={floors} onChange={(e) => setFloors(+e.target.value)} />
        </Field>
        <Field label="Тип помещения">
          <select value={roomType} onChange={(e) => setRoomType(+e.target.value as 1 | 2)}>
            <option value={1}>Жилые и общественные (1, 2, 12а)</option>
            <option value={2}>Залы и производственные (4, 11, 12б)</option>
          </select>
        </Field>
      </div>
      <div className="results">
        <ResultRow label={`${r.labelOne} (одно перекрытие)`} value={formatNum(r.oneFloor, 6)} />
        <ResultRow label={`${r.labelMulti} (несколько)`} value={formatNum(r.multi, 6)} />
        <ResultRow label="φ1" value={formatNum(r.phi1, 6)} />
        <ResultRow label="φ2" value={formatNum(r.phi2, 6)} />
        <ResultRow label="φ3" value={formatNum(r.phi3, 6)} />
        <ResultRow label="φ4" value={formatNum(r.phi4, 6)} />
        <ResultRow
          label="Временная нагрузка с учётом сочетаний"
          value={`${formatNum(r.qReduced, 2)} кгс/м²`}
          primary
        />
      </div>
    </SheetShell>
  )
}
