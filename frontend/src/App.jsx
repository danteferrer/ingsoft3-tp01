import { useState } from 'react'
import ListaAutos from './components/ListaAutos'
import FormularioAuto from './components/FormularioAuto'

function App() {
  const [refreshSignal, setRefreshSignal] = useState(0)
  const [autoEditando, setAutoEditando] = useState(null)

  function refrescar() {
    setRefreshSignal((s) => s + 1)
  }

  function handleGuardado() {
    refrescar()
    setAutoEditando(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>AutoColección</h1>
        <p className="tagline">Los Santos Customs · Registro de vehículos</p>
      </header>
      <main className="app-main">
        <FormularioAuto
          auto={autoEditando}
          onGuardado={handleGuardado}
          onCancelar={autoEditando ? () => setAutoEditando(null) : undefined}
        />
        <ListaAutos
          refreshSignal={refreshSignal}
          onEditar={setAutoEditando}
          onEliminado={refrescar}
        />
      </main>
    </div>
  )
}

export default App
