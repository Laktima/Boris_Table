import { useEffect, useMemo, useState } from 'react'
import { downloadChecklistXlsx, parseChecklistForExport } from '../lib/exportChecklist'

type State = Record<string, { checked: boolean; comment: string }>

export function ChecklistView({
  sheetId,
  aoa,
  downloadName,
}: {
  sheetId: string
  aoa: unknown[][]
  downloadName?: string
}) {
  const { title, rows } = useMemo(() => parseChecklistForExport(aoa), [aoa])
  const items = useMemo(() => rows.filter((r) => !r.isSection), [rows])
  const storageKey = `boris-check-${sheetId}`

  const [state, setState] = useState<State>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}') as State
      // Seed default comments from Excel (e.g. network paths) once
      const merged = { ...saved }
      for (const r of rows) {
        if (r.isSection || !r.defaultComment) continue
        if (!merged[r.id]) {
          merged[r.id] = { checked: false, comment: r.defaultComment }
        } else if (!merged[r.id].comment) {
          merged[r.id] = { ...merged[r.id], comment: r.defaultComment }
        }
      }
      return merged
    } catch {
      return {}
    }
  })

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state))
  }, [state, storageKey])

  const done = items.filter((it) => state[it.id]?.checked).length
  const [busy, setBusy] = useState(false)

  const onDownload = async () => {
    setBusy(true)
    try {
      const exportRows = rows.map((r) => {
        if (r.isSection) {
          return {
            numLabel: '',
            title: r.title,
            isSection: true as const,
            checked: false,
            comment: '',
          }
        }
        const st = state[r.id] ?? { checked: false, comment: r.defaultComment || '' }
        return {
          numLabel: r.numLabel,
          title: r.title,
          section: r.section,
          checked: st.checked,
          comment: st.comment,
        }
      })

      const safeFile =
        downloadName ||
        title
          .replace(/\s+/g, '_')
          .replace(/[^\wа-яёА-ЯЁ\-]+/gi, '')
          .slice(0, 60) ||
        sheetId

      await downloadChecklistXlsx(`${safeFile}.xlsx`, title, exportRows)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h2>{title}</h2>
      <p className="subtitle">
        Отмечено {done} из {items.length}. Состояние сохраняется в браузере.
      </p>
      <div className="toolbar">
        <button
          type="button"
          className="pill"
          onClick={() => {
            if (confirm('Сбросить все отметки?')) setState({})
          }}
        >
          Сбросить
        </button>
        <button type="button" className="pill pill-accent" onClick={onDownload} disabled={busy}>
          {busy ? 'Сохранение…' : 'Скачать Excel'}
        </button>
      </div>
      <div className="check-list">
        {rows.map((it) => {
          if (it.isSection) {
            return (
              <div key={it.id} className="check-section-title">
                {it.title}
              </div>
            )
          }
          const st = state[it.id] ?? { checked: false, comment: it.defaultComment || '' }
          return (
            <div key={it.id} className={`check-item ${st.checked ? 'done' : ''}`}>
              <input
                type="checkbox"
                checked={st.checked}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    [it.id]: { ...st, checked: e.target.checked },
                  }))
                }
              />
              <div>
                <div className="title">
                  {it.numLabel ? <strong>{it.numLabel}. </strong> : null}
                  {it.title}
                </div>
                <textarea
                  placeholder="Комментарий…"
                  value={st.comment}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      [it.id]: { ...st, comment: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="check-download-bar">
        <button type="button" className="download-btn" onClick={onDownload} disabled={busy}>
          {busy ? 'Сохранение…' : 'Скачать Excel с отметками и комментариями'}
        </button>
        <p className="note">
          Формат как в исходном файле: голубые секции, № 1.1…, границы, выпадающий список Да/Нет
        </p>
      </div>
    </div>
  )
}
