import type { ReactNode } from 'react'
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

export const SHEETS: { id: string; label: string; render: () => ReactNode }[] = [
  { id: 'e-betona', label: 'Е бетона', render: () => <EBetonaSheet /> },
  { id: 'arm-shkal', label: 'Арм шкал', render: () => <ArmShkalSheet /> },
  { id: 'pct-arm', label: '% арм', render: () => <PctArmSheet /> },
  { id: 'progib', label: 'Прогиб', render: () => <ProgibSheet /> },
  { id: 'fi3', label: 'Фи3Раскрепление', render: () => <Fi3Sheet /> },
  { id: 'phi14', label: 'ϕ1...ф4', render: () => <Phi14Sheet /> },
  { id: 'analiz', label: 'Анализ схем', render: () => <AnalizShemSheet /> },
  { id: 'interp', label: 'Интерполяция', render: () => <InterpolatsiyaSheet /> },
  { id: 'qb', label: 'Расчет Qb', render: () => <RaschetQbSheet /> },
  { id: 'anker', label: 'Анкер|Нахл', render: () => <AnkerSheet /> },
  { id: 'kze', label: 'Коэф. Kze', render: () => <KoefKzeSheet /> },
  { id: 'mufty', label: 'Муфты', render: () => <MuftySheet /> },
  { id: 'ogon', label: 'Огонь плит', render: () => <OgonPlitSheet /> },
  { id: 'arm-zad', label: 'Арм.зад.', render: () => <ArmZadSheet /> },
  { id: 'rasx', label: 'Расх_арм', render: () => <RasxArmSheet /> },
  { id: 'check-fp', label: 'Чек_л_ФП', render: () => <CheckFpSheet /> },
  { id: 'check-stairs', label: 'Чек_л_Лестницы', render: () => <CheckStairsSheet /> },
  { id: 'check-sf', label: 'Чек_л_СФ', render: () => <CheckSfSheet /> },
  { id: 'check-vert', label: 'Чек_л_ВертКонст', render: () => <CheckVertSheet /> },
  { id: 'check-gor', label: 'Чек_л_ГорКонстр', render: () => <CheckGorSheet /> },
]
