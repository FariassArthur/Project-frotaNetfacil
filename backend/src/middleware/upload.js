const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { UPLOADS_BASE } = require('../config');

const ALLOWED_MODULES = ['uploads', 'veiculos', 'cnhs', 'manutencoes', 'multas', 'contratos-seguro', 'pagamentos-seguro', 'pagamento-documentos', 'higienizacao', 'abastecimentos', 'cidades', 'vistorias', 'pneus'];

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

function sanitizeModuleName(name) {
  const safe = String(name || 'uploads').replace(/[^a-z0-9_-]/gi, '');
  return ALLOWED_MODULES.includes(safe) ? safe : 'uploads';
}

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}. Permitidos apenas: ${ALLOWED_MIMETYPES.join(', ')}`));
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const moduleName = sanitizeModuleName(req.body?.module);
    const dest = path.join(UPLOADS_BASE, moduleName);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = file.originalname
      .replace(/[^a-z0-9_-]/gi, '_')
      .replace(/\.[^.]+$/, '')
      .substring(0, 60);
    const ts = Date.now();
    cb(null, `${ts}_${safeName}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 }, fileFilter });

const parseUpload = upload.any();

function filePathFor(fieldName, req) {
  if (!req.files || !Array.isArray(req.files)) return null;
  const file = req.files.find((item) => item.fieldname === fieldName);
  return file ? path.relative(process.cwd(), file.path) : null;
}

module.exports = { parseUpload, filePathFor };
