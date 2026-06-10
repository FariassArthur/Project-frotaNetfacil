const { Router } = require('express');
const ctrl = require('../controllers/manutencaoPreventiva.controller');
const { requireRole } = require('../../middleware/auth');

const router = Router();
router.get('/manutencao-preventiva/config', ctrl.listConfig);
router.post('/manutencao-preventiva/config', ctrl.createConfig);
router.put('/manutencao-preventiva/config/:id', ctrl.updateConfig);
router.delete('/manutencao-preventiva/config/:id', requireRole('admin', 'root'), ctrl.deleteConfig);
router.get('/manutencao-preventiva/alertas', ctrl.alertas);
router.post('/manutencao-preventiva/checkin', ctrl.checkin);

function registerRoutes(app) { app.use('/api', router); }
module.exports = { registerRoutes };
