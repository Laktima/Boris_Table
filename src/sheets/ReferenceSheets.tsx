import analiz from '../data/analiz-shem.json'
import mufty from '../data/mufty.json'
import ogon from '../data/ogon-plit.json'
import { DataTable } from '../components/DataTable'
import { SheetShell } from './shared'

export function AnalizShemSheet() {
  return (
    <SheetShell title="Анализ схем" subtitle="Сочетания нагрузок и контролируемые значения">
      <DataTable rows={analiz.aoa as unknown[][]} />
    </SheetShell>
  )
}

export function MuftySheet() {
  const rows = (mufty.aoa as unknown[][]).map((r) =>
    r.map((c) => {
      if (typeof c === 'string' && c.startsWith('http')) {
        return c
      }
      return c
    }),
  )
  return (
    <SheetShell title="Муфты" subtitle="Типы муфт и ссылки на производителей">
      <div className="link-list">
        <DataTable rows={rows} searchable={false} />
      </div>
      <ul className="link-list" style={{ marginTop: 16, lineHeight: 1.8 }}>
        <li>
          <a href="https://ru.sormat.com/" target="_blank" rel="noreferrer">
            Sormat
          </a>
        </li>
        <li>
          <a href="https://fischer-market.ru/" target="_blank" rel="noreferrer">
            Fischer
          </a>
        </li>
        <li>
          <a href="http://www.mkt-anker.ru/" target="_blank" rel="noreferrer">
            MKT
          </a>
        </li>
      </ul>
    </SheetShell>
  )
}

export function OgonPlitSheet() {
  return (
    <SheetShell
      title="Огонь плит"
      subtitle="Несущая способность плит при огневом воздействии — справочные таблицы"
    >
      <DataTable rows={ogon.aoa as unknown[][]} />
    </SheetShell>
  )
}
