import checkFp from '../data/check-fp.json'
import checkStairs from '../data/check-stairs.json'
import checkSf from '../data/check-sf.json'
import checkVert from '../data/check-vert.json'
import checkGor from '../data/check-gor.json'
import { ChecklistView } from '../components/Checklist'

export function CheckFpSheet() {
  return (
    <div className="sheet-panel">
      <ChecklistView
        sheetId="check-fp"
        aoa={checkFp.aoa as unknown[][]}
        downloadName="Чек_л_ФП"
      />
    </div>
  )
}
export function CheckStairsSheet() {
  return (
    <div className="sheet-panel">
      <ChecklistView
        sheetId="check-stairs"
        aoa={checkStairs.aoa as unknown[][]}
        downloadName="Чек_л_Лестницы"
      />
    </div>
  )
}
export function CheckSfSheet() {
  return (
    <div className="sheet-panel">
      <ChecklistView
        sheetId="check-sf"
        aoa={checkSf.aoa as unknown[][]}
        downloadName="Чек_л_СФ"
      />
    </div>
  )
}
export function CheckVertSheet() {
  return (
    <div className="sheet-panel">
      <ChecklistView
        sheetId="check-vert"
        aoa={checkVert.aoa as unknown[][]}
        downloadName="Чек_л_ВертКонст"
      />
    </div>
  )
}
export function CheckGorSheet() {
  return (
    <div className="sheet-panel">
      <ChecklistView
        sheetId="check-gor"
        aoa={checkGor.aoa as unknown[][]}
        downloadName="Чек_л_ГорКонстр"
      />
    </div>
  )
}
