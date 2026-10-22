import { useMemo } from 'react'
import { formatNum } from '../lib/materials'
import { persistKey, usePersistedState } from '../lib/persist'
import { DataTable, ResultRow } from '../components/DataTable'
import { Field, SheetShell } from './shared'

const LINKS = ['Не раскреплена', 'С одной стороны', 'С двух сторон'] as const

function etaBraced(r: number) {
  return (r / 3) * (2 - r / 3)
}
function etaCantilever(r: number) {
  return ((2 * r) / 3) * (2 - (2 * r) / 3)
}

export function Fi3Sheet() {
  const [H0, setH0] = usePersistedState(persistKey('fi3', 'H0'), 5280)
  const [d, setD] = usePersistedState(persistKey('fi3', 'd'), 2000)
  const [link, setLink] = usePersistedState<(typeof LINKS)[number]>(
    persistKey('fi3', 'link'),
    'С одной стороны',
  )

  const calc = useMemo(() => {
    const ratio = d / H0
    let l0: number
    if (link === 'Не раскреплена') l0 = 0.8
    else if (link === 'С двух сторон') l0 = etaBraced(ratio) * 0.8
    else l0 = etaCantilever(ratio) * 0.8
    return { ratio, l0 }
  }, [H0, d, link])

  const table = Array.from({ length: 15 }, (_, i) => {
    const r = i * 0.2
    return [formatNum(r, 1), formatNum(etaBraced(r), 4), r <= 1.4 ? formatNum(etaCantilever(r), 4) : '—']
  })

  return (
    <SheetShell
      title="Фи3Раскрепление"
      subtitle="СП 335.1325800.2017 — коэффициент расчётной высоты для крупнопанельных систем"
    >
      <div className="form-grid">
        <Field label="H0 — высота этажа в свету">
          <input type="number" value={H0} onChange={(e) => setH0(+e.target.value)} />
        </Field>
        <Field label="d — длина простенка">
          <input type="number" value={d} onChange={(e) => setD(+e.target.value)} />
        </Field>
        <Field label="Связи">
          <select value={link} onChange={(e) => setLink(e.target.value as (typeof LINKS)[number])}>
            {LINKS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="results">
        <ResultRow label="d/H0" value={formatNum(calc.ratio, 6)} />
        <ResultRow label="l0 — коэф. расчётной высоты" value={formatNum(calc.l0, 6)} primary />
      </div>
      <div className="section">
        <h3>Таблица ηw</h3>
        <DataTable searchable={false} rows={[['d/H0', 'раскрепленная', 'консольная'], ...table]} />
      </div>
    </SheetShell>
  )
}
