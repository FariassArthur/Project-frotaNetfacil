const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const ctrl = require('../controllers/importarCSV.controller');
const { requireRole } = require('../../middleware/auth');

const upload = multer({ dest: path.join(__dirname, '../../temp_import') });

const router = Router();
router.get('/importar/csv/modelo/:tabela', ctrl.downloadModelo);
router.post('/importar/csv/preview', requireRole('admin', 'root'), upload.single('file'), ctrl.previewImport);
router.post('/importar/csv', requireRole('admin', 'root'), upload.single('file'), ctrl.doImport);

function registerRoutes(app) { app.use('/api', router); }
module.exports = { registerRoutes };
