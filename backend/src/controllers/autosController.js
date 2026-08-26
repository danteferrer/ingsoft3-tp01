const Auto = require('../models/Auto');
const Marca = require('../models/Marca');

function mensajeError(error) {
  if (error.errors?.length) {
    return error.errors.map((e) => e.message).join(', ');
  }
  return error.message;
}

async function listar(req, res) {
  try {
    const where = {};
    if (req.query.marcaId) {
      where.marcaId = req.query.marcaId;
    }
    const autos = await Auto.findAll({ where, include: Marca });
    res.json(autos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function obtener(req, res) {
  try {
    const auto = await Auto.findByPk(req.params.id, { include: Marca });
    if (!auto) {
      return res.status(404).json({ error: 'Auto no encontrado' });
    }
    res.json(auto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function crear(req, res) {
  try {
    const auto = await Auto.create(req.body);
    res.status(201).json(auto);
  } catch (error) {
    res.status(400).json({ error: mensajeError(error) });
  }
}

async function actualizar(req, res) {
  try {
    const auto = await Auto.findByPk(req.params.id);
    if (!auto) {
      return res.status(404).json({ error: 'Auto no encontrado' });
    }
    await auto.update(req.body);
    res.json(auto);
  } catch (error) {
    res.status(400).json({ error: mensajeError(error) });
  }
}

async function eliminar(req, res) {
  try {
    const auto = await Auto.findByPk(req.params.id);
    if (!auto) {
      return res.status(404).json({ error: 'Auto no encontrado' });
    }
    await auto.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
