const Marca = require('../models/Marca');

function mensajeError(error) {
  if (error.errors?.length) {
    return error.errors.map((e) => e.message).join(', ');
  }
  return error.message;
}

async function listar(req, res) {
  try {
    const marcas = await Marca.findAll();
    res.json(marcas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function crear(req, res) {
  try {
    const marca = await Marca.create(req.body);
    res.status(201).json(marca);
  } catch (error) {
    res.status(400).json({ error: mensajeError(error) });
  }
}

module.exports = { listar, crear };
