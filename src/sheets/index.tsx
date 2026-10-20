import type { ReactNode } from 'react'
import { ComingSoon } from './ComingSoon'
import { EBetonaSheet } from './EBetona'
import { ArmShkalSheet } from './ArmShkal'
import { PctArmSheet } from './PctArm'
import { ProgibSheet } from './Progib'
import { Fi3Sheet } from './Fi3'
import { Phi14Sheet } from './Phi14'
import { AnalizShemSheet, MuftySheet, OgonPlitSheet } from './ReferenceSheets'
import { InterpolatsiyaSheet } from './Interpolatsiya'
import { RaschetQbSheet } from './RaschetQb'
import { AnkerSheet } from './Anker'
import { KoefKzeSheet } from './KoefKze'
import { ArmZadSheet } from './ArmZad'
import { RasxArmSheet } from './RasxArm'
import {
  CheckFpSheet,
  CheckStairsSheet,
  CheckSfSheet,
  CheckVertSheet,
  CheckGorSheet,
} from './CheckSheets'

export type SheetDef = {
  id: string
  label: string
  /** Что показывается на сайте сейчас */
  render: () => ReactNode
  /** Полная реализация вкладки (сохранена, даже если временно скрыта) */
  content: () => ReactNode
  ready: boolean
}

function sheet(
  id: string,
  label: string,
  content: () => ReactNode,
  ready = false,
): SheetDef {
  return {
    id,
    label,
    content,
    ready,
    render: ready ? content : () => <ComingSoon title={label} />,
  }
}

export const SHEETS: SheetDef[] = [
  sheet('e-betona', 'Харак-ки бетона', () => <EBetonaSheet />, true),
  sheet('arm-shkal', 'Арм шкал', () => <ArmShkalSheet />, true),
  sheet('pct-arm', '% арм', () => <PctArmSheet />),
  sheet('progib', 'Прогиб', () => <ProgibSheet />),
  sheet('fi3', 'Фи3Раскрепление', () => <Fi3Sheet />),
  sheet('phi14', 'ϕ1...ф4', () => <Phi14Sheet />),
  sheet('analiz', 'Анализ схем', () => <AnalizShemSheet />),
  sheet('interp', 'Интерполяция', () => <InterpolatsiyaSheet />),
  sheet('qb', 'Расчет Qb', () => <RaschetQbSheet />),
  sheet('anker', 'Анкер|Нахл', () => <AnkerSheet />),
  sheet('kze', 'Коэф. Kze', () => <KoefKzeSheet />),
  sheet('mufty', 'Муфты', () => <MuftySheet />),
  sheet('ogon', 'Огонь плит', () => <OgonPlitSheet />),
  sheet('arm-zad', 'Арм.зад.', () => <ArmZadSheet />),
  sheet('rasx', 'Расх_арм', () => <RasxArmSheet />),
  sheet('check-fp', 'Чек_л_ФП', () => <CheckFpSheet />, true),
  sheet('check-stairs', 'Чек_л_Лестницы', () => <CheckStairsSheet />, true),
  sheet('check-sf', 'Чек_л_СФ', () => <CheckSfSheet />, true),
  sheet('check-vert', 'Чек_л_ВертКонст', () => <CheckVertSheet />, true),
  sheet('check-gor', 'Чек_л_ГорКонстр', () => <CheckGorSheet />, true),
]

export const DEFAULT_SHEET_ID =
  SHEETS.find((s) => s.ready)?.id ?? SHEETS[0].id
