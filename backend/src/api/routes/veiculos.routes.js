const { Router } = require('express');
const ctrl = require('../controllers/veiculos.controller');
const { requireRole } = require('../../middleware/auth');

const router = Router();
router.get('/veiculos', ctrl.list);
router.get('/veiculos/:placa', ctrl.get);
router.post('/veiculos', ctrl.create);
router.put('/veiculos/:placa', ctrl.update);
router.delete('/veiculos/:placa', requireRole('admin', 'root'), ctrl.remove);

function registerRoutes(app) { app.use('/api', router); }
module.exports = { registerRoutes };
