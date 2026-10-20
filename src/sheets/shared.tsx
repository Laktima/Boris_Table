import type { ReactNode } from 'react'

export function SheetShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="sheet-panel">
      <h2>{title}</h2>
      {subtitle ? <p className="subtitle">{subtitle}</p> : null}
      {children}
    </div>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  )
}
