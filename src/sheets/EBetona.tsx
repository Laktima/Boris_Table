import { useMemo } from 'react'
import { CONCRETE_RB, REBAR_SORTAMENT, formatNum } from '../lib/materials'
import { persistKey, usePersistedState } from '../lib/persist'
import { DataTable } from '../components/DataTable'
import { Field, SheetShell } from './shared'

/** Точный перевод МПа → т/м² */
const FACTOR_EXACT = 101.971621
/** Округлённый перевод */
const FACTOR_ROUND = 100

/** Марки из таблицы B16:K33 */
const TABLE_MARKS = ['B20', 'B25', 'B30', 'B35', 'B40', 'B45', 'B50', 'B55', 'B60'] as const

type RoundMode = 'exact' | 'round'

function toTs(mpa: number, factor: number) {
  return mpa * factor
}

export function EBetonaSheet() {
  const [klass, setKlass] = usePersistedState(persistKey('e-betona', 'klass'), 'B25')
  const [roundMode, setRoundMode] = usePersistedState<RoundMode>(
    persistKey('e-betona', 'roundMode'),
    'exact',
  )
  const data = CONCRETE_RB[klass] ?? CONCRETE_RB.B25
  const factor = roundMode === 'round' ? FACTOR_ROUND : FACTOR_EXACT

  /** Характеристики выбранного класса: обозначение / МПа / т/м² */
  const classRows = useMemo(() => {
    const { Eb, Rb, Rbt } = data
    const row = (
      label: string,
      mpa: number,
      mpaDigits = 2,
      tsDigits = 1,
    ): (string | number)[] => [
      label,
      formatNum(mpa, mpaDigits),
      formatNum(toTs(mpa, factor), tsDigits),
    ]
    const ratio = (label: string, value: number): (string | number)[] => [
      label,
      formatNum(value, 3),
      formatNum(value, 3),
    ]
    return [
      ['Обозначение', 'МПа', 'т/м²'],
      row('Eb', Eb, 0, 0),
      row('0,6 Eb (верт.)', Eb * 0.6, 0, 0),
      row('0,3 Eb (гориз.)', Eb * 0.3, 0, 0),
      row('0,2 Eb (гориз.)', Eb * 0.2, 0, 0),
      row('0,85 Eb', Eb * 0.85, 0, 0),
      row('Rb', Rb, 2, 1),
      row('0,85·Rb', Rb * 0.85, 2, 1),
      row('Rbt', Rbt, 2, 2),
      row('0,3·Rb', Rb * 0.3, 2, 1),
      row('0,85·0,3·Rb', Rb * 0.85 * 0.3, 2, 1),
      ratio('0,3·Rb/Rbt', (Rb * 0.3) / Rbt),
      ratio('0,85·0,3·Rb/Rbt', (Rb * 0.85 * 0.3) / Rbt),
      row('2,5·Rbt', Rbt * 2.5, 2, 1),
      row('3,5·Rbt', Rbt * 3.5, 2, 1),
    ]
  }, [data, factor])

  const tableRows = useMemo(() => {
    const marks = TABLE_MARKS.map((m) => CONCRETE_RB[m])
    const ebTs = marks.map((m) => toTs(m.Eb, factor))
    const rbTs = marks.map((m) => toTs(m.Rb, factor))
    const rbtTs = marks.map((m) => toTs(m.Rbt, factor))

    const fmt0 = (n: number) => formatNum(n, 0)
    const fmt2 = (n: number) => formatNum(n, 2)
    const fmt3 = (n: number) => formatNum(n, 3)

    const header = ['Марка бетона', ...TABLE_MARKS.map((m) => m.replace('B', 'В'))]
    return [
      header,
      ['Eb т/м²', ...ebTs.map(fmt0)],
      ['0,6 Eb', ...ebTs.map((e) => fmt0(e * 0.6))],
      ['0,3 Eb', ...ebTs.map((e) => fmt0(e * 0.3))],
      ['0,2 Eb', ...ebTs.map((e) => fmt0(e * 0.2))],
      ['0,85 Eb', ...ebTs.map((e) => fmt0(e * 0.85))],
      ['Rb', ...rbTs.map(fmt0)],
      ['0,85·Rb', ...rbTs.map((r) => fmt2(r * 0.85))],
      ['Rbt', ...rbtTs.map(fmt0)],
      ['0,3·Rb', ...rbTs.map((r) => fmt2(r * 0.3))],
      ['0,85·0,3·Rb', ...rbTs.map((r) => fmt2(r * 0.85 * 0.3))],
      ['0,3·Rb/Rbt', ...rbTs.map((r, i) => fmt3((r * 0.3) / rbtTs[i]))],
      ['0,85·0,3·Rb/Rbt', ...rbTs.map((r, i) => fmt3((r * 0.85 * 0.3) / rbtTs[i]))],
      ['2,5·Rbt', ...rbtTs.map((r) => formatNum(r * 2.5, 1))],
      ['3,5·Rbt', ...rbtTs.map((r) => formatNum(r * 3.5, 1))],
    ]
  }, [factor])

  return (
    <SheetShell
      title="Харак-ки бетона"
      subtitle="Модули упругости, характеристики бетона и сортамент арматуры"
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
        <Field label="Перевод МПа → т/м²">
          <select
            value={roundMode}
            onChange={(e) => setRoundMode(e.target.value as RoundMode)}
          >
            <option value="exact">Без округления (1 МПа = 101,971621 т/м²)</option>
            <option value="round">С округлением (1 МПа = 100 т/м²)</option>
          </select>
        </Field>
      </div>

      <div className="section" style={{ marginTop: 8 }}>
        <h3>Характеристики бетона</h3>
        <DataTable searchable={false} copyOnClick rows={classRows} />
      </div>

      <div className="section">
        <h3>Таблица бетонов</h3>
        <DataTable searchable={false} copyOnClick rows={tableRows} />
      </div>

      <div className="section">
        <h3>Сортамент арматуры</h3>
        <DataTable
          searchable={false}
          copyOnClick
          rows={[
            ['Диаметр мм', 'Площадь см²', 'Вес кг/м'],
            ...REBAR_SORTAMENT.map((r) => [r.d, r.area, r.weight]),
          ]}
        />
      </div>
    </SheetShell>
  )
}
