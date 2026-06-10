const { Router } = require('express');
const ctrl = require('../controllers/cidades.controller');

const router = Router();
router.get('/cidades', ctrl.list);
router.get('/cidades/:id', ctrl.get);

function registerRoutes(app) { app.use('/api', router); }
module.exports = { registerRoutes };
