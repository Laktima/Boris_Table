import { useMemo, useState, type ReactNode } from 'react'
import ankerRef from '../data/anker-ref.json'
import { CONCRETE_RB, rebarAreaCm2, formatNum } from '../lib/materials'
import { tryAppendToFormula } from '../lib/formulaPick'
import { persistKey, usePersistedState } from '../lib/persist'
import { Field, SheetShell } from './shared'

const RS_MPA: Record<string, number> = {
  А240: 210,
  А400: 350,
  А500: 435,
  А600: 520,
  А800: 695,
  А1000: 870,
}

const KGCM2 = 10.194

const DIAMS = [6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32, 36, 40]

/** Списки из Excel (data validation на Анкер|Нахл) */
const ETA1_OPTS = [1.5, 2, 2.5]
const ETA2_OPTS = [1, 0.9]
const ALPHA1_OPTS = [1, 0.75]
const ALPHA2_OPTS = [1.2, 0.9]

type RefTable = (typeof ankerRef.refTables)[number]

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  }
}

function CopyVal({
  text,
  copied,
  onCopy,
  children,
  className = '',
}: {
  text: string
  copied: string | null
  onCopy: (t: string) => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      className={`anker-copy-val${copied === text ? ' copied' : ''}${className ? ` ${className}` : ''}`}
      data-copy-value={text}
      title="Клик — скопировать"
      onClick={(e) => {
        const el = e.currentTarget
        if (el.dataset.formulaPicked === '1') {
          delete el.dataset.formulaPicked
          return
        }
        if (tryAppendToFormula(text)) return
        onCopy(text)
      }}
    >
      {children}
    </button>
  )
}

