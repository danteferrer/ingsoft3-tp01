import { useEffect, useState } from 'react'
import { listarAutos } from '../api/autos'
import { listarMarcas } from '../api/marcas'
import FiltroMarca from './FiltroMarca'

function ListaAutos({ refreshSignal }) {
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ListaAutos
