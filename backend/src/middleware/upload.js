const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { UPLOADS_BASE } = require('../config');

const ALLOWED_MODULES = ['uploads', 'veiculos', 'cnhs', 'manutencoes', 'multas', 'contratos-seguro', 'pagamentos-seguro', 'pagamento-documentos', 'higienizacao', 'abastecimentos', 'cidades', 'vistorias', 'pneus'];

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

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
    const ext = path.extname(file.originalname || '').toLowerCase();
    const rawBase = path.basename(file.originalname || 'upload', ext);
    const safeBase = rawBase
      .replace(/[^a-z0-9._-]/gi, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 60) || 'upload';
    const ts = Date.now();
    cb(null, `${ts}_${safeBase}${ext}`);
  }
});

const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE_BYTES }, fileFilter });

const parseUpload = upload.any();

function filePathFor(fieldName, req) {
  if (!req.files || !Array.isArray(req.files)) return null;
  const file = req.files.find((item) => item.fieldname === fieldName);
  if (!file?.path) return null;
  const resolved = path.resolve(file.path);
  const uploadsRoot = path.resolve(UPLOADS_BASE);
  if (!resolved.startsWith(uploadsRoot)) return null;
  return path.relative(process.cwd(), resolved);
}

module.exports = { parseUpload, filePathFor };
