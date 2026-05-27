const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { UPLOADS_BASE } = require('../config');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const moduleName = req.body?.module ? String(req.body.module) : 'uploads';
    const dest = path.join(UPLOADS_BASE, moduleName);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const original = file.originalname.replace(/[^a-z0-9\.\-_]/gi, '_');
    const ts = new Date().toISOString().replace(/[:]/g, '-');
    cb(null, `${ts}_${original}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

const parseUpload = upload.any();

function filePathFor(fieldName, req) {
  if (!req.files || !Array.isArray(req.files)) return null;
  const file = req.files.find((item) => item.fieldname === fieldName);
  return file ? path.relative(process.cwd(), file.path) : null;
}

module.exports = { parseUpload, filePathFor };
