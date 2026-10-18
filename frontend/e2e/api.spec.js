import { test, expect } from '@playwright/test'

const API = process.env.API_BASE_URL

function patenteUnica() {
  const ms = String(Date.now() % 1000).padStart(3, '0')
  return `ZZ${ms}ZZ`
}

async function marcaIdDisponible(request) {
  const marcas = await (await request.get(`${API}/api/marcas`)).json()
  return marcas[0].id
}

test.describe('API de autos (QA real, sin navegador)', () => {
  test('alta + verificación + borrado', async ({ request }) => {
    const marcaId = await marcaIdDisponible(request)
    const patente = patenteUnica()

    const alta = await request.post(`${API}/api/autos`, {
      data: { modelo: 'Integración', anio: 2020, patente, color: 'Gris', kilometraje: 0, marcaId },
    })
    expect(alta.status()).toBe(201)

    // no confío en lo que contestó el POST: releo la lista
    const lista = await (await request.get(`${API}/api/autos`)).json()
    const creado = lista.find((a) => a.patente === patente)
    expect(creado).toBeTruthy()

    const borrado = await request.delete(`${API}/api/autos/${creado.id}`)
    expect(borrado.status()).toBe(204)

    const listaFinal = await (await request.get(`${API}/api/autos`)).json()
    expect(listaFinal.find((a) => a.patente === patente)).toBeUndefined()
  })

  test('alta inválida: patente con formato incorrecto no crea nada', async ({ request }) => {
    const marcaId = await marcaIdDisponible(request)
    const antes = await (await request.get(`${API}/api/autos`)).json()

    const alta = await request.post(`${API}/api/autos`, {
      data: { modelo: 'Inválido', anio: 2020, patente: '123', color: 'Gris', kilometraje: 0, marcaId },
    })
    expect(alta.status()).toBe(400)

    const despues = await (await request.get(`${API}/api/autos`)).json()
    expect(despues.length).toBe(antes.length)
  })

  test('patente duplicada: la api la rechaza con un mensaje legible', async ({ request }) => {
    const marcaId = await marcaIdDisponible(request)
    const patente = patenteUnica()
    const datos = { modelo: 'Duplicado', anio: 2020, patente, color: 'Gris', kilometraje: 0, marcaId }

    const primera = await request.post(`${API}/api/autos`, { data: datos })
    expect(primera.status()).toBe(201)
    const creado = await primera.json()

    const segunda = await request.post(`${API}/api/autos`, { data: datos })
    expect(segunda.status()).toBe(400)
    const error = await segunda.json()
    expect(error.error).toContain('unique')

    await request.delete(`${API}/api/autos/${creado.id}`)
  })
})
