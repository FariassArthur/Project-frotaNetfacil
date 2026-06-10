const { Router } = require('express');
const ctrl = require('../controllers/ordensServico.controller');
const { requireRole } = require('../../middleware/auth');

const router = Router();
router.get('/ordens-servico', ctrl.list);
router.get('/ordens-servico/:id', ctrl.get);
router.post('/ordens-servico', ctrl.create);
router.put('/ordens-servico/:id', ctrl.update);
router.patch('/ordens-servico/:id/status', ctrl.updateStatus);
router.delete('/ordens-servico/:id', requireRole('admin', 'root'), ctrl.remove);

function registerRoutes(app) { app.use('/api', router); }
module.exports = { registerRoutes };
