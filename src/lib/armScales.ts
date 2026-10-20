import arm from '../data/arm-shkal.json'

const SCALE_RE = /^s\d+d\d+/i
const PART_RE = /^s(\d+)d(\d+)$/i

export type ScaleEntry = {
  code: string
  area: number | null
}

export type ScaleBlock = {
  id: string
  /** Колонка Excel с кодами (B, E, Q…) */
  codeCol: string
  /** Диапазон строк, напр. B6:B16 */
  rangeLabel: string
  section: string
  title: string
  /** Строки блока как в Excel (включая ведущий 0) */
  entries: ScaleEntry[]
}

function colIndex(col: string): number {
  let n = 0
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n
}

function indexToCol(n: number): string {
  let s = ''
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

function parseAddr(addr: string): { col: string; row: number } | null {
  const m = addr.match(/^([A-Z]+)(\d+)$/)
  if (!m) return null
  return { col: m[1], row: Number(m[2]) }
}

/** Площадь см²/м по формуле шкалы (если в Excel нет S) */
export function areaFromCode(code: string): number {
  let sum = 0
  for (const part of code.split('+')) {
    const m = part.trim().match(PART_RE)
    if (!m) continue
    const s = Number(m[1])
    const d = Number(m[2])
    if (s <= 0) continue
    sum += ((1000 / s) * Math.PI * d * d) / 400
  }
  // как в Excel: обычно 2 знака после точки
  return Math.round(sum * 100) / 100
}

function findArea(
  cells: Record<string, unknown>,
  codeCol: string,
  row: number,
): number | null {
  const ci = colIndex(codeCol)
  for (let d = 1; d <= 3; d++) {
    const addr = `${indexToCol(ci + d)}${row}`
    const v = cells[addr]
    if (typeof v === 'number' && Number.isFinite(v)) return v
  }
  return null
}

function findHeaderAbove(
  cells: Record<string, unknown>,
  codeCol: string,
  firstRow: number,
): string {
  for (let r = firstRow - 1; r >= 1; r--) {
    const v = cells[`${codeCol}${r}`]
    if (typeof v === 'string' && v.trim() && !SCALE_RE.test(v.trim()) && v !== '0') {
      return v.trim().replace(/\r\n/g, ' ')
    }
  }
  return `Колонка ${codeCol}`
}

function findSection(cells: Record<string, unknown>, codeCol: string): string {
  const ci = colIndex(codeCol)
  // Row 1 section titles sit in B / H / R
  const anchors: { col: string; title: string }[] = []
  for (const [addr, val] of Object.entries(cells)) {
    const p = parseAddr(addr)
    if (!p || p.row !== 1) continue
    if (typeof val === 'string' && val.trim()) {
      anchors.push({ col: p.col, title: val.trim() })
    }
  }
  anchors.sort((a, b) => colIndex(a.col) - colIndex(b.col))
  let section = 'Шкалы'
  for (const a of anchors) {
    if (colIndex(a.col) <= ci) section = a.title
  }
  return section
}

/**
 * Разбор листа «Арм шкал» на блоки (как в Excel), готовые к копированию в ЛираСАПР.
 */
export function parseArmScaleBlocks(): ScaleBlock[] {
  const cells = (arm as { cells: Record<string, unknown> }).cells
  const byCol = new Map<string, { row: number; code: string; area: number | null }[]>()

  for (const [addr, val] of Object.entries(cells)) {
    const p = parseAddr(addr)
    if (!p) continue
    if (typeof val === 'string' && SCALE_RE.test(val.trim())) {
      const list = byCol.get(p.col) ?? []
      let area = findArea(cells, p.col, p.row)
      if (area == null) area = areaFromCode(val.trim())
      list.push({ row: p.row, code: val.trim(), area })
      byCol.set(p.col, list)
    }
  }

  const blocks: ScaleBlock[] = []

  for (const [codeCol, items] of [...byCol.entries()].sort(
    (a, b) => colIndex(a[0]) - colIndex(b[0]),
  )) {
    const sorted = [...items].sort((a, b) => a.row - b.row)
    // contiguous blocks
    let chunk: typeof sorted = [sorted[0]]
    const chunks: (typeof sorted)[] = []
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].row === chunk[chunk.length - 1].row + 1) {
        chunk.push(sorted[i])
      } else {
        chunks.push(chunk)
        chunk = [sorted[i]]
      }
    }
    chunks.push(chunk)

    const section = findSection(cells, codeCol)

    for (const c of chunks) {
      const start = c[0].row
      const end = c[c.length - 1].row
      // Include leading 0 row if present (Excel B6 = 0)
      const entries: ScaleEntry[] = []
      const zeroRow = start - 1
      const zeroVal = cells[`${codeCol}${zeroRow}`]
      if (zeroVal === 0 || zeroVal === '0') {
        const zArea = findArea(cells, codeCol, zeroRow)
        entries.push({ code: '0', area: zArea ?? 0 })
      }
      for (const it of c) {
        entries.push({ code: it.code, area: it.area })
      }

      const rangeStart = entries[0]?.code === '0' ? zeroRow : start
      const title = findHeaderAbove(cells, codeCol, start)

      blocks.push({
        id: `${codeCol}-${start}-${end}`,
        codeCol,
        rangeLabel: `${codeCol}${rangeStart}:${codeCol}${end}`,
        section,
        title,
        entries,
      })
    }
  }

  return blocks
}

/** TSV для вставки в таблицу «Диапазоны» ЛираСАПР: код \\t площадь */
export function blockToLiraClipboard(block: ScaleBlock): string {
  return block.entries
    .map((e) => {
      const area =
        e.area != null && Number.isFinite(e.area)
          ? String(e.area).replace(',', '.')
          : ''
      return `${e.code}\t${area}`
    })
    .join('\n')
}
