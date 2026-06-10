const { Router } = require('express');
const ctrl = require('../controllers/comparativoVeiculos.controller');

const router = Router();
router.get('/veiculos/comparativo', ctrl.comparativo);

function registerRoutes(app) { app.use('/api', router); }
module.exports = { registerRoutes };
