import { Fragment, useEffect, useState } from 'react'
import { listarAutos, eliminarAuto } from '../api/autos'
import { listarMarcas } from '../api/marcas'
import FiltroMarca from './FiltroMarca'

function ListaAutos({ refreshSignal, onEditar, onEliminado }) {
  const [autos, setAutos] = useState([])
  const [marcas, setMarcas] = useState([])
  const [marcaId, setMarcaId] = useState('')
  const [error, setError] = useState(null)
  const [expandidoId, setExpandidoId] = useState(null)

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

  function formatearUltimoService(auto) {
    if (!auto.ultimoServicioFecha && !auto.ultimoServicioKm) return '—'
    const fecha = auto.ultimoServicioFecha
      ? new Date(auto.ultimoServicioFecha + 'T00:00:00').toLocaleDateString('es-AR')
      : '—'
    const km = auto.ultimoServicioKm != null ? `${auto.ultimoServicioKm.toLocaleString('es-AR')} km` : '—'
    return `${fecha} · ${km}`
  }

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

  function toggleExpandido(id) {
    setExpandidoId((actual) => (actual === id ? null : id))
  }

  return (
    <div className="panel">
      <h2>Vehículos registrados</h2>
      <FiltroMarca marcas={marcas} value={marcaId} onChange={setMarcaId} />
      {error && <p className="error" role="alert">{error}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="col-expandir"></th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Año</th>
              <th>Patente</th>
              <th>Color</th>
              <th>Kilometraje</th>
              <th>Último service</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {autos.length === 0 && (
              <tr>
                <td colSpan={9} className="empty">
                  Sin vehículos todavía — cargá el primero arriba.
                </td>
              </tr>
            )}
            {autos.map((auto) => {
              const expandido = expandidoId === auto.id
              return (
                <Fragment key={auto.id}>
                  <tr
                    className="fila-clickeable"
                    onClick={() => toggleExpandido(auto.id)}
                  >
                    <td className={`col-expandir chevron ${expandido ? 'abierto' : ''}`}>▸</td>
                    <td>{auto.Marca?.nombre}</td>
                    <td>{auto.modelo}</td>
                    <td>{auto.anio}</td>
                    <td className="patente">{auto.patente}</td>
                    <td>{auto.color}</td>
                    <td>{auto.kilometraje.toLocaleString('es-AR')} km</td>
                    <td>{formatearUltimoService(auto)}</td>
                    <td className="acciones" onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="btn-ghost" onClick={() => onEditar?.(auto)}>
                        Editar
                      </button>
                      <button type="button" className="btn-ghost btn-danger" onClick={() => handleEliminar(auto)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                  {expandido && (
                    <tr className="fila-notas">
                      <td></td>
                      <td colSpan={8}>
                        <strong>Notas:</strong> {auto.notas || 'Sin notas cargadas.'}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ListaAutos
