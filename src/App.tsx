import { useState } from 'react'
import { Tabs } from './components/Tabs'
import { Calculator } from './components/Calculator'
import { Footer } from './components/Footer'
import { SHEETS } from './sheets'

export default function App() {
  const [active, setActive] = useState(SHEETS[0].id)
  const sheet = SHEETS.find((s) => s.id === active) ?? SHEETS[0]

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="brand">
            <h1>Полезное для расчетов</h1>
            <p>Справочники и калькуляторы конструктора</p>
          </div>
          <Tabs
            tabs={SHEETS.map((s) => ({ id: s.id, label: s.label }))}
            active={active}
            onChange={setActive}
          />
        </div>
      </header>

      <div className="layout">
        <main className="main">{sheet.render()}</main>
        <aside className="sidebar" aria-label="Калькулятор">
          <Calculator />
        </aside>
      </div>

      <Footer />
    </div>
  )
}
