import { useMemo, useState } from 'react'
import { persistKey, usePersistedState } from '../lib/persist'
import {
  ARM_SECTIONS,
  blockStartRow,
  blockToLiraClipboard,
  parseArmScaleBlocks,
  type ScaleBlock,
} from '../lib/armScales'
import { Field, SheetShell } from './shared'

type FilterId = 'all' | 'fp' | 'pp' | 'walls'

const FILTERS: { id: FilterId; label: string; sectionKey?: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'fp', label: 'Фундаментные плиты', sectionKey: ARM_SECTIONS.fp },
  { id: 'pp', label: 'Плиты перекрытия', sectionKey: ARM_SECTIONS.pp },
  { id: 'walls', label: 'Стены', sectionKey: ARM_SECTIONS.walls },
]

const SECTION_LABEL: Record<string, string> = {
  [ARM_SECTIONS.fp]: 'Фундаментные плиты',
  [ARM_SECTIONS.pp]: 'Плиты перекрытия',
  [ARM_SECTIONS.walls]: 'Стены',
}

type BlockPair = [ScaleBlock | null, ScaleBlock | null]

function formatArea(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return '—'
  return String(v).replace(',', '.')
}

function sectionLabel(section: string): string {
  return SECTION_LABEL[section] ?? section
}

function colIndex(col: string): number {
  let n = 0
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n
}

function isVertical(b: ScaleBlock): boolean {
  return /вертикал/i.test(b.title)
}

function isHorizontal(b: ScaleBlock): boolean {
  return /горизонт/i.test(b.title)
}

/**
 * Пары в один ряд (одинаковый уровень):
 * - ФП / плиты: слева шаг 250, справа 200, по диаметру
 * - Стены: слева Вертикальная, справа горизонт…, по колонке Excel
 */
function pairBlocks(section: string, list: ScaleBlock[]): BlockPair[] {
  if (section === ARM_SECTIONS.walls) {
    const byCol = new Map<string, ScaleBlock[]>()
    for (const b of list) {
      const arr = byCol.get(b.codeCol) ?? []
      arr.push(b)
      byCol.set(b.codeCol, arr)
    }
    const cols = [...byCol.keys()].sort((a, b) => colIndex(a) - colIndex(b))
    const pairs: BlockPair[] = []
    for (const col of cols) {
      const items = byCol.get(col) ?? []
      const vert = items.find(isVertical) ?? null
      const horiz = items.find(isHorizontal) ?? null
      const other = items.filter((b) => b !== vert && b !== horiz)
      if (vert || horiz) pairs.push([vert, horiz])
      for (const b of other) pairs.push([b, null])
    }
    return pairs
  }

  // ФП и плиты: как в Excel — слева шаг 250, справа 200, пары по порядку сверху вниз
  const byExcelRow = (a: ScaleBlock, b: ScaleBlock) =>
    blockStartRow(a) - blockStartRow(b)

  const left = list.filter((b) => b.step === 250).sort(byExcelRow)
  const right = list.filter((b) => b.step === 200).sort(byExcelRow)
  const rest = list.filter((b) => b.step !== 250 && b.step !== 200)

  if (left.length === 0 && right.length === 0) {
    return list.map((b) => [b, null] as BlockPair)
  }

  const n = Math.max(left.length, right.length)
  const pairs: BlockPair[] = []
  for (let i = 0; i < n; i++) {
    pairs.push([left[i] ?? null, right[i] ?? null])
  }
  for (const b of rest.sort(byExcelRow)) {
    pairs.push([b, null])
  }
  return pairs
}

function BlockCard({
  block,
  copied,
  onCopy,
}: {
  block: ScaleBlock
  copied: boolean
  onCopy: (b: ScaleBlock) => void
}) {
  return (
    <article className={`arm-block${copied ? ' copied' : ''}`}>
      <button
        type="button"
        className="arm-block-head"
        onClick={() => onCopy(block)}
        title="Скопировать блок для ЛираСАПР"
      >
        <span className="arm-block-title">{block.title}</span>
        <span className="arm-block-action">
          {copied ? 'Скопировано' : 'Нажмите, чтобы скопировать'}
        </span>
      </button>
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
  )
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
  const [filter, setFilter] = usePersistedState<FilterId>(
    persistKey('arm-shkal', 'filter'),
    'all',
  )

  const filtered = useMemo(() => {
    if (filter === 'all') return sections
    const key = FILTERS.find((f) => f.id === filter)?.sectionKey
    if (!key) return sections
    return sections.filter(([section]) => section.toUpperCase() === key)
  }, [sections, filter])

  async function copyBlock(block: ScaleBlock) {
    const text = blockToLiraClipboard(block)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopiedId(block.id)
    window.setTimeout(() => setCopiedId(null), 1800)
  }

  return (
    <SheetShell
      title="Арм шкал"
      subtitle="Нажмите на название блока — шкала скопируется для вставки в «Параметры шкалы» ЛираСАПР."
    >
      <div className="arm-toolbar">
        <Field label="Показывать">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterId)}
          >
            {FILTERS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {filtered.map(([section, list]) => {
        const pairs = pairBlocks(section, list)

        return (
          <section key={section} className="arm-section">
            {filter === 'all' ? (
              <h3 className="arm-section-title">{sectionLabel(section)}</h3>
            ) : null}

            <div className="arm-pairs">
              {pairs.map(([left, right], i) => (
                <div
                  key={`${left?.id ?? 'x'}-${right?.id ?? 'y'}-${i}`}
                  className="arm-pair-row"
                >
                  <div className="arm-pair-cell">
                    {left ? (
                      <BlockCard
                        block={left}
                        copied={copiedId === left.id}
                        onCopy={(b) => void copyBlock(b)}
                      />
                    ) : null}
                  </div>
                  <div className="arm-pair-cell">
                    {right ? (
                      <BlockCard
                        block={right}
                        copied={copiedId === right.id}
                        onCopy={(b) => void copyBlock(b)}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </SheetShell>
  )
}
