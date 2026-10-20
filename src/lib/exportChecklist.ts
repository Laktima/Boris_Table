import ExcelJS from 'exceljs'

export type ChecklistExportItem = {
  numLabel: string
  title: string
  section?: string
  isSection?: boolean
  checked: boolean
  comment: string
}

const BLUE = 'C9DAF8'
const FONT = 'Calibri'

const thick: Partial<ExcelJS.Border> = { style: 'thick', color: { argb: 'FF000000' } }
const thin: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FF000000' } }

const borderBoxThick: Partial<ExcelJS.Borders> = {
  top: thick,
  left: thick,
  bottom: thick,
  right: thick,
}

const borderThickSidesThinTB: Partial<ExcelJS.Borders> = {
  top: thin,
  left: thick,
  bottom: thin,
  right: thick,
}

function applyFont(cell: ExcelJS.Cell, opts: { bold?: boolean; size?: number } = {}) {
  cell.font = { name: FONT, size: opts.size ?? 10, bold: !!opts.bold, color: { argb: 'FF000000' } }
}

function fillBlue(cell: ExcelJS.Cell) {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: `FF${BLUE}` },
  }
}

/**
 * Export checklist matching исходный Excel:
 * light-blue sections + № column, thick outer borders, Да/Нет dropdown.
 */
export async function downloadChecklistXlsx(
  fileName: string,
  sheetTitle: string,
  items: ChecklistExportItem[],
) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Полезное для расчетов'
  const safeName = sheetTitle.replace(/[\\/?*[\]]/g, ' ').slice(0, 31) || 'Чек-лист'
  const ws = wb.addWorksheet(safeName, {
    views: [{ state: 'frozen', ySplit: 2 }],
  })

  // Column widths ≈ original (A 7.14, B 73.14, C 11.86, D 26.29)
  ws.getColumn(1).width = 8
  ws.getColumn(2).width = 73
  ws.getColumn(3).width = 12
  ws.getColumn(4).width = 26

  // —— Row 1: title ——
  ws.mergeCells('A1:D1')
  const titleCell = ws.getCell('A1')
  titleCell.value = sheetTitle.replace(/\r\n/g, '\n')
  applyFont(titleCell, { bold: true, size: 12 })
  titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  ws.getRow(1).height = 18

  // —— Row 2: headers ——
  const headers = ['№ п.п.', 'Наименование проверки', 'Соответствие\nДа/Нет', 'Комментарий']
  headers.forEach((h, i) => {
    const cell = ws.getCell(2, i + 1)
    cell.value = h
    applyFont(cell, { bold: true, size: 10 })
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = borderBoxThick
  })
  ws.getRow(2).height = 20

  let excelRow = 3

  let lastSection = ''
  for (const it of items) {
    if (it.isSection) {
      writeSectionRow(ws, excelRow, it.title)
      lastSection = it.title
      excelRow++
      continue
    }
    if (it.section && it.section !== lastSection) {
      writeSectionRow(ws, excelRow, it.section)
      lastSection = it.section
      excelRow++
    }

    // A — номер (голубой)
    const a = ws.getCell(excelRow, 1)
    a.value = it.numLabel || null
    applyFont(a)
    fillBlue(a)
    a.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    a.border = borderThickSidesThinTB

    // B — наименование
    const b = ws.getCell(excelRow, 2)
    b.value = it.title
    applyFont(b)
    b.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
    b.border = borderThickSidesThinTB

    // C — Да/Нет (с выпадающим списком)
    const c = ws.getCell(excelRow, 3)
    c.value = it.checked ? 'Да' : 'Нет'
    applyFont(c)
    c.alignment = { horizontal: 'center', vertical: 'middle' }
    c.border = borderThickSidesThinTB
    c.dataValidation = {
      type: 'list',
      allowBlank: true,
      showErrorMessage: true,
      formulae: ['"Да,Нет"'],
    }

    // D — комментарий
    const d = ws.getCell(excelRow, 4)
    d.value = it.comment || null
    applyFont(d)
    d.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
    d.border = borderThickSidesThinTB

    // Auto height for wrapped text
    const lines = Math.max(1, Math.ceil(it.title.length / 70) + (it.title.match(/\n/g)?.length ?? 0))
    ws.getRow(excelRow).height = Math.min(120, Math.max(16.5, lines * 14))

    excelRow++
  }

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

function writeSectionRow(ws: ExcelJS.Worksheet, row: number, title: string) {
  for (let col = 1; col <= 4; col++) {
    const cell = ws.getCell(row, col)
    cell.value = col === 2 ? title : null
    applyFont(cell, { bold: true, size: 10 })
    fillBlue(cell)
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = borderBoxThick
  }
  ws.getRow(row).height = 18
}

/** Parse исходный AOA + generate 1.1 / 1.2 numbering when Excel had date serials */
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
    defaultComment: string
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
    defaultComment: string
  }[] = []
  let section = ''
  let sectionNum = 0
  let itemInSection = 0

  for (let i = 2; i < aoa.length; i++) {
    const row = aoa[i] ?? []
    const a = row[0]
    const b = row[1]
    const d = row[3]
    const e = row[4]
    const defaultComment =
      (d != null && d !== '' ? String(d) : '') ||
      (e != null && e !== '' ? String(e) : '')

    // Section in column B only
    if ((a == null || a === '') && b != null && b !== '') {
      const bStr = String(b).replace(/\r\n/g, '\n').trim()
      if (/^[\d.]+\s+\S/.test(bStr) || /^[А-ЯA-Z]/.test(bStr)) {
        section = bStr
        sectionNum = parseSectionNumber(bStr) || sectionNum + 1
        itemInSection = 0
        rows.push({
          id: `sec-${i}`,
          numRaw: null,
          numLabel: '',
          title: bStr,
          section: bStr,
          isSection: true,
          excelRow: i,
          defaultComment: '',
        })
        continue
      }
    }

    // Section in column A only
    if (a != null && a !== '' && (b == null || b === '')) {
      const aStr = String(a).replace(/\r\n/g, '\n').trim()
      if (/^[\d.]+\s+\S/.test(aStr) && !/^\d+(\.\d+)*$/.test(aStr)) {
        section = aStr
        sectionNum = parseSectionNumber(aStr) || sectionNum + 1
        itemInSection = 0
        rows.push({
          id: `sec-${i}`,
          numRaw: null,
          numLabel: '',
          title: aStr,
          section: aStr,
          isSection: true,
          excelRow: i,
          defaultComment: '',
        })
        continue
      }
    }

    if (a == null || a === '' || b == null || b === '') continue

    const rawNum = a
    const rawStr = String(a).trim()
    const isSerial = (typeof a === 'number' && a > 40000) || /^\d{5,}$/.test(rawStr)
    const looksHierarchical = /^\d+(\.\d+)+$/.test(rawStr)

    itemInSection++
    let numLabel: string
    if (looksHierarchical) {
      numLabel = rawStr
    } else if (isSerial || !rawStr) {
      if (!sectionNum) sectionNum = 1
      numLabel = `${sectionNum}.${itemInSection}`
    } else {
      numLabel = rawStr
    }

    rows.push({
      id: `item-${i}`,
      numRaw: rawNum,
      numLabel,
      title: String(b).replace(/\r\n/g, '\n'),
      section,
      isSection: false,
      excelRow: i,
      defaultComment,
    })
  }

  return { title, rows }
}

function parseSectionNumber(sectionTitle: string): number | null {
  const m = sectionTitle.trim().match(/^(\d+)\./)
  return m ? Number(m[1]) : null
}
