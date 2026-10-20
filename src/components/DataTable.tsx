import { useMemo, useState } from 'react'

function cellStr(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).replace(/\r\n/g, '\n')
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  }
}

export function DataTable({
  rows,
  maxCols,
  searchable = true,
  copyOnClick = false,
}: {
  rows: unknown[][]
  maxCols?: number
  searchable?: boolean
  /** Клик по ячейке копирует значение в буфер */
  copyOnClick?: boolean
}) {
  const [q, setQ] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const cleaned = useMemo(() => {
    return rows
      .map((row) => {
        const r = maxCols ? row.slice(0, maxCols) : [...row]
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

  const onCopy = async (text: string) => {
    if (!text) return
    const ok = await copyText(text)
    if (ok) {
      setCopied(text)
      window.setTimeout(() => setCopied((c) => (c === text ? null : c)), 1400)
    }
  }

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
      {copyOnClick && copied && (
        <div className="toolbar">
          <span className="copy-toast">Скопировано: {copied}</span>
        </div>
      )}
      <div className="table-wrap">
        <table className={`data-table ${copyOnClick ? 'data-table-copy' : ''}`}>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i}>
                {Array.from({ length: colCount }, (_, j) => {
                  const text = cellStr(row[j])
                  const isHeader = i === 0
                  if (copyOnClick && text && !isHeader) {
                    return (
                      <td key={j} style={{ whiteSpace: 'pre-wrap' }}>
                        <button
                          type="button"
                          className={`cell-copy ${copied === text ? 'copied' : ''}`}
                          title="Клик — скопировать"
                          onClick={() => onCopy(text)}
                        >
                          {text}
                        </button>
                      </td>
                    )
                  }
                  return (
                    <td key={j} style={{ whiteSpace: 'pre-wrap' }}>
                      {text}
                    </td>
                  )
                })}
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
