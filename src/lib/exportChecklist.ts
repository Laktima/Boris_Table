import { utils, writeFile } from 'xlsx'

export type ChecklistExportItem = {
  /** Original № from Excel (may be number/serial/string) */
  numRaw: unknown
  title: string
  section?: string
  isSection?: boolean
  checked: boolean
  comment: string
}

/**
 * Build workbook matching исходный формат чек-листа:
 * A: № п.п. | B: Наименование | C: Соответствие Да/Нет | D: Комментарий
 */
export function downloadChecklistXlsx(
  fileName: string,
  sheetTitle: string,
  items: ChecklistExportItem[],
) {
  const aoa: unknown[][] = [
    [sheetTitle],
    ['№ п.п.', 'Наименование проверки', 'Соответствие\nДа/Нет', 'Комментарий'],
  ]

  let lastSection = ''
  for (const it of items) {
    if (it.isSection) {
      aoa.push([null, it.title, null, null])
      lastSection = it.title
      continue
    }
    if (it.section && it.section !== lastSection) {
      aoa.push([null, it.section, null, null])
      lastSection = it.section
    }
    aoa.push([
      it.numRaw ?? null,
      it.title,
      it.checked ? 'Да' : 'Нет',
      it.comment || null,
    ])
  }

  const ws = utils.aoa_to_sheet(aoa)

  // Column widths similar to a review checklist
  ws['!cols'] = [{ wch: 12 }, { wch: 70 }, { wch: 14 }, { wch: 40 }]

  // Merge title row across A–D
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }]

  const wb = utils.book_new()
  const safeName = sheetTitle.replace(/[\\/?*[\]]/g, ' ').slice(0, 31) || 'Чек-лист'
  utils.book_append_sheet(wb, ws, safeName)
  writeFile(wb, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`)
}

/** Parse исходный AOA чек-листа с сохранением номеров и секций */
export function parseChecklistForExport(aoa: unknown[][]): {
  title: string
  rows: {
    id: string
    numRaw: unknown
    numLabel: string
    title: string
    section: string
    isSection: boolean
    excelRow: number
  }[]
} {
  const title = String(aoa[0]?.[0] ?? 'Чек-лист').replace(/\r\n/g, ' ')
  const rows: {
    id: string
    numRaw: unknown
    numLabel: string
    title: string
    section: string
    isSection: boolean
    excelRow: number
  }[] = []
  let section = ''

  for (let i = 2; i < aoa.length; i++) {
    const row = aoa[i] ?? []
    const a = row[0]
    const b = row[1]

    // Section in column B only (Excel layout)
    if ((a == null || a === '') && b != null && b !== '') {
      const bStr = String(b).replace(/\r\n/g, '\n').trim()
      if (/^[\d.]+\s+\S/.test(bStr) || /^[А-ЯA-Z]/.test(bStr)) {
        section = bStr
        rows.push({
          id: `sec-${i}`,
          numRaw: null,
          numLabel: '',
          title: bStr,
          section: bStr,
          isSection: true,
          excelRow: i,
        })
        continue
      }
    }

    // Section in column A only
    if (a != null && a !== '' && (b == null || b === '')) {
      const aStr = String(a).replace(/\r\n/g, '\n').trim()
      if (/^[\d.]+\s+\S/.test(aStr) && !/^\d+(\.\d+)*$/.test(aStr)) {
        section = aStr
        rows.push({
          id: `sec-${i}`,
          numRaw: null,
          numLabel: '',
          title: aStr,
          section: aStr,
          isSection: true,
          excelRow: i,
        })
        continue
      }
    }

    if (a == null || a === '' || b == null || b === '') continue

    const rawNum = a
    const rawStr = String(a).trim()
    const numLooksLikeSerial = typeof a === 'number' && a > 40000
    const numLabel = numLooksLikeSerial || /^\d{5,}$/.test(rawStr) ? '' : rawStr

    rows.push({
      id: `item-${i}`,
      numRaw: rawNum,
      numLabel,
      title: String(b).replace(/\r\n/g, '\n'),
      section,
      isSection: false,
      excelRow: i,
    })
  }

  return { title, rows }
}
