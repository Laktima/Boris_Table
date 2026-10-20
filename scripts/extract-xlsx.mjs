import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import XLSX from 'xlsx'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const xlsxPath = path.join(root, 'Полезное для расчетов.xlsx')
const outDir = path.join(root, 'src/data')

fs.mkdirSync(outDir, { recursive: true })

const wb = XLSX.readFile(xlsxPath, { cellFormula: true, cellNF: true, dense: false })

const sheetOrder = wb.SheetNames
const catalog = []

for (const name of sheetOrder) {
  const ws = wb.Sheets[name]
  const ref = ws['!ref']
  if (!ref) {
    const empty = { name, rows: [], cells: {}, formulas: {}, merges: [] }
    const slug = slugify(name)
    fs.writeFileSync(path.join(outDir, `${slug}.json`), JSON.stringify(empty, null, 2))
    catalog.push({ name, slug, empty: true })
    continue
  }

  const range = XLSX.utils.decode_range(ref)
  const cells = {}
  const formulas = {}
  const rows = []

  for (let r = range.s.r; r <= range.e.r; r++) {
    const rowObj = {}
    let hasAny = false
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c })
      const cell = ws[addr]
      if (!cell) continue
      hasAny = true
      let value = cell.v
      if (value === undefined && cell.w !== undefined) value = cell.w
      cells[addr] = value ?? null
      rowObj[XLSX.utils.encode_col(c)] = value ?? null
      if (cell.f) formulas[addr] = cell.f
    }
    if (hasAny) {
      rows.push({ r: r + 1, ...rowObj })
    }
  }

  const merges = (ws['!merges'] || []).map((m) => ({
    s: XLSX.utils.encode_cell(m.s),
    e: XLSX.utils.encode_cell(m.e),
  }))

  const payload = {
    name,
    range: ref,
    cells,
    formulas,
    rows,
    merges,
    aoa: XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true }),
  }

  const slug = slugify(name)
  fs.writeFileSync(path.join(outDir, `${slug}.json`), JSON.stringify(payload))
  catalog.push({
    name,
    slug,
    empty: false,
    cellCount: Object.keys(cells).length,
    formulaCount: Object.keys(formulas).length,
  })
  console.log(`✓ ${name} → ${slug}.json (${Object.keys(cells).length} cells, ${Object.keys(formulas).length} formulas)`)
}

fs.writeFileSync(path.join(outDir, 'catalog.json'), JSON.stringify({ sheets: catalog }, null, 2))
console.log(`\nDone. ${catalog.length} sheets → ${outDir}`)

function slugify(name) {
  const map = {
    'Е бетона': 'e-betona',
    'Арм шкал': 'arm-shkal',
    '% арм': 'pct-arm',
    Прогиб: 'progib',
    Фи3Раскрепление: 'fi3-raskreplenie',
    'ϕ1...ф4': 'phi1-4',
    'Анализ схем': 'analiz-shem',
    Интерполяция: 'interpolatsiya',
    'Расчет Qb': 'raschet-qb',
    'Анкер|Нахл': 'anker-nakhl',
    'Коэф. Kze': 'koef-kze',
    Муфты: 'mufty',
    'Огонь плит': 'ogon-plit',
    'Арм.зад.': 'arm-zad',
    Расх_арм: 'rasx-arm',
    'Пределы огнестойкости': 'predely-ognestojkosti',
    Чек_л_ФП: 'check-fp',
    Чек_л_Лестницы: 'check-stairs',
    Чек_л_СФ: 'check-sf',
    Чек_л_ВертКонст: 'check-vert',
    Чек_л_ГорКонстр: 'check-gor',
  }
  if (map[name]) return map[name]
  return name
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, '-')
    .replace(/^-|-$/g, '')
}
