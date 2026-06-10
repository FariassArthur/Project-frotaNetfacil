const { Router } = require('express');
const ctrl = require('../controllers/logs.controller');

const router = Router();
router.get('/logs', ctrl.list);
router.get('/logs/:id', ctrl.get);

function registerRoutes(app) { app.use('/api', router); }
module.exports = { registerRoutes };
