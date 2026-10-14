import { describe, it, expect, vi, afterEach } from 'vitest';

const Auto = require('../models/Auto');
const { crear } = require('./autosController');

function crearRes() {
  return {
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('crear (mock del modelo Auto)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('crea el auto y responde 201 cuando el modelo lo acepta', async () => {
    const autoCreado = { id: 1, patente: 'AB123CD', anio: 2020, kilometraje: 0 };
    vi.spyOn(Auto, 'create').mockResolvedValueOnce(autoCreado);
    const req = { body: { patente: 'AB123CD', anio: 2020, kilometraje: 0 } };
    const res = crearRes();

    await crear(req, res);

    expect(Auto.create).toHaveBeenCalledWith(req.body);
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual(autoCreado);
  });

  it('responde 400 con un mensaje legible cuando la patente está duplicada', async () => {
    vi.spyOn(Auto, 'create').mockRejectedValueOnce({
      errors: [{ message: 'patente must be unique' }],
    });
    const req = { body: { patente: 'AB123CD', anio: 2020, kilometraje: 0 } };
    const res = crearRes();

    await crear(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('patente must be unique');
  });
});
