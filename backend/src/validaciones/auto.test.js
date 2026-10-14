import { describe, it, expect } from 'vitest';
import { validarPatente, validarAnio, validarKilometraje, validarCamposAuto } from './auto.js';

describe('validarPatente', () => {
  it.each(['ABC123', 'AB123CD'])('acepta una patente válida (%s)', (patente) => {
    expect(validarPatente(patente).valida).toBe(true);
  });

  it.each(['', '123ABC', 'AB12CD'])('rechaza una patente inválida (%s)', (patente) => {
    const resultado = validarPatente(patente);
    expect(resultado.valida).toBe(false);
    expect(resultado.error).toContain('Patente inválida');
  });
});

describe('validarAnio', () => {
  it.each([1990, 2020])('acepta un año válido (%i)', (anio) => {
    expect(validarAnio(anio).valida).toBe(true);
  });

  it('rechaza un año en el futuro', () => {
    const actual = new Date().getFullYear();
    const resultado = validarAnio(actual + 5);
    expect(resultado.valida).toBe(false);
    expect(resultado.error).toContain(`${actual + 1}`);
  });
});

describe('validarKilometraje', () => {
  it.each([0, 1500])('acepta un kilometraje válido (%i)', (km) => {
    expect(validarKilometraje(km).valida).toBe(true);
  });

  it('rechaza un kilometraje negativo', () => {
    const resultado = validarKilometraje(-1);
    expect(resultado.valida).toBe(false);
    expect(resultado.error).toContain('negativo');
  });
});

describe('validarCamposAuto', () => {
  it('no devuelve errores cuando los campos presentes son válidos', () => {
    const errores = validarCamposAuto({ patente: 'AB123CD', anio: 2020, kilometraje: 0 });
    expect(errores).toEqual([]);
  });

  it('junta un error por cada campo inválido presente', () => {
    const errores = validarCamposAuto({ patente: '123', anio: 1800, kilometraje: -5 });
    expect(errores).toHaveLength(3);
  });
});
