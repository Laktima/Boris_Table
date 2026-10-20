import arm from '../data/arm-shkal.json'

const SCALE_RE = /^s\d+d\d+/i
const PART_RE = /^s(\d+)d(\d+)$/i
const FLOOR_RE = /этаж/i
const SKIP_HEADER_RE = /^(Sсм|S\s*см)/i

/** Ключи секций — совпадают с фильтром на вкладке */
export const ARM_SECTIONS = {
  fp: 'ФУНДАМЕНТНЫЕ ПЛИТЫ',
  pp: 'ПЛИТЫ ПЕРЕКРЫТИЯ',
  walls: 'СТЕНЫ',
} as const

export type ScaleEntry = {
  code: string
  area: number | null
}

export type ScaleBlock = {
  id: string
  codeCol: string
  rangeLabel: string
  section: string
  title: string
  /** Диаметр из названия (Ø16 → 16), если есть */
  diameter: number | null
  /** Шаг из названия (250 / 200), если есть */
  step: number | null
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

function inRange(
  col: string,
  row: number,
  c0: string,
  c1: string,
  r0: number,
  r1: number,
): boolean {
  const c = colIndex(col)
  return c >= colIndex(c0) && c <= colIndex(c1) && row >= r0 && row <= r1
}

/**
 * Зоны листа Excel:
 * - ФП: B2:F59
 * - Плиты: H2:N39
 * - Стены: всё правее столбца G (кроме диапазона плит H2:N39)
 */
function sectionFor(col: string, row: number): string | null {
  if (inRange(col, row, 'B', 'F', 2, 59)) return ARM_SECTIONS.fp
  if (inRange(col, row, 'H', 'N', 2, 39)) return ARM_SECTIONS.pp
  if (colIndex(col) > colIndex('G')) return ARM_SECTIONS.walls
  return null
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

/** «Фон ф16 шаг 250» → «Фон Ø16 шаг 250» */
export function formatBlockTitle(raw: string): string {
  return raw
    .trim()
    .replace(/\r\n/g, ' ')
    .replace(/[фФ](\d+)/g, 'Ø$1')
}

/** Диаметр и шаг из названия блока */
export function parseTitleMeta(title: string): {
  diameter: number | null
  step: number | null
} {
  const d =
    title.match(/Ø(\d+)/i)?.[1] ??
    title.match(/[фФ](\d+)/)?.[1] ??
    null
  const s = title.match(/шаг\s*(\d+)/i)?.[1] ?? null
  return {
    diameter: d != null ? Number(d) : null,
    step: s != null ? Number(s) : null,
  }
}

/** Номер первой строки блока из rangeLabel (B6:B16 → 6) */
export function blockStartRow(b: ScaleBlock): number {
  const m = b.rangeLabel.match(/(\d+)/)
  return m ? Number(m[1]) : 0
}

/**
 * Порядок как в Excel: колонка слева направо, сверху вниз (без пересортировки диаметров).
 */
export function compareScaleBlocks(a: ScaleBlock, b: ScaleBlock): number {
  const cc = colIndex(a.codeCol) - colIndex(b.codeCol)
  if (cc !== 0) return cc
  return blockStartRow(a) - blockStartRow(b)
}

function isUsableHeader(v: string): boolean {
  const t = v.trim()
  if (!t || t === '0') return false
  if (SCALE_RE.test(t)) return false
  if (FLOOR_RE.test(t)) return false
  if (SKIP_HEADER_RE.test(t)) return false
  return true
}

function findHeaderAbove(
  cells: Record<string, unknown>,
  codeCol: string,
  firstRow: number,
): string {
  for (let r = firstRow - 1; r >= 1; r--) {
    const v = cells[`${codeCol}${r}`]
    if (typeof v === 'string' && isUsableHeader(v)) {
      return formatBlockTitle(v)
    }
  }
  return 'Шкала'
}

/**
 * Разбор листа «Арм шкал» на блоки по вертикали в зонах Excel.
 */
export function parseArmScaleBlocks(): ScaleBlock[] {
  const cells = (arm as { cells: Record<string, unknown> }).cells

  type Item = {
    row: number
    code: string
    area: number | null
    section: string
  }

  const byCol = new Map<string, Item[]>()

  for (const [addr, val] of Object.entries(cells)) {
    const p = parseAddr(addr)
    if (!p) continue
    if (typeof val !== 'string' || !SCALE_RE.test(val.trim())) continue

    const section = sectionFor(p.col, p.row)
    if (!section) continue

    let area = findArea(cells, p.col, p.row)
    if (area == null) area = areaFromCode(val.trim())

    const list = byCol.get(p.col) ?? []
    list.push({ row: p.row, code: val.trim(), area, section })
    byCol.set(p.col, list)
  }

  const blocks: ScaleBlock[] = []

  for (const [codeCol, items] of [...byCol.entries()].sort(
    (a, b) => colIndex(a[0]) - colIndex(b[0]),
  )) {
    const sorted = [...items].sort((a, b) => a.row - b.row)

    let chunk: Item[] = [sorted[0]]
    const chunks: Item[][] = []
    for (let i = 1; i < sorted.length; i++) {
      const prev = chunk[chunk.length - 1]
      const cur = sorted[i]
      // новый блок при разрыве строк или смене секции
      if (cur.row === prev.row + 1 && cur.section === prev.section) {
        chunk.push(cur)
      } else {
        chunks.push(chunk)
        chunk = [cur]
      }
    }
    chunks.push(chunk)

    for (const c of chunks) {
      const start = c[0].row
      const end = c[c.length - 1].row
      const section = c[0].section

      const entries: ScaleEntry[] = []
      const zeroRow = start - 1
      // ведущий 0 только если он в той же зоне листа
      if (sectionFor(codeCol, zeroRow) === section) {
        const zeroVal = cells[`${codeCol}${zeroRow}`]
        if (zeroVal === 0 || zeroVal === '0') {
          const zArea = findArea(cells, codeCol, zeroRow)
          entries.push({ code: '0', area: zArea ?? 0 })
        }
      }
      for (const it of c) {
        entries.push({ code: it.code, area: it.area })
      }

      const rangeStart = entries[0]?.code === '0' ? zeroRow : start
      const title = findHeaderAbove(cells, codeCol, start)
      const meta = parseTitleMeta(title)

      blocks.push({
        id: `${codeCol}-${start}-${end}`,
        codeCol,
        rangeLabel: `${codeCol}${rangeStart}:${codeCol}${end}`,
        section,
        title,
        diameter: meta.diameter,
        step: meta.step,
        entries,
      })
    }
  }

  // порядок секций: ФП → плиты → стены; внутри — 250↑ / 200↑
  const sectionOrder = [
    ARM_SECTIONS.fp,
    ARM_SECTIONS.pp,
    ARM_SECTIONS.walls,
  ]
  blocks.sort((a, b) => {
    const si = sectionOrder.indexOf(a.section as (typeof sectionOrder)[number])
    const sj = sectionOrder.indexOf(b.section as (typeof sectionOrder)[number])
    if (si !== sj) return si - sj
    return compareScaleBlocks(a, b)
  })

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
