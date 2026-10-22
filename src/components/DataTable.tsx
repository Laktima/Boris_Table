import { useMemo, useState } from 'react'
import { tryAppendToFormula } from '../lib/formulaPick'

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

/** Вынести ведущий «1. » из первой ячейки в отдельный столбец № */
function withNumberColumn(rows: unknown[][]): unknown[][] {
  return rows.map((row, idx) => {
    const first = cellStr(row[0])
    const m = first.match(/^(\d+)\.\s*/)
    if (m) {
      return [m[1], first.slice(m[0].length), ...row.slice(1)]
    }
    if (idx === 0) {
      return ['№', ...row]
    }
    return ['', ...row]
  })
}

export function DataTable({
  rows,
  maxCols,
  searchable = true,
  copyOnClick = false,
  showCount = true,
  striped = false,
  verticalBorders = false,
  numberColumn = false,
}: {
  rows: unknown[][]
  maxCols?: number
  searchable?: boolean
  /** Клик по ячейке копирует значение в буфер */
  copyOnClick?: boolean
  /** Показывать «N строк» рядом с поиском */
  showCount?: boolean
  /** Чередование фона строк */
  striped?: boolean
  /** Вертикальные разделители колонок */
  verticalBorders?: boolean
  /** Слева столбец с номерами пунктов (из «1. …» в первой ячейке) */
  numberColumn?: boolean
}) {
  const [q, setQ] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const cleaned = useMemo(() => {
    let list = rows
      .map((row) => {
        const r = maxCols ? row.slice(0, maxCols) : [...row]
        while (
          r.length &&
          (r[r.length - 1] === null ||
            r[r.length - 1] === undefined ||
            r[r.length - 1] === '')
        ) {
          r.pop()
        }
        return r
      })
      .filter((r) => r.some((c) => c !== null && c !== undefined && c !== ''))

    if (numberColumn) {
      list = withNumberColumn(list)
    }
    return list
  }, [rows, maxCols, numberColumn])

  const filtered = useMemo(() => {
    if (!cleaned.length) return cleaned
    const [header, ...body] = cleaned
    if (!q.trim()) return cleaned
    const needle = q.trim().toLowerCase()
    const bodyHit = body.filter((r) =>
      r.some((c) => cellStr(c).toLowerCase().includes(needle)),
    )
    return [header, ...bodyHit]
  }, [cleaned, q])

  const colCount = Math.max(1, ...filtered.map((r) => r.length), 1)

  const onCopy = async (text: string) => {
    if (!text) return
    if (tryAppendToFormula(text)) return
    const ok = await copyText(text)
    if (ok) {
      setCopied(text)
      window.setTimeout(() => setCopied((c) => (c === text ? null : c)), 1400)
    }
  }

  const tableClass = [
    'data-table',
    copyOnClick ? 'data-table-copy' : '',
    striped ? 'data-table-striped' : '',
    verticalBorders ? 'data-table-vborders' : '',
    numberColumn ? 'data-table-numbered' : '',
  ]
    .filter(Boolean)
    .join(' ')

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
          {showCount ? (
            <span className="badge">{filtered.length} строк</span>
          ) : null}
        </div>
      )}
      {copyOnClick && copied && (
        <div className="toolbar">
          <span className="copy-toast">Скопировано: {copied}</span>
        </div>
      )}
      <div className="table-wrap">
        <table className={tableClass}>
          <tbody>
            {filtered.map((row, i) => {
              const isHeader = i === 0
              return (
                <tr
                  key={i}
                  className={isHeader ? 'is-header' : undefined}
                >
                  {Array.from({ length: colCount }, (_, j) => {
                    const text = cellStr(row[j])
                    const numCell = numberColumn && j === 0
                    if (copyOnClick && text && !isHeader && !numCell) {
                      return (
                        <td
                          key={j}
                          className={numCell ? 'col-num' : undefined}
                          style={{ whiteSpace: 'pre-wrap' }}
                        >
                          <button
                            type="button"
                            className={`cell-copy ${copied === text ? 'copied' : ''}`}
                            data-copy-value={text}
                            title="Клик — скопировать"
                            onClick={(e) => {
                              if (e.currentTarget.dataset.formulaPicked === '1') {
                                delete e.currentTarget.dataset.formulaPicked
                                return
                              }
                              void onCopy(text)
                            }}
                          >
                            {text}
                          </button>
                        </td>
                      )
                    }
                    return (
                      <td
                        key={j}
                        className={numCell ? 'col-num' : undefined}
                        style={{ whiteSpace: 'pre-wrap' }}
                      >
                        {text}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
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
