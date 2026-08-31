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
    <>
      <h1>AutoColección</h1>
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
    </>
  )
}

export default App
