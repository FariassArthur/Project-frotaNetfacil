const { Router } = require('express');
const ctrl = require('../controllers/usuarios.controller');
const { requireRole } = require('../../middleware/auth');

const router = Router();
router.get('/usuarios', requireRole('admin', 'root'), ctrl.list);
router.get('/usuarios/:id', requireRole('admin', 'root'), ctrl.get);
router.post('/usuarios', requireRole('admin', 'root'), ctrl.create);
router.put('/usuarios/alterar-senha', ctrl.alterarSenha);
router.put('/usuarios/:id', requireRole('admin', 'root'), ctrl.update);
router.delete('/usuarios/:id', requireRole('admin', 'root'), ctrl.remove);

function registerRoutes(app) { app.use('/api', router); }
module.exports = { registerRoutes };
