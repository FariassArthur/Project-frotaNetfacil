const { Router } = require('express');
const ctrl = require('../controllers/logs.controller');
const { requireRole } = require('../../middleware/auth');

const router = Router();
router.get('/logs', requireRole('admin', 'root'), ctrl.list);
router.get('/logs/:id', requireRole('admin', 'root'), ctrl.get);

function registerRoutes(app) { app.use('/api', router); }
module.exports = { registerRoutes };
