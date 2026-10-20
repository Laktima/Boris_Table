export type TabItem = { id: string; label: string }

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <nav className="tabs" role="tablist" aria-label="Листы">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          className={`tab ${active === t.id ? 'active' : ''}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  )
}
