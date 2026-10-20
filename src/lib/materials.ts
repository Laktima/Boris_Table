/** Shared material tables from «Е бетона» */

export const CONCRETE_RB: Record<string, { Rb: number; Rbt: number; Eb: number }> = {
  B15: { Rb: 8.5, Rbt: 0.75, Eb: 24000 },
  B20: { Rb: 11.5, Rbt: 0.9, Eb: 27500 },
  B25: { Rb: 14.5, Rbt: 1.05, Eb: 30000 },
  B30: { Rb: 17, Rbt: 1.15, Eb: 32500 },
  B35: { Rb: 19.5, Rbt: 1.3, Eb: 34500 },
  B40: { Rb: 22, Rbt: 1.4, Eb: 36000 },
  B45: { Rb: 25, Rbt: 1.5, Eb: 37000 },
  B50: { Rb: 27.5, Rbt: 1.6, Eb: 38000 },
  B55: { Rb: 30, Rbt: 1.7, Eb: 39000 },
  B60: { Rb: 33, Rbt: 1.8, Eb: 39500 },
  B70: { Rb: 37, Rbt: 1.9, Eb: 41000 },
  B80: { Rb: 41, Rbt: 2.1, Eb: 42000 },
  B90: { Rb: 44, Rbt: 2.15, Eb: 42500 },
  B100: { Rb: 47.5, Rbt: 2.2, Eb: 43000 },
}

export const REBAR_RSW: Record<string, number> = {
  A240: 170,
  A400: 280,
  A500: 300,
}

/** Diameter mm → area cm², weight kg/m */
export const REBAR_SORTAMENT: { d: number; area: number; weight: number }[] = [
  { d: 6, area: 0.283, weight: 0.222 },
  { d: 8, area: 0.503, weight: 0.395 },
  { d: 10, area: 0.785, weight: 0.617 },
  { d: 12, area: 1.131, weight: 0.888 },
  { d: 14, area: 1.539, weight: 1.208 },
  { d: 16, area: 2.011, weight: 1.578 },
  { d: 18, area: 2.545, weight: 1.998 },
  { d: 20, area: 3.142, weight: 2.466 },
  { d: 22, area: 3.801, weight: 2.984 },
  { d: 25, area: 4.909, weight: 3.84 },
  { d: 28, area: 6.158, weight: 4.83 },
  { d: 32, area: 8.043, weight: 6.31 },
  { d: 36, area: 10.179, weight: 7.99 },
  { d: 40, area: 12.566, weight: 9.865 },
]

export function rebarAreaMm2(d: number): number {
  return (Math.PI * d * d) / 4
}

export function rebarAreaCm2(d: number): number {
  const row = REBAR_SORTAMENT.find((r) => r.d === d)
  return row ? row.area : rebarAreaMm2(d) / 100
}

export function floorMath(n: number, significance = 1): number {
  if (significance === 0) return n
  return Math.floor(n / significance) * significance
}

export function ceilingMath(n: number, significance = 1): number {
  if (significance === 0) return n
  return Math.ceil(n / significance) * significance
}

export function formatNum(n: number, digits = 3): string {
  if (!Number.isFinite(n)) return '—'
  const s = n.toFixed(digits)
  // Не трогаем целые («30000»), убираем только хвостовые нули после точки
  if (!s.includes('.')) return s
  return s.replace(/\.?0+$/, '') || '0'
}

/** MATCH(..., ..., 1) — largest value ≤ lookup */
export function matchApprox(lookup: number, arr: number[]): number {
  let idx = 0
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] <= lookup) idx = i
    else break
  }
  return idx
}
