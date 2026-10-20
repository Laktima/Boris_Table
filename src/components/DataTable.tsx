import { useMemo, useState } from 'react'

function cellStr(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).replace(/\r\n/g, '\n')
}

export function DataTable({
  rows,
  maxCols,
  searchable = true,
}: {
  rows: unknown[][]
  maxCols?: number
  searchable?: boolean
}) {
  const [q, setQ] = useState('')

  const cleaned = useMemo(() => {
    return rows
      .map((row) => {
        const r = maxCols ? row.slice(0, maxCols) : row
        while (r.length && (r[r.length - 1] === null || r[r.length - 1] === undefined || r[r.length - 1] === '')) {
          r.pop()
        }
        return r
      })
      .filter((r) => r.some((c) => c !== null && c !== undefined && c !== ''))
  }, [rows, maxCols])

  const filtered = useMemo(() => {
    if (!q.trim()) return cleaned
    const needle = q.trim().toLowerCase()
    return cleaned.filter((r) => r.some((c) => cellStr(c).toLowerCase().includes(needle)))
  }, [cleaned, q])

  const colCount = Math.max(1, ...filtered.map((r) => r.length), 1)

  return (
    <div>
      {searchable && (
        <div className="toolbar">
          <input
            className="search-input"
            style={{ maxWidth: 320 }}
            placeholder="Поиск…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className="badge">{filtered.length} строк</span>
        </div>
      )}
      <div className="table-wrap">
        <table className="data-table">
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i}>
                {Array.from({ length: colCount }, (_, j) => (
                  <td key={j} style={{ whiteSpace: 'pre-wrap' }}>
                    {cellStr(row[j])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ResultRow({
  label,
  value,
  primary,
}: {
  label: string
  value: string | number
  primary?: boolean
}) {
  return (
    <div className={`result-card ${primary ? 'primary' : ''}`}>
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  )
}
