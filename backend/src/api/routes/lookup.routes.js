const { Router } = require('express');
const ctrl = require('../controllers/lookup.controller');

const router = Router();
router.get('/health', ctrl.health);
router.get('/combustiveis', ctrl.listCombustiveis);
router.get('/tipos-manutencao', ctrl.listTiposManutencao);
router.get('/configuracoes', ctrl.getConfiguracoes);
router.post('/configuracoes', ctrl.upsertConfiguracoes);
router.put('/configuracoes', ctrl.upsertConfiguracoes);
router.get('/versao', ctrl.getVersao);

function registerRoutes(app) { app.use('/api', router); }
module.exports = { registerRoutes };
