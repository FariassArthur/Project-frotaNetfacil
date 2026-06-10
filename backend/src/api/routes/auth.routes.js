const { Router } = require('express');
const ctrl = require('../controllers/auth.controller');

const router = Router();
router.post('/login', ctrl.login);
router.get('/me', ctrl.me);
router.post('/logout', ctrl.logout);

function registerRoutes(app) { app.use('/api', router); }
module.exports = { registerRoutes };
