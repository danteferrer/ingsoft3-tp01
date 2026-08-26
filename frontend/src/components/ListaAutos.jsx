import { useEffect, useState } from 'react'
import { listarAutos, eliminarAuto } from '../api/autos'
import { listarMarcas } from '../api/marcas'
import FiltroMarca from './FiltroMarca'

function ListaAutos({ refreshSignal, onEditar, onEliminado }) {
  const [autos, setAutos] = useState([])
  const [marcas, setMarcas] = useState([])
  const [marcaId, setMarcaId] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    listarMarcas()
      .then(setMarcas)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    listarAutos(marcaId || undefined)
      .then(setAutos)
      .catch((err) => setError(err.message))
  }, [marcaId, refreshSignal])

  async function handleEliminar(auto) {
    const confirmado = window.confirm(`¿Eliminar el auto con patente ${auto.patente}?`)
    if (!confirmado) return
    try {
      await eliminarAuto(auto.id)
      onEliminado?.()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <h2>Autos</h2>
      <FiltroMarca marcas={marcas} value={marcaId} onChange={setMarcaId} />
      {error && <p role="alert">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Año</th>
            <th>Patente</th>
            <th>Color</th>
            <th>Kilometraje</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {autos.map((auto) => (
            <tr key={auto.id}>
              <td>{auto.Marca?.nombre}</td>
              <td>{auto.modelo}</td>
              <td>{auto.anio}</td>
              <td>{auto.patente}</td>
              <td>{auto.color}</td>
              <td>{auto.kilometraje}</td>
              <td>
                <button type="button" onClick={() => onEditar?.(auto)}>
                  Editar
                </button>{' '}
                <button type="button" onClick={() => handleEliminar(auto)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ListaAutos
