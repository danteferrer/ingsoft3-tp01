const express = require('express');
const router = express.Router();
const autosController = require('../controllers/autosController');

router.get('/', autosController.listar);
router.get('/:id', autosController.obtener);
router.post('/', autosController.crear);
router.put('/:id', autosController.actualizar);
router.delete('/:id', autosController.eliminar);

module.exports = router;
