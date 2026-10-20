import { useEffect, useState } from 'react'
import { Tabs } from './components/Tabs'
import { Calculator } from './components/Calculator'
import { Footer } from './components/Footer'
import { DEFAULT_SHEET_ID, SHEETS } from './sheets'

const DESKTOP_MQ = '(min-width: 981px)'

function useIsDesktop() {
  const [desktop, setDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(DESKTOP_MQ).matches : true,
  )

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ)
    const onChange = () => setDesktop(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return desktop
}

export default function App() {
  const [active, setActive] = useState(DEFAULT_SHEET_ID)
  const sheet = SHEETS.find((s) => s.id === active) ?? SHEETS[0]
  const isDesktop = useIsDesktop()

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

      <div className={`layout${isDesktop ? '' : ' layout-mobile'}`}>
        <main className="main">{sheet.render()}</main>
        {isDesktop ? (
          <aside className="sidebar" aria-label="Калькулятор">
            <Calculator />
          </aside>
        ) : null}
      </div>

      <Footer />
    </div>
  )
}
