import { useMemo, useState } from 'react'
import {
  blockToLiraClipboard,
  parseArmScaleBlocks,
  type ScaleBlock,
} from '../lib/armScales'
import { SheetShell } from './shared'

function formatArea(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return '—'
  return String(v).replace(',', '.')
}

export function ArmShkalSheet() {
  const blocks = useMemo(() => parseArmScaleBlocks(), [])
  const sections = useMemo(() => {
    const map = new Map<string, ScaleBlock[]>()
    for (const b of blocks) {
      const list = map.get(b.section) ?? []
      list.push(b)
      map.set(b.section, list)
    }
    return [...map.entries()]
  }, [blocks])

  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return sections
    return sections
      .map(([section, list]) => [
        section,
        list.filter(
          (b) =>
            b.title.toLowerCase().includes(needle) ||
            b.rangeLabel.toLowerCase().includes(needle) ||
            b.entries.some((e) => e.code.toLowerCase().includes(needle)),
        ),
      ] as const)
      .filter(([, list]) => list.length > 0)
  }, [sections, q])

  async function copyBlock(block: ScaleBlock) {
    const text = blockToLiraClipboard(block)
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(block.id)
      window.setTimeout(() => setCopiedId(null), 1800)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopiedId(block.id)
      window.setTimeout(() => setCopiedId(null), 1800)
    }
  }

  return (
    <SheetShell
      title="Арм шкал"
      subtitle="Блоки шкал как в Excel — копируйте целиком и вставляйте в «Параметры шкалы» ЛираСАПР (вкладка Диапазоны)."
    >
      <div className="arm-toolbar">
        <input
          className="arm-search"
          type="search"
          placeholder="Поиск: s200d16, стены, B6…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <p className="arm-hint">
          Кнопка «Копировать блок» кладёт в буфер две колонки через Tab (код и
          площадь) — тот же формат, что принимает таблица диапазонов ЛираСАПР.
        </p>
      </div>

      {filtered.map(([section, list]) => (
        <section key={section} className="arm-section">
          <h3 className="arm-section-title">{section}</h3>
          <div className="arm-blocks">
            {list.map((block) => (
              <article key={block.id} className="arm-block">
                <header className="arm-block-head">
                  <div>
                    <h4 className="arm-block-title">{block.title}</h4>
                    <span className="arm-block-range">{block.rangeLabel}</span>
                  </div>
                  <button
                    type="button"
                    className="arm-copy-btn"
                    onClick={() => void copyBlock(block)}
                  >
                    {copiedId === block.id
                      ? 'Скопировано'
                      : 'Копировать блок для ЛираСАПР'}
                  </button>
                </header>
                <div className="arm-table-wrap">
                  <table className="arm-table">
                    <thead>
                      <tr>
                        <th>Шкала</th>
                        <th>Площадь</th>
                      </tr>
                    </thead>
                    <tbody>
                      {block.entries.map((e, i) => (
                        <tr key={`${block.id}-${i}`}>
                          <td className="arm-code">{e.code}</td>
                          <td className="arm-area">{formatArea(e.area)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </SheetShell>
  )
}
