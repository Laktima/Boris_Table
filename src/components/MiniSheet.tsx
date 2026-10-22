import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { evaluateExpression, formatResult } from '../lib/math'
import { setFormulaAppender } from '../lib/formulaPick'
import { persistKey, usePersistedState } from '../lib/persist'

const COLS = ['A', 'B', 'C', 'D'] as const
const ROWS = [1, 2, 3, 4] as const

type CellId = `${(typeof COLS)[number]}${(typeof ROWS)[number]}`
type Cells = Record<CellId, string>

function emptyCells(): Cells {
  const out = {} as Cells
  for (const c of COLS) {
    for (const r of ROWS) {
      out[`${c}${r}`] = ''
    }
  }
  return out
}

const REF_RE = /[A-Da-d][1-4]/g

function parsePlainNumber(raw: string): number | null {
  const t = raw.trim().replace(/\s/g, '').replace(',', '.')
  if (!t) return null
  if (!/^-?\d+(\.\d+)?$/.test(t)) return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

/** Вычислить значение ячейки (число / текст / формула =… со ссылками A1–D4). */
function evalCell(
  id: CellId,
  cells: Cells,
  stack: Set<string>,
): { ok: true; text: string; num: number | null } | { ok: false; text: string } {
  const raw = (cells[id] ?? '').trim()
  if (!raw) return { ok: true, text: '', num: null }

  if (!raw.startsWith('=')) {
    const n = parsePlainNumber(raw)
    if (n !== null) return { ok: true, text: formatResult(n), num: n }
    return { ok: true, text: raw, num: null }
  }

  if (stack.has(id)) return { ok: false, text: '#ЦИКЛ!' }
  stack.add(id)

  try {
    let expr = raw.slice(1).replace(/,/g, '.')
    expr = expr.replace(REF_RE, (m) => {
      const ref = m.toUpperCase() as CellId
      const v = evalCell(ref, cells, stack)
      if (!v.ok) throw new Error(v.text)
      if (v.num === null) throw new Error('#ЗНАЧ!')
      return `(${v.num})`
    })
    const n = evaluateExpression(expr)
    return { ok: true, text: formatResult(n), num: n }
  } catch (e) {
    const msg = e instanceof Error ? e.message : '#ОШИБ!'
    if (msg.startsWith('#')) return { ok: false, text: msg }
    return { ok: false, text: '#ОШИБ!' }
  } finally {
    stack.delete(id)
  }
}

export function MiniSheet() {
  const [cells, setCells] = usePersistedState<Cells>(
    persistKey('mini-sheet', 'cells'),
    emptyCells(),
  )
  const [editing, setEditing] = useState<CellId | null>(null)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const editingRef = useRef(editing)
  const draftRef = useRef(draft)
  const suppressBlurRef = useRef(false)
  editingRef.current = editing
  draftRef.current = draft

  const display = useMemo(() => {
    const map = {} as Record<CellId, { text: string; error: boolean }>
    for (const c of COLS) {
      for (const r of ROWS) {
        const id = `${c}${r}` as CellId
        const v = evalCell(id, cells, new Set())
        map[id] = { text: v.text, error: !v.ok }
      }
    }
    return map
  }, [cells])

  const pickingFormula = Boolean(editing && draft.startsWith('='))

  const appendToken = (token: string) => {
    setDraft((d) => d + token)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  // Регистрация для кликов по копируемым значениям на вкладках
  useEffect(() => {
    setFormulaAppender((token) => {
      if (!editingRef.current) return false
      if (!draftRef.current.startsWith('=')) return false
      suppressBlurRef.current = true
      appendToken(token)
      return true
    })
    return () => setFormulaAppender(null)
  }, [])

  // mousedown: вставка ссылки/значения до blur, как в Excel
  useEffect(() => {
    if (!editing) return

    const onMouseDown = (e: MouseEvent) => {
      if (!draftRef.current.startsWith('=')) return
      const t = e.target as HTMLElement | null
      if (!t) return
      if (t.closest('.mini-sheet-input')) return

      const cellEl = t.closest('[data-cell-ref]') as HTMLElement | null
      if (cellEl) {
        const ref = cellEl.getAttribute('data-cell-ref')
        if (ref && ref !== editingRef.current) {
          e.preventDefault()
          suppressBlurRef.current = true
          appendToken(ref)
        }
        return
      }

      const copyEl = t.closest('[data-copy-value]') as HTMLElement | null
      if (copyEl) {
        const val = copyEl.getAttribute('data-copy-value')
        if (val) {
          e.preventDefault()
          suppressBlurRef.current = true
          copyEl.dataset.formulaPicked = '1'
          appendToken(val)
        }
      }
    }

    document.addEventListener('mousedown', onMouseDown, true)
    return () => document.removeEventListener('mousedown', onMouseDown, true)
  }, [editing])

  const startEdit = (id: CellId) => {
    setEditing(id)
    setDraft(cells[id] ?? '')
    requestAnimationFrame(() => inputRef.current?.select())
  }

  const commit = () => {
    if (!editing) return
    const id = editing
    const value = draftRef.current
    setCells((prev) => ({ ...prev, [id]: value }))
    setEditing(null)
  }

  const onBlur = () => {
    window.setTimeout(() => {
      if (suppressBlurRef.current) {
        suppressBlurRef.current = false
        inputRef.current?.focus()
        return
      }
      commit()
    }, 0)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setEditing(null)
    }
  }

  return (
    <div className={`mini-sheet${pickingFormula ? ' is-picking' : ''}`}>
      <div className="mini-sheet-head">
        <h4>Блокнот</h4>
        <span className="mini-sheet-hint">
          {pickingFormula ? 'клик по ячейке или значению' : '=A1+B2'}
        </span>
      </div>
      <table className="mini-sheet-table">
        <thead>
          <tr>
            <th className="mini-sheet-corner" />
            {COLS.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r}>
              <th>{r}</th>
              {COLS.map((c) => {
                const id = `${c}${r}` as CellId
                const isEdit = editing === id
                const shown = display[id]
                return (
                  <td key={id} className={shown.error ? 'is-error' : undefined}>
                    {isEdit ? (
                      <input
                        ref={inputRef}
                        className="mini-sheet-input"
                        value={draft}
                        autoFocus
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={onBlur}
                        onKeyDown={onKeyDown}
                      />
                    ) : (
                      <button
                        type="button"
                        className="mini-sheet-cell"
                        data-cell-ref={id}
                        title={cells[id] || undefined}
                        onClick={() => {
                          if (editing && draftRef.current.startsWith('=') && editing !== id) {
                            return
                          }
                          startEdit(id)
                        }}
                      >
                        {shown.text}
                      </button>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
