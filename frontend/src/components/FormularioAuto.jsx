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
  }
}

function FormularioAuto({ auto, onGuardado }) {
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
    <form onSubmit={handleSubmit}>
      <h2>{esEdicion ? 'Editar auto' : 'Nuevo auto'}</h2>
      {error && <p role="alert">{error}</p>}
      <div>
        <label>
          Marca:{' '}
          <select value={form.marcaId} onChange={handleChange('marcaId')} required>
            <option value="">Seleccionar marca</option>
            {marcas.map((marca) => (
              <option key={marca.id} value={marca.id}>
                {marca.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <label>
          Modelo:{' '}
          <input value={form.modelo} onChange={handleChange('modelo')} required />
        </label>
      </div>
      <div>
        <label>
          Año:{' '}
          <input type="number" value={form.anio} onChange={handleChange('anio')} required />
        </label>
      </div>
      <div>
        <label>
          Patente:{' '}
          <input value={form.patente} onChange={handleChange('patente')} required />
        </label>
      </div>
      <div>
        <label>
          Color:{' '}
          <input value={form.color} onChange={handleChange('color')} required />
        </label>
      </div>
      <div>
        <label>
          Kilometraje:{' '}
          <input
            type="number"
            value={form.kilometraje}
            onChange={handleChange('kilometraje')}
          />
        </label>
      </div>
      <div>
        <label>
          Notas:{' '}
          <textarea value={form.notas} onChange={handleChange('notas')} />
        </label>
      </div>
      <button type="submit" disabled={guardando}>
        {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear auto'}
      </button>
    </form>
  )
}

export default FormularioAuto
