export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="sheet-panel">
      <h2>{title}</h2>
      <p className="subtitle">Раздел появится здесь позже</p>
      <div className="empty-state coming-soon">В разработке</div>
    </div>
  )
}
