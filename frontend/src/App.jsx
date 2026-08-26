import { useState } from 'react'
import ListaAutos from './components/ListaAutos'
import FormularioAuto from './components/FormularioAuto'

function App() {
  const [refreshSignal, setRefreshSignal] = useState(0)

  function handleGuardado() {
    setRefreshSignal((s) => s + 1)
  }

  return (
    <>
      <h1>AutoColección</h1>
      <FormularioAuto onGuardado={handleGuardado} />
      <ListaAutos refreshSignal={refreshSignal} />
    </>
  )
}

export default App
