const { Router } = require('express');
const ctrl = require('../controllers/dashboard.controller');

const router = Router();
router.get('/dashboard/graficos', ctrl.graficos);
router.get('/dashboard/relatorio-custos', ctrl.relatorioCustos);
router.get('/dashboard', ctrl.dashboard);
router.get('/dashboard/notificacoes', ctrl.notificacoes);
router.get('/dashboard/pagamentos', ctrl.pagamentos);
router.get('/dashboard/custo-km', ctrl.custoKm);
router.get('/dashboard/consumo', ctrl.consumo);
router.get('/dashboard/pneus', ctrl.pneus);
router.get('/dashboard/ordens-servico', ctrl.ordensServicoStats);

function registerRoutes(app) { app.use('/api', router); }
module.exports = { registerRoutes };
