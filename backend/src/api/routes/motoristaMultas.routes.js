const { Router } = require('express');
const ctrl = require('../controllers/motoristaMultas.controller');

const router = Router();
router.get('/motorista-multas', ctrl.list);
router.get('/motorista-multas/:registro', ctrl.detail);

function registerRoutes(app) { app.use('/api', router); }
module.exports = { registerRoutes };
