const { Router } = require('express');
const ctrl = require('../controllers/calendario.controller');
const { verifyAuth } = require('../../middleware/auth');

const router = Router();
router.get('/calendario/eventos', verifyAuth, ctrl.eventos);

function registerRoutes(app) { app.use('/api', router); }
module.exports = { registerRoutes };
