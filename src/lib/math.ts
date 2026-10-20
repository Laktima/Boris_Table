/** Expression evaluator with parentheses and operator precedence */

type Tok =
  | { t: 'num'; v: number }
  | { t: 'op'; v: string }
  | { t: 'lp' }
  | { t: 'rp' }

function tokenize(expr: string): Tok[] {
  const s = expr.replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-')
  const tokens: Tok[] = []
  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let j = i + 1
      while (j < s.length && ((s[j] >= '0' && s[j] <= '9') || s[j] === '.')) j++
      tokens.push({ t: 'num', v: parseFloat(s.slice(i, j)) })
      i = j
      continue
    }
    if (ch === '(') {
      tokens.push({ t: 'lp' })
      i++
      continue
    }
    if (ch === ')') {
      tokens.push({ t: 'rp' })
      i++
      continue
    }
    if ('+-*/'.includes(ch)) {
      // unary minus / plus
      const prev = tokens[tokens.length - 1]
      if (ch === '-' && (!prev || prev.t === 'op' || prev.t === 'lp')) {
        let j = i + 1
        if (s[j] === '(') {
          tokens.push({ t: 'num', v: 0 })
          tokens.push({ t: 'op', v: '-' })
          i++
          continue
        }
        while (j < s.length && ((s[j] >= '0' && s[j] <= '9') || s[j] === '.')) j++
        if (j > i + 1) {
          tokens.push({ t: 'num', v: -parseFloat(s.slice(i + 1, j)) })
          i = j
          continue
        }
      }
      tokens.push({ t: 'op', v: ch })
      i++
      continue
    }
    throw new Error(`Неизвестный символ: ${ch}`)
  }
  return tokens
}

function toRpn(tokens: Tok[]): Tok[] {
  const out: Tok[] = []
  const stack: Tok[] = []
  const prec: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 }
  for (const tok of tokens) {
    if (tok.t === 'num') out.push(tok)
    else if (tok.t === 'op') {
      while (
        stack.length &&
        stack[stack.length - 1].t === 'op' &&
        prec[(stack[stack.length - 1] as { t: 'op'; v: string }).v] >= prec[tok.v]
      ) {
        out.push(stack.pop()!)
      }
      stack.push(tok)
    } else if (tok.t === 'lp') stack.push(tok)
    else if (tok.t === 'rp') {
      while (stack.length && stack[stack.length - 1].t !== 'lp') out.push(stack.pop()!)
      if (!stack.length) throw new Error('Лишняя скобка')
      stack.pop()
    }
  }
  while (stack.length) {
    const t = stack.pop()!
    if (t.t === 'lp') throw new Error('Незакрытая скобка')
    out.push(t)
  }
  return out
}

function evalRpn(rpn: Tok[]): number {
  const st: number[] = []
  for (const tok of rpn) {
    if (tok.t === 'num') st.push(tok.v)
    else if (tok.t === 'op') {
      if (st.length < 2) throw new Error('Неполное выражение')
      const b = st.pop()!
      const a = st.pop()!
      switch (tok.v) {
        case '+':
          st.push(a + b)
          break
        case '-':
          st.push(a - b)
          break
        case '*':
          st.push(a * b)
          break
        case '/':
          if (b === 0) throw new Error('Деление на ноль')
          st.push(a / b)
          break
      }
    }
  }
  if (st.length !== 1) throw new Error('Неполное выражение')
  return st[0]
}

export function evaluateExpression(expr: string): number {
  if (!expr.trim()) throw new Error('Пустое выражение')
  return evalRpn(toRpn(tokenize(expr)))
}

export function formatResult(n: number): string {
  if (!Number.isFinite(n)) return 'Ошибка'
  const rounded = Math.round(n * 1e10) / 1e10
  return String(rounded)
}
