const express = require('express');
const router = express.Router();
const marcasController = require('../controllers/marcasController');

router.get('/', marcasController.listar);
router.post('/', marcasController.crear);

module.exports = router;
