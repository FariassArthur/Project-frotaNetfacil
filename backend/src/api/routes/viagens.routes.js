const { Router } = require('express');
const ctrl = require('../controllers/viagens.controller');
const { requireRole } = require('../../middleware/auth');

const router = Router();
router.get('/viagens/ativas', ctrl.ativas);
router.get('/viagens/estatisticas', ctrl.estatisticas);
router.get('/viagens/ultima/:placa', ctrl.ultima);
router.get('/viagens', ctrl.list);
router.get('/viagens/:id', ctrl.get);
router.post('/viagens', ctrl.create);
router.put('/viagens/:id', ctrl.update);
router.delete('/viagens/:id', requireRole('admin', 'root'), ctrl.remove);

function registerRoutes(app) { app.use('/api', router); }
module.exports = { registerRoutes };