export function AnkerSheet() {
  const [armClass, setArmClass] = usePersistedState(persistKey('anker', 'armClass'), 'А500')
  const [d, setD] = usePersistedState(persistKey('anker', 'd'), 8)
  const [beton, setBeton] = usePersistedState(persistKey('anker', 'beton'), 'B30')
  const [eta1, setEta1] = usePersistedState(persistKey('anker', 'eta1'), 2.5)
  const [eta2, setEta2] = usePersistedState(persistKey('anker', 'eta2'), 1)
  const [alpha1, setAlpha1] = usePersistedState(persistKey('anker', 'alpha1'), 1)
  const [alpha2, setAlpha2] = usePersistedState(persistKey('anker', 'alpha2'), 1.2)
  const [AsCal, setAsCal] = usePersistedState(persistKey('anker', 'AsCal'), 3.14)
  const [AsEf, setAsEf] = usePersistedState(persistKey('anker', 'AsEf'), 3.14)
  const [refBeton, setRefBeton] = usePersistedState(persistKey('anker', 'refBeton'), 'B30')
  const [copied, setCopied] = useState<string | null>(null)

  const tips = ankerRef.tips
  const refTable: RefTable =
    ankerRef.refTables.find((t) => t.beton === refBeton) ?? ankerRef.refTables[1]

  const r = useMemo(() => {
    const Rs = (RS_MPA[armClass] ?? 435) * KGCM2
    const Rbt = (CONCRETE_RB[beton]?.Rbt ?? 1.15) * KGCM2
    const As = rebarAreaCm2(d)
    const us = (Math.PI * d) / 10
    const Rbond = eta1 * eta2 * Rbt
    const l0an = ((Rs * As) / (Rbond * us)) * 10
    const usage = AsCal / AsEf
    const lan = alpha1 * l0an * usage
    const lan15d = 15 * d
    const lan200 = 200
    const lan03 = 0.3 * l0an
    const ankerFinal = Math.max(lan, lan15d, lan200, lan03)

    const l1 = alpha2 * l0an * usage
    const l04 = 0.4 * alpha2 * l0an
    const l20d = 20 * d
    const l250 = 250
    const nakhlFinal = Math.max(l1, l04, l20d, l250)

    return {
      Rs,
      Rbt,
      As,
      us,
      Rbond,
      l0an,
      usage,
      lan,
      lan15d,
      lan200,
      lan03,
      ankerFinal,
      l1,
      l04,
      l20d,
      l250,
      nakhlFinal,
    }
  }, [armClass, d, beton, eta1, eta2, alpha1, alpha2, AsCal, AsEf])

  const t = {
    usage: formatNum(r.usage * 100, 0),
    l0an: formatNum(r.l0an, 1),
    Rbond: formatNum(r.Rbond, 2),
    Rs: formatNum(r.Rs, 2),
    As: formatNum(r.As, 3),
    us: formatNum(r.us, 3),
    Rbt: formatNum(r.Rbt, 2),
    lan: formatNum(r.lan, 1),
    lan15d: formatNum(r.lan15d, 1),
    lan200: String(r.lan200),
    lan03: formatNum(r.lan03, 1),
    ankerFinal: formatNum(r.ankerFinal, 1),
    l1: formatNum(r.l1, 1),
    l04: formatNum(r.l04, 1),
    l20d: formatNum(r.l20d, 1),
    l250: String(r.l250),
    nakhlFinal: formatNum(r.nakhlFinal, 1),
  }

  const onCopy = async (text: string) => {
    if (tryAppendToFormula(text)) return
    const ok = await copyText(text)
    if (!ok) return
    setCopied(text)
    window.setTimeout(() => setCopied((c) => (c === text ? null : c)), 1400)
  }

  return (
    <SheetShell
      title="Анкер | Нахл"
      subtitle="Расчет длины анкеровки/нахлестки ненапрягаемой арматуры · СП 63.13330.2018"
    >
      <div className="anker-layout">
        {/* col 1 */}
        <div className="anker-col anker-col-inputs">
          <div className="xl-card anker-inputs">
            <h3 className="xl-card-title xl-card-title-muted">
              Исходные данные для расчета анкеровки
            </h3>
            <div className="xl-grid xl-grid-1">
              <Field label="Класс арматуры">
                <select
                  className="xl-select"
                  value={armClass}
                  onChange={(e) => setArmClass(e.target.value)}
                >
                  {Object.keys(RS_MPA).map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </Field>
              <Field label="Диаметр арматуры, мм">
                <select
                  className="xl-select"
                  value={d}
                  onChange={(e) => setD(+e.target.value)}
                >
                  {DIAMS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Класс бетона">
                <select
                  className="xl-select"
                  value={beton}
                  onChange={(e) => setBeton(e.target.value)}
                >
                  {Object.keys(CONCRETE_RB).map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </Field>
              <Field label="η1">
                <select
                  className="xl-select"
                  value={eta1}
                  onChange={(e) => setEta1(+e.target.value)}
                  title={tips.eta1}
                >
                  {ETA1_OPTS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <p className="xl-field-tip">{tips.eta1}</p>
              </Field>
              <Field label="η2">
                <select
                  className="xl-select"
                  value={eta2}
                  onChange={(e) => setEta2(+e.target.value)}
                  title={tips.eta2}
                >
                  {ETA2_OPTS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <p className="xl-field-tip">{tips.eta2}</p>
              </Field>
              <Field label="α1">
                <select
                  className="xl-select"
                  value={alpha1}
                  onChange={(e) => setAlpha1(+e.target.value)}
                  title={tips.alpha1}
                >
                  {ALPHA1_OPTS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <p className="xl-field-tip">{tips.alpha1}</p>
              </Field>
              <Field label="As,cal, см²">
                <input
                  className="xl-input"
                  type="number"
                  step="0.01"
                  value={AsCal}
                  onChange={(e) => setAsCal(+e.target.value)}
                  title={tips.AsCal}
                />
                <p className="xl-field-tip">{tips.AsCal}</p>
              </Field>
              <Field label="As,ef, см²">
                <input
                  className="xl-input"
                  type="number"
                  step="0.01"
                  value={AsEf}
                  onChange={(e) => setAsEf(+e.target.value)}
                  title={tips.AsEf}
                />
                <p className="xl-field-tip">{tips.AsEf}</p>
              </Field>
            </div>
          </div>

          <div className="anker-usage-row">
            <div className="xl-readonly anker-usage">
              <span className="xl-readonly-label">Использование арматуры</span>
              <CopyVal text={t.usage} copied={copied} onCopy={onCopy}>
                {t.usage} <small>%</small>
              </CopyVal>
            </div>
            <span className="anker-flow-arrow anker-arrow-to-lan" aria-hidden>
              →
            </span>
          </div>

          <div className="xl-card anker-extra">
            <h3 className="xl-card-title xl-card-title-muted">
              Дополнительные данные для расчета нахлестки
            </h3>
            <Field label="α2">
              <select
                className="xl-select"
                value={alpha2}
                onChange={(e) => setAlpha2(+e.target.value)}
                title={tips.alpha2}
              >
                {ALPHA2_OPTS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <p className="xl-field-tip">{tips.alpha2}</p>
            </Field>
          </div>
        </div>

        {/* col 2 — те же 3 строки сетки: параметры | скобка ←100% | итог */}
        <div className="anker-col anker-col-computed">
          <div className="xl-card anker-params">
            <div className="anker-block-head">
              <h3 className="xl-card-title">Вычисленные параметры</h3>
              <span className="anker-flow-arrow anker-arrow-to-nakhl" aria-hidden>
                ›
              </span>
            </div>
            <div className="xl-kv-list">
              <div className="xl-kv">
                <span>l₀,an</span>
                <CopyVal text={t.l0an} copied={copied} onCopy={onCopy}>
                  {t.l0an} <small>мм</small>
                </CopyVal>
              </div>
              <div className="xl-kv">
                <span>Rbond</span>
                <CopyVal text={t.Rbond} copied={copied} onCopy={onCopy}>
                  {t.Rbond} <small>кг/см²</small>
                </CopyVal>
              </div>
              <div className="xl-kv">
                <span>Rs</span>
                <CopyVal text={t.Rs} copied={copied} onCopy={onCopy}>
                  {t.Rs} <small>кг/см²</small>
                </CopyVal>
              </div>
              <div className="xl-kv">
                <span>As</span>
                <CopyVal text={t.As} copied={copied} onCopy={onCopy}>
                  {t.As} <small>см²</small>
                </CopyVal>
              </div>
              <div className="xl-kv">
                <span>us</span>
                <CopyVal text={t.us} copied={copied} onCopy={onCopy}>
                  {t.us} <small>см</small>
                </CopyVal>
              </div>
              <div className="xl-kv">
                <span>Rbt</span>
                <CopyVal text={t.Rbt} copied={copied} onCopy={onCopy}>
                  {t.Rbt} <small>кг/см²</small>
                </CopyVal>
              </div>
            </div>
          </div>

          <div className="xl-card anker-lan">
            <h4 className="anker-subhead">Требуемая длина анкеровки</h4>
            <div className="anker-brace-group">
              <span className="anker-brace" aria-hidden>
                {'{'}
              </span>
              <div className="xl-kv-list">
                <div className="xl-kv">
                  <span>lan = α1·l₀,an·(As,cal/As,ef)</span>
                  <CopyVal text={t.lan} copied={copied} onCopy={onCopy}>
                    {t.lan} мм
                  </CopyVal>
                </div>
                <div className="xl-kv">
                  <span>15·ds</span>
                  <CopyVal text={t.lan15d} copied={copied} onCopy={onCopy}>
                    {t.lan15d} мм
                  </CopyVal>
                </div>
                <div className="xl-kv">
                  <span>не менее</span>
                  <CopyVal text={t.lan200} copied={copied} onCopy={onCopy}>
                    {t.lan200} мм
                  </CopyVal>
                </div>
                <div className="xl-kv">
                  <span>0,3·l₀,an</span>
                  <CopyVal text={t.lan03} copied={copied} onCopy={onCopy}>
                    {t.lan03} мм
                  </CopyVal>
                </div>
              </div>
            </div>
          </div>

          <CopyVal
            text={t.ankerFinal}
            copied={copied}
            onCopy={onCopy}
            className="anker-final anker-final-blue"
          >
            <span>Итоговое значение анкеровки</span>
            <strong>{t.ankerFinal} мм</strong>
          </CopyVal>
        </div>

        {/* col 3 */}
        <div className="anker-col anker-col-nakhl">
          <div className="xl-card anker-nakhl">
            <h3 className="xl-card-title">Длина нахлестки арматуры</h3>
            <div className="anker-brace-group">
              <span className="anker-brace" aria-hidden>
                {'{'}
              </span>
              <div className="xl-kv-list">
                <div className="xl-kv">
                  <span>l1 = α2·l₀,an·(As,cal/As,ef)</span>
                  <CopyVal text={t.l1} copied={copied} onCopy={onCopy}>
                    {t.l1} мм
                  </CopyVal>
                </div>
                <div className="xl-kv">
                  <span>0,4·α2·l₀,an</span>
                  <CopyVal text={t.l04} copied={copied} onCopy={onCopy}>
                    {t.l04} мм
                  </CopyVal>
                </div>
                <div className="xl-kv">
                  <span>20·ds</span>
                  <CopyVal text={t.l20d} copied={copied} onCopy={onCopy}>
                    {t.l20d} мм
                  </CopyVal>
                </div>
                <div className="xl-kv">
                  <span>не менее</span>
                  <CopyVal text={t.l250} copied={copied} onCopy={onCopy}>
                    {t.l250} мм
                  </CopyVal>
                </div>
              </div>
            </div>
          </div>

          <div className="anker-row-spacer" aria-hidden />

          <CopyVal
            text={t.nakhlFinal}
            copied={copied}
            onCopy={onCopy}
            className="anker-final anker-final-green"
          >
            <span>Итоговое значение нахлестки</span>
            <strong>{t.nakhlFinal} мм</strong>
          </CopyVal>
        </div>
      </div>

      {copied ? (
        <div className="anker-copy-bar">
          <span className="copy-toast">Скопировано: {copied}</span>
        </div>
      ) : null}

      <section className="section anker-ref">
        <div className="anker-ref-head">
          <h3>Справочные длины (A500)</h3>
          <div className="pill-row">
            {ankerRef.refTables.map((tbl) => (
              <button
                key={tbl.beton}
                type="button"
                className={`pill ${refBeton === tbl.beton ? 'active' : ''}`}
                onClick={() => setRefBeton(tbl.beton)}
              >
                {tbl.beton}
              </button>
            ))}
          </div>
        </div>
        <div className="table-wrap anker-ref-table-wrap">
          <table className="data-table anker-ref-table">
            <thead>
              <tr>
                <th rowSpan={2}>Ø</th>
                <th className="col-nakhl" colSpan={2}>
                  Нахлест
                </th>
                <th className="col-anker" colSpan={2}>
                  Анкеровка
                </th>
                <th className="col-styk" colSpan={4}>
                  Стыковка
                </th>
              </tr>
              <tr>
                <th className="col-nakhl-sub">Lр.н.</th>
                <th className="col-nakhl-sub">Lсж.н.</th>
                <th className="col-anker-sub">Lр.а.</th>
                <th className="col-anker-sub">Lсж.а.</th>
                <th className="col-styk-sub">1,3 Lр.н.</th>
                <th className="col-styk-sub">2 Lр.а.</th>
                <th className="col-styk-sub">2,3 Lр.н.</th>
                <th className="col-styk-sub">Lр.н.</th>
              </tr>
            </thead>
            <tbody>
              {refTable.rows.map((row) => {
                const cells = [
                  row.d,
                  row.nakhl_t,
                  row.nakhl_c,
                  row.anker_t,
                  row.anker_c,
                  row.styk_1,
                  row.styk_2,
                  row.styk_3,
                  row.styk_4,
                ]
                return (
                  <tr key={String(row.d)} className={row.d === d ? 'is-active-d' : ''}>
                    {cells.map((val, i) => {
                      const text = String(val)
                      return (
                        <td key={i}>
                          <button
                            type="button"
                            className={`anker-ref-copy${copied === text ? ' copied' : ''}`}
                            data-copy-value={text}
                            title="Клик — скопировать"
                            onClick={(e) => {
                              if (e.currentTarget.dataset.formulaPicked === '1') {
                                delete e.currentTarget.dataset.formulaPicked
                                return
                              }
                              void onCopy(text)
                            }}
                          >
                            {i === 0 ? <strong>{text}</strong> : text}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </SheetShell>
  )
}
