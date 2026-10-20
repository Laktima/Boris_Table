import { useCallback, useEffect, useRef, useState } from 'react'
import { evaluateExpression, formatResult } from '../lib/math'

const HISTORY_KEY = 'boris-calc-history'

type HistItem = { expr: string; result: string }

function loadHistory(): HistItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HistItem[]
    return Array.isArray(parsed) ? parsed.slice(0, 3) : []
  } catch {
    return []
  }
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (el.isContentEditable) return true
  return Boolean(el.closest('input, textarea, select, [contenteditable="true"]'))
}

/** Число из буфера: пробелы ок, запятая → точка */
function parsePastedNumber(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s/g, '').replace(',', '.')
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n)) return null
  return formatResult(n)
}

export function Calculator() {
  const [expr, setExpr] = useState('')
  const [display, setDisplay] = useState('0')
  const [error, setError] = useState('')
  const [history, setHistory] = useState<HistItem[]>(loadHistory)
  const exprRef = useRef(expr)
  exprRef.current = expr

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 3)))
  }, [history])

  const append = useCallback((ch: string) => {
    setError('')
    setExpr((e) => {
      const next = e + ch
      setDisplay(next || '0')
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setExpr('')
    setDisplay('0')
    setError('')
  }, [])

  const backspace = useCallback(() => {
    setError('')
    setExpr((e) => {
      const next = e.slice(0, -1)
      setDisplay(next || '0')
      return next
    })
  }, [])

  const equals = useCallback(() => {
    const current = exprRef.current
    try {
      const value = evaluateExpression(current)
      const result = formatResult(value)
      setDisplay(result)
      setHistory((h) => [{ expr: current, result }, ...h].slice(0, 3))
      setExpr(result)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    }
  }, [])

  const setFromPaste = useCallback((raw: string) => {
    const num = parsePastedNumber(raw)
    if (num !== null) {
      setExpr(num)
      setDisplay(num)
      setError('')
      return
    }
    setExpr('')
    setDisplay('0')
    setError('ошибка!')
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return

      const key = e.key
      if (key >= '0' && key <= '9') {
        e.preventDefault()
        append(key)
        return
      }
      if (key === '.' || key === ',') {
        e.preventDefault()
        append('.')
        return
      }
      if (key === '+' || key === '-' || key === '*' || key === '/') {
        e.preventDefault()
        append(key)
        return
      }
      if (key === '(' || key === ')') {
        e.preventDefault()
        append(key)
        return
      }
      if (key === 'Enter' || key === '=') {
        e.preventDefault()
        equals()
        return
      }
      if (key === 'Backspace') {
        e.preventDefault()
        backspace()
        return
      }
      if (key === 'Escape' || key === 'Delete') {
        e.preventDefault()
        clear()
        return
      }
      if (e.code === 'NumpadMultiply') {
        e.preventDefault()
        append('*')
      } else if (e.code === 'NumpadDivide') {
        e.preventDefault()
        append('/')
      } else if (e.code === 'NumpadAdd') {
        e.preventDefault()
        append('+')
      } else if (e.code === 'NumpadSubtract') {
        e.preventDefault()
        append('-')
      } else if (e.code === 'NumpadDecimal') {
        e.preventDefault()
        append('.')
      } else if (e.code === 'NumpadEnter') {
        e.preventDefault()
        equals()
      }
    }

    const onPaste = (e: ClipboardEvent) => {
      // В полях ввода (комментарии чек-листов и т.п.) — обычная вставка
      if (isTypingTarget(e.target)) return
      const text = e.clipboardData?.getData('text/plain') ?? ''
      if (!text) return
      e.preventDefault()
      setFromPaste(text)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('paste', onPaste)
    }
  }, [append, backspace, clear, equals, setFromPaste])

  const useHist = (item: HistItem) => {
    setExpr(item.result)
    setDisplay(item.result)
    setError('')
  }

  const keys: { label: string; action: () => void; className?: string }[] = [
    { label: 'C', action: clear, className: 'fn' },
    { label: '(', action: () => append('('), className: 'fn' },
    { label: ')', action: () => append(')'), className: 'fn' },
    { label: '⌫', action: backspace, className: 'fn' },
    { label: '7', action: () => append('7') },
    { label: '8', action: () => append('8') },
    { label: '9', action: () => append('9') },
    { label: '÷', action: () => append('/'), className: 'op' },
    { label: '4', action: () => append('4') },
    { label: '5', action: () => append('5') },
    { label: '6', action: () => append('6') },
    { label: '×', action: () => append('*'), className: 'op' },
    { label: '1', action: () => append('1') },
    { label: '2', action: () => append('2') },
    { label: '3', action: () => append('3') },
    { label: '−', action: () => append('-'), className: 'op' },
    { label: '0', action: () => append('0') },
    { label: '.', action: () => append('.') },
    { label: '+', action: () => append('+'), className: 'op' },
    { label: '=', action: equals, className: 'eq' },
  ]

  return (
    <div className="calc">
      <div className="calc-display">
        <div className="calc-expr">{error || expr || ' '}</div>
        <div className="calc-value">{display}</div>
      </div>
      <div className="calc-grid">
        {keys.map((k, i) => (
          <button
            key={`${k.label}-${i}`}
            type="button"
            className={`calc-btn ${k.className ?? ''}`}
            onClick={k.action}
          >
            {k.label}
          </button>
        ))}
      </div>
      <div className="calc-history">
        <h4>Последние 3</h4>
        {history.length === 0 ? (
          <div className="hist-empty">Пока пусто</div>
        ) : (
          history.map((h, i) => (
            <button key={i} type="button" className="hist-item" onClick={() => useHist(h)}>
              {h.expr} = {h.result}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
