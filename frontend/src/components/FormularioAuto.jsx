import { useEffect, useState } from 'react'
import { crearAuto, actualizarAuto } from '../api/autos'
import { listarMarcas } from '../api/marcas'

const formVacio = {
  marcaId: '',
  modelo: '',
  anio: '',
  patente: '',
  color: '',
  kilometraje: '',
  notas: '',
  ultimoServicioFecha: '',
  ultimoServicioKm: '',
}

function autoAForm(auto) {
  if (!auto) return formVacio
  return {
    marcaId: auto.marcaId ?? auto.Marca?.id ?? '',
    modelo: auto.modelo ?? '',
    anio: auto.anio ?? '',
    patente: auto.patente ?? '',
    color: auto.color ?? '',
    kilometraje: auto.kilometraje ?? '',
    notas: auto.notas ?? '',
    ultimoServicioFecha: auto.ultimoServicioFecha ?? '',
    ultimoServicioKm: auto.ultimoServicioKm ?? '',
  }
}

function FormularioAuto({ auto, onGuardado, onCancelar }) {
  const esEdicion = Boolean(auto)
  const [marcas, setMarcas] = useState([])
  const [form, setForm] = useState(() => autoAForm(auto))
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    listarMarcas()
      .then(setMarcas)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    setForm(autoAForm(auto))
  }, [auto])

  function handleChange(campo) {
    return (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setGuardando(true)
    const payload = {
      marcaId: form.marcaId ? Number(form.marcaId) : null,
      modelo: form.modelo,
      anio: Number(form.anio),
      patente: form.patente,
      color: form.color,
      kilometraje: form.kilometraje ? Number(form.kilometraje) : 0,
      notas: form.notas || null,
      ultimoServicioFecha: form.ultimoServicioFecha || null,
      ultimoServicioKm: form.ultimoServicioKm ? Number(form.ultimoServicioKm) : null,
    }
    try {
      if (esEdicion) {
        await actualizarAuto(auto.id, payload)
      } else {
        await crearAuto(payload)
        setForm(formVacio)
      }
      onGuardado?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form className="panel form-auto" onSubmit={handleSubmit}>
      <h2>{esEdicion ? 'Editar vehículo' : 'Registrar vehículo'}</h2>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="campo">
        <label htmlFor="f-marca">Marca</label>
        <select id="f-marca" value={form.marcaId} onChange={handleChange('marcaId')} required>
          <option value="">Seleccionar marca</option>
          {marcas.map((marca) => (
            <option key={marca.id} value={marca.id}>
              {marca.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="f-modelo">Modelo</label>
        <input id="f-modelo" value={form.modelo} onChange={handleChange('modelo')} required />
      </div>
      <div className="campo">
        <label htmlFor="f-anio">Año</label>
        <input id="f-anio" type="number" value={form.anio} onChange={handleChange('anio')} required />
      </div>
      <div className="campo">
        <label htmlFor="f-patente">Patente</label>
        <input id="f-patente" value={form.patente} onChange={handleChange('patente')} required />
      </div>
      <div className="campo">
        <label htmlFor="f-color">Color</label>
        <input id="f-color" value={form.color} onChange={handleChange('color')} required />
      </div>
      <div className="campo">
        <label htmlFor="f-km">Kilometraje</label>
        <input
          id="f-km"
          type="number"
          value={form.kilometraje}
          onChange={handleChange('kilometraje')}
        />
      </div>
      <div className="campo">
        <label htmlFor="f-service-fecha">Último service (fecha)</label>
        <input
          id="f-service-fecha"
          type="date"
          value={form.ultimoServicioFecha}
          onChange={handleChange('ultimoServicioFecha')}
        />
      </div>
      <div className="campo">
        <label htmlFor="f-service-km">Último service (km)</label>
        <input
          id="f-service-km"
          type="number"
          value={form.ultimoServicioKm}
          onChange={handleChange('ultimoServicioKm')}
        />
      </div>
      <div className="campo campo-full">
        <label htmlFor="f-notas">Notas</label>
        <textarea id="f-notas" value={form.notas} onChange={handleChange('notas')} />
      </div>
      <div className="acciones-form">
        <button type="submit" className="btn-primary" disabled={guardando}>
          {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Registrar'}
        </button>
        {esEdicion && onCancelar && (
          <button type="button" className="btn-ghost" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

export default FormularioAuto
