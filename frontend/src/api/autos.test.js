import { describe, it, expect, vi, afterEach } from 'vitest'
import { listarAutos, crearAuto, actualizarAuto, eliminarAuto } from './autos'

function respuesta(ok, body) {
  return { ok, json: () => Promise.resolve(body) }
}

describe('api/autos', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('listarAutos lanza un error legible cuando la respuesta no es ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(false, {})))

    await expect(listarAutos()).rejects.toThrow('Error al obtener autos')
  })

  it('listarAutos devuelve los datos y filtra por marcaId cuando se pasa', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuesta(true, [{ id: 1 }]))
    vi.stubGlobal('fetch', fetchMock)

    const autos = await listarAutos(5)

    expect(fetchMock).toHaveBeenCalledWith('/api/autos?marcaId=5')
    expect(autos).toEqual([{ id: 1 }])
  })

  it('actualizarAuto llama a PUT /api/autos/:id con el body correcto', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuesta(true, { id: 3 }))
    vi.stubGlobal('fetch', fetchMock)
    const cambios = { kilometraje: 12345 }

    await actualizarAuto(3, cambios)

    expect(fetchMock).toHaveBeenCalledWith('/api/autos/3', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify(cambios),
    }))
  })

  it('crearAuto lanza el error que devuelve el backend cuando rechaza el auto', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(false, { error: 'Patente inválida' })))

    await expect(crearAuto({ patente: '123' })).rejects.toThrow('Patente inválida')
  })

  it('eliminarAuto lanza un error legible cuando la respuesta no es ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta(false, { error: 'no existe' })))

    await expect(eliminarAuto(9)).rejects.toThrow('no existe')
  })

  it('crearAuto llama a POST /api/autos con el body correcto', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuesta(true, { id: 1 }))
    vi.stubGlobal('fetch', fetchMock)
    const auto = { patente: 'AB123CD', anio: 2020 }

    await crearAuto(auto)

    expect(fetchMock).toHaveBeenCalledWith('/api/autos', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(auto),
    }))
  })

  it('eliminarAuto llama a DELETE /api/autos/:id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respuesta(true, {}))
    vi.stubGlobal('fetch', fetchMock)

    await eliminarAuto(7)

    expect(fetchMock).toHaveBeenCalledWith('/api/autos/7', { method: 'DELETE' })
  })
})
