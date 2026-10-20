import { useMemo, useState } from 'react'
import arm from '../data/arm-shkal.json'
import { SheetShell } from './shared'

const SCALE_RE = /^s\d+d\d+/i

type ScaleRow = {
  code: string
  area: string
  group: string
}

function extractScales(aoa: unknown[][]): ScaleRow[] {
  const rows: ScaleRow[] = []
  let group = 'Шкала'
  let headers: (string | null)[] = []

  for (const raw of aoa) {
    const row = raw as unknown[]
    const nonEmpty = row
      .map((v, i) => ({ i, v }))
      .filter(({ v }) => v !== null && v !== undefined && v !== '')

    // Section / group titles (few text cells, no scale codes)
    const texts = nonEmpty.filter(({ v }) => typeof v === 'string' && !SCALE_RE.test(String(v)))
    const hasScale = nonEmpty.some(({ v }) => typeof v === 'string' && SCALE_RE.test(String(v)))

    if (!hasScale && texts.length > 0 && texts.length <= 4) {
      const title = texts.map(({ v }) => String(v)).join(' · ')
      if (title.length > 2 && !/^Sсм/i.test(title)) {
        group = title.replace(/\r\n/g, ' ')
        headers = row.map((v) => (typeof v === 'string' ? v : null))
      }
      continue
    }

    if (!hasScale) {
      // column headers like "Фон ф16 шаг 250"
      if (texts.length >= 1) {
        headers = row.map((v) => (typeof v === 'string' ? v : null))
      }
      continue
    }

    for (let i = 0; i < row.length; i++) {
      const v = row[i]
      if (typeof v !== 'string' || !SCALE_RE.test(v)) continue
      const next = row[i + 1] ?? row[i + 2]
      const area =
        typeof next === 'number'
          ? String(next)
          : typeof next === 'string' && /^-?\d/.test(next)
            ? next
            : ''
      const colHeader = headers[i] ?? ''
      rows.push({
        code: v.trim(),
        area,
        group: colHeader ? `${group} / ${colHeader}` : group,
      })
    }
  }

  // unique by code+group
  const seen = new Set<string>()
  return rows.filter((r) => {
    const k = `${r.group}::${r.code}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
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

export function ArmShkalSheet() {
  const scales = useMemo(() => extractScales(arm.aoa as unknown[][]), [])
  const [q, setQ] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [groupFilter, setGroupFilter] = useState('Все')

  const groups = useMemo(() => {
    const set = new Set(scales.map((s) => s.group.split(' / ')[0]))
    return ['Все', ...Array.from(set)]
  }, [scales])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return scales.filter((s) => {
      if (groupFilter !== 'Все' && !s.group.startsWith(groupFilter)) return false
      if (!needle) return true
      return s.code.toLowerCase().includes(needle) || s.group.toLowerCase().includes(needle)
    })
  }, [scales, q, groupFilter])

  const onCopy = async (code: string) => {
    const ok = await copyText(code)
    if (ok) {
      setCopied(code)
      window.setTimeout(() => setCopied((c) => (c === code ? null : c)), 1600)
    }
  }

  return (
    <SheetShell
      title="Арм шкал"
      subtitle="Клик по коду копирует шкалу в буфер — вставьте в ЛираСАПР (Ctrl/⌘+V)."
    >
      <div className="toolbar">
        <input
          className="search-input"
          style={{ maxWidth: 280 }}
          placeholder="Поиск: s250d20…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="badge">{filtered.length}</span>
        {copied && <span className="copy-toast">Скопировано: {copied}</span>}
      </div>

      <div className="pill-row">
        {groups.map((g) => (
          <button
            key={g}
            type="button"
            className={`pill ${groupFilter === g ? 'active' : ''}`}
            onClick={() => setGroupFilter(g)}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="scale-grid">
        {filtered.map((s) => (
          <button
            key={`${s.group}-${s.code}`}
            type="button"
            className={`scale-chip ${copied === s.code ? 'copied' : ''}`}
            onClick={() => onCopy(s.code)}
            title={`Копировать «${s.code}» для ЛираСАПР`}
          >
            <code className="scale-code">{s.code}</code>
            <span className="scale-meta">
              {s.area ? `${s.area} см²` : '—'}
              <span className="scale-group">{s.group}</span>
            </span>
          </button>
        ))}
      </div>
    </SheetShell>
  )
}
