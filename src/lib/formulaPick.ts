/**
 * Режим набора формулы в блокноте (=…):
 * клик по ячейке / копируемому значению вставляет токен в формулу.
 */

type Appender = (token: string) => boolean

let appender: Appender | null = null

export function setFormulaAppender(fn: Appender | null) {
  appender = fn
}

/** @returns true если токен ушёл в формулу блокнота */
export function tryAppendToFormula(token: string): boolean {
  if (!appender || !token) return false
  return appender(token)
}
