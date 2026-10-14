import { describe, it, expect } from 'vitest'
import { formatearUltimoService } from './formato'

describe('formatearUltimoService', () => {
  it('devuelve "—" cuando no hay fecha ni kilometraje de service', () => {
    expect(formatearUltimoService({})).toBe('—')
  })

  it.each([
    [{ ultimoServicioFecha: '2024-01-15', ultimoServicioKm: 50000 }, '15/1/2024 · 50.000 km'],
    [{ ultimoServicioFecha: '2024-01-15', ultimoServicioKm: null }, '15/1/2024 · —'],
    [{ ultimoServicioFecha: null, ultimoServicioKm: 50000 }, '— · 50.000 km'],
  ])('formatea %j como "%s"', (auto, esperado) => {
    expect(formatearUltimoService(auto)).toBe(esperado)
  })
})
