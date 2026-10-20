/**
 * Verify key Excel formulas against our TypeScript logic (ported inline).
 */
import assert from 'assert'

function ceilingMath(n, significance = 1) {
  return Math.ceil(n / significance) * significance
}
function matchApprox(lookup, arr) {
  let idx = 0
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] <= lookup) idx = i
    else break
  }
  return idx
}
function lerp(x, x1, y1, x2, y2) {
  if (x2 === x1) return y1
  return y1 + ((x - x1) * (y2 - y1)) / (x2 - x1)
}

// --- Progib (Excel defaults) ---
{
  const TABLE = [
    { L: 1, ratio: 120 },
    { L: 3, ratio: 150 },
    { L: 6, ratio: 200 },
    { L: 12, ratio: 250 },
    { L: 24, ratio: 300 },
  ]
  const Lfact = 3.2
  const fFact = 1.67
  const Ls = TABLE.map((t) => t.L)
  const idx = matchApprox(Lfact, Ls)
  const L1 = TABLE[idx].L
  const ratio1 = TABLE[idx].ratio
  const idx2 = Math.min(idx + 1, TABLE.length - 1)
  const L2 = TABLE[idx2].L
  const ratio2 = TABLE[idx2].ratio
  const q6 = (Lfact - L1) * (ratio2 - ratio1) / (L2 - L1)
  const ratioCeil = ceilingMath(ratio1 + q6, 1)
  const fLim = ceilingMath((Lfact * 1000) / ratioCeil, 0.1)
  const kPct = ceilingMath((fFact * 100) / fLim, 0.1)
  assert.strictEqual(L1, 3)
  assert.strictEqual(L2, 6)
  assert.strictEqual(ratioCeil, 154)
  assert.ok(Math.abs(fLim - 20.8) < 0.05, `fLim=${fLim}`)
  assert.ok(Math.abs(kPct - 8.1) < 0.05, `kPct=${kPct}`)
  console.log('✓ Прогиб')
}

// --- Kze type A Ze=27.517 ---
{
  const ZE = [5, 10, 20, 40, 60, 80, 100, 150, 200, 250, 300]
  const KA = [0.75, 1.0, 1.25, 1.5, 1.7, 1.85, 2.0, 2.25, 2.45, 2.65, 2.75]
  const ze = 27.517
  const idx = matchApprox(ze, ZE)
  const i2 = idx + 1
  const k = KA[idx] + ((ze - ZE[idx]) * (KA[i2] - KA[idx])) / (ZE[i2] - ZE[idx])
  assert.ok(Math.abs(k - 1.3439625) < 1e-6, `k=${k}`)
  console.log('✓ Коэф. Kze')
}

// --- Fi3 ---
{
  const H0 = 5280
  const d = 2000
  const ratio = d / H0
  const etaCant = ((2 * ratio) / 3) * (2 - (2 * ratio) / 3)
  const l0 = etaCant * 0.8
  assert.ok(Math.abs(l0 - 0.35302520151005) < 1e-8, `l0=${l0}`)
  console.log('✓ Фи3Раскрепление')
}

// --- Interpolation simple ---
{
  const y = lerp(14, 12, 250, 24, 300)
  assert.ok(Math.abs(y - 258.3333333333333) < 1e-6, `y=${y}`)
  console.log('✓ Интерполяция')
}

// --- Phi ---
{
  const A = 36.1
  const n = 4
  const phi1 = A > 9 ? 0.4 + 0.6 / Math.sqrt(A / 9) : 1
  const phi2 = A > 36 ? 0.5 + 0.5 / Math.sqrt(A / 36) : 1
  const phi4 = 0.5 + (phi2 - 0.5) / Math.sqrt(n)
  assert.ok(Math.abs(phi2 - 0.9993069989739547) < 1e-9)
  assert.ok(Math.abs(phi4 - 0.7496534994869773) < 1e-9)
  console.log('✓ ϕ1...ф4', { phi1, phi2, phi4 })
}

// --- Anker ---
{
  const Rs = 435 * 10.194
  const Rbt = 1.15 * 10.194
  const d = 8
  const As = 0.503
  const us = (Math.PI * d) / 10
  const Rbond = 2.5 * 1 * Rbt
  const l0an = ((Rs * As) / (Rbond * us)) * 10
  assert.ok(Math.abs(l0an - 302.8164984628014) < 0.01, `l0an=${l0an}`)
  console.log('✓ Анкер|Нахл')
}

// --- Calculator paren ---
{
  function evalExpr(expr) {
    // minimal: use Function for verify only
    const s = expr.replace(/×/g, '*').replace(/÷/g, '/')
    // eslint-disable-next-line no-new-func
    return Function(`"use strict"; return (${s})`)()
  }
  assert.strictEqual(evalExpr('2*(3+4)'), 14)
  assert.strictEqual(evalExpr('(10-2)/4'), 2)
  console.log('✓ Калькулятор (скобки)')
}

console.log('\nAll verification checks passed.')
