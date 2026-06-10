const { Router } = require('express');
const ctrl = require('../controllers/gastos.controller');

const router = Router();
router.get('/gastos/:placa', ctrl.byPlaca);
router.get('/gastos', ctrl.list);

function registerRoutes(app) { app.use('/api', router); }
module.exports = { registerRoutes };
