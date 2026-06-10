const { Router } = require('express');
const ctrl = require('../controllers/motoristaHistorico.controller');

const router = Router();
router.get('/motorista/historico/:registro', ctrl.historico);

function registerRoutes(app) { app.use('/api', router); }
module.exports = { registerRoutes };
